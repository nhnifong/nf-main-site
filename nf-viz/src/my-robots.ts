import * as AuthManager from './auth.ts';
import type firebase from 'firebase/compat/app';

// Standalone "My Robots" page. Loading it forces a Firebase sign-in (the same
// FirebaseUI flow the playroom uses), then lists the robots bound to or shared
// with the account in a wide table. Doubles as the site's only obvious
// login/logout surface.

const userEmailEl = document.getElementById('user-email')!;
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status')!;
const tableWrap = document.getElementById('table-wrap')!;
const tbody = document.getElementById('robot-rows')!;

// Escape user-controlled strings (nicknames, ids) before injecting as HTML.
function escapeHtml(s: string): string {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

function renderRobots(robots: AuthManager.RobotInfo[]) {
    tbody.innerHTML = '';
    if (robots.length === 0) {
        statusEl.textContent =
            'No robots found. Connect in LAN mode and choose Bind from the run menu to add one.';
        tableWrap.hidden = true;
        return;
    }
    statusEl.textContent = '';
    tableWrap.hidden = false;
    for (const bot of robots) {
        const tr = document.createElement('tr');
        const online = bot.online;
        tr.appendChild(buildNicknameCell(bot));
        tr.insertAdjacentHTML('beforeend',
            `<td class="robot-id">${escapeHtml(bot.robotid)}</td>` +
            `<td class="role">${bot.role === 'owner' ? 'Owner' : 'Guest'}</td>` +
            `<td><span class="status-badge ${online ? 'online' : 'offline'}">` +
            `${online ? 'Online' : 'Offline'}</span></td>`);
        tr.appendChild(buildActionsCell(bot));
        tbody.appendChild(tr);
    }
}

// Nickname cell with inline edit. Owners get a pencil (🖉) that swaps the name
// for a text field and turns into a checkmark (✓) to save; guests see the name
// only. Renaming reuses the bind endpoint, which updates the nickname when the
// owner re-binds a robot they already own.
function buildNicknameCell(bot: AuthManager.RobotInfo): HTMLTableCellElement {
    const cell = document.createElement('td');
    cell.className = 'nickname';

    const label = document.createElement('span');
    label.className = 'nickname-text';
    label.textContent = bot.nickname || 'Unnamed Robot';
    cell.appendChild(label);

    if (bot.role !== 'owner') return cell; // only owners can rename

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '🖉';
    editBtn.title = 'Edit nickname';
    cell.appendChild(editBtn);

    let input: HTMLInputElement | null = null;

    function enterEdit() {
        input = document.createElement('input');
        input.className = 'nickname-input';
        input.value = bot.nickname || '';
        input.maxLength = 100;
        cell.replaceChild(input, label);
        editBtn.textContent = '✓';
        editBtn.title = 'Save nickname';
        input.focus();
        input.select();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); void save(); }
            else if (e.key === 'Escape') { cancelEdit(); }
        });
    }

    function cancelEdit() {
        if (!input) return;
        cell.replaceChild(label, input);
        input = null;
        editBtn.textContent = '🖉';
        editBtn.title = 'Edit nickname';
    }

    async function save() {
        if (!input) return;
        const newName = input.value.trim();
        // Empty or unchanged: just exit edit mode without a pointless request.
        if (newName === '' || newName === (bot.nickname || '')) { cancelEdit(); return; }
        editBtn.disabled = true;
        input.disabled = true;
        try {
            const token = await AuthManager.getAuthToken();
            await AuthManager.apiBindRobot(bot.robotid, newName, token);
            bot.nickname = newName;
            label.textContent = newName;
            cancelEdit();
        } catch (e) {
            console.error(e);
            alert('Failed to update the nickname. Please try again.');
            input.disabled = false;
        } finally {
            editBtn.disabled = false;
        }
    }

    editBtn.addEventListener('click', () => { input ? void save() : enterEdit(); });
    return cell;
}

// Row actions. "Control" opens the playroom for this robot and is available to
// owners and guests alike (both can drive a robot they have access to). Kick
// and unbind are owner-only.
function buildActionsCell(bot: AuthManager.RobotInfo): HTMLTableCellElement {
    const cell = document.createElement('td');
    cell.className = 'actions';

    const controlBtn = document.createElement('button');
    controlBtn.className = 'action-btn';
    controlBtn.textContent = 'Control';
    controlBtn.title = 'Open this robot in the playroom';
    controlBtn.addEventListener('click', () => {
        window.location.href = `/playroom?robotid=${encodeURIComponent(bot.robotid)}`;
    });
    cell.appendChild(controlBtn);

    if (bot.role !== 'owner') return cell;

    const kickBtn = document.createElement('button');
    kickBtn.className = 'action-btn';
    kickBtn.textContent = 'Kick offline';
    kickBtn.disabled = !bot.online; // nothing to do if already offline
    kickBtn.title = bot.online
        ? 'Force this robot to disconnect from the cloud'
        : 'Robot is already offline';
    kickBtn.addEventListener('click', () => kickRobot(bot, kickBtn));
    cell.appendChild(kickBtn);

    const unbindBtn = document.createElement('button');
    unbindBtn.className = 'action-btn danger';
    unbindBtn.textContent = 'Unbind';
    unbindBtn.title = 'Remove this robot from your account';
    unbindBtn.addEventListener('click', () => unbindRobot(bot, unbindBtn));
    cell.appendChild(unbindBtn);

    return cell;
}

// Force a robot offline, then refresh so its status reflects the change.
async function kickRobot(bot: AuthManager.RobotInfo, btn: HTMLButtonElement) {
    const name = bot.nickname || bot.robotid;
    if (!confirm(`Force "${name}" offline? It will be disconnected from the cloud.`)) return;
    btn.disabled = true;
    try {
        const token = await AuthManager.getAuthToken();
        await AuthManager.apiKickRobot(bot.robotid, token);
        await loadRobots();
    } catch (e) {
        console.error(e);
        alert('Failed to kick the robot offline. Please try again.');
        btn.disabled = false;
    }
}

// Unbind (delete) a robot from the account, then refresh the list.
async function unbindRobot(bot: AuthManager.RobotInfo, btn: HTMLButtonElement) {
    const name = bot.nickname || bot.robotid;
    if (!confirm(`Unbind "${name}" from your account? You'll need to re-bind in LAN mode to add it back.`)) return;
    btn.disabled = true;
    try {
        const token = await AuthManager.getAuthToken();
        await AuthManager.apiUnbindRobot(bot.robotid, token);
        await loadRobots();
    } catch (e) {
        console.error(e);
        alert('Failed to unbind the robot. Please try again.');
        btn.disabled = false;
    }
}

async function loadRobots() {
    statusEl.textContent = 'Loading your robots…';
    try {
        const token = await AuthManager.getAuthToken();
        const robots = await AuthManager.apiListRobots(token);
        renderRobots(robots);
    } catch (e) {
        console.error(e);
        statusEl.textContent = 'Could not load your robots. Please try again.';
    }
}

function showSignedIn(user: firebase.User) {
    userEmailEl.textContent = user.email ?? user.uid;
    logoutBtn.hidden = false;
}

// Closing the sign-in panel leaves the page in its signed-out state.
document.getElementById('btn-signin-back')?.addEventListener('click', () => {
    AuthManager.hideSignInUI();
});

logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    await AuthManager.signOut();
    // Reload so the page returns to its signed-out state and re-prompts login.
    window.location.reload();
});

// initAuth fires this on every auth-state change. When signed in we populate
// the header and list robots; when signed out we trigger the sign-in UI (which
// getAuthToken shows for us) and wait for the next state change.
AuthManager.initAuth((user) => {
    if (user) {
        showSignedIn(user);
        loadRobots();
    } else {
        userEmailEl.textContent = '';
        logoutBtn.hidden = true;
        tableWrap.hidden = true;
        statusEl.textContent = 'Please sign in to view your robots.';
        // Show the FirebaseUI panel; the next state change (above) does the rest.
        AuthManager.getAuthToken().catch((e) => {
            console.error(e);
            statusEl.textContent = 'Sign-in is required to view this page.';
        });
    }
});
