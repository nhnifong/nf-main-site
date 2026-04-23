import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

export interface RobotInfo {
  nickname: string;
  robotid: string;
  online: boolean;
  role: string;
}

const firebaseConfig = {
  apiKey: "AIzaSyBbPMdrWfinNR6at8YDvZJaXP8vdJbkmOI",
  authDomain: "nf-web-480214.firebaseapp.com",
  projectId: "nf-web-480214",
  storageBucket: "nf-web-480214.firebasestorage.app",
  messagingSenderId: "690802609278",
  appId: "1:690802609278:web:8165450202df8179029c2f"
};

let auth: firebase.auth.Auth | null = null;
let ui: firebaseui.auth.AuthUI | null = null;

/**
 * Initializes Firebase Auth and sets up a listener for user state changes.
 */
export function initAuth(onUserChange?: (user: firebase.User | null) => void) {
  if (auth) return;
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  ui = new firebaseui.auth.AuthUI(auth);

  if (onUserChange) {
    auth.onAuthStateChanged(onUserChange);
  }
}

/**
 * Hides the FirebaseUI sign-in panel and restores the landing options panel.
 * Call this from a "back" button in the sign-in panel.
 */
export function hideSignInUI() {
  ui?.reset();
  document.getElementById('signin-overlay')?.classList.add('hidden');
}

function showSignInUI(onSignedIn: (token: string) => void, onError: (e: unknown) => void) {
  ui!.reset();
  document.getElementById('signin-overlay')?.classList.remove('hidden');

  // Resolve once Firebase reports a signed-in user
  const unsubscribe = auth!.onAuthStateChanged(async (user) => {
    if (user) {
      unsubscribe();
      hideSignInUI();
      try {
        onSignedIn(await user.getIdToken());
      } catch (e) {
        onError(e);
      }
    }
  });

  ui!.start('#firebaseui-auth-container', {
    signInFlow: 'popup',
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.GithubAuthProvider.PROVIDER_ID,
      firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: () => false, // prevent redirect, we handle state ourselves
    },
  });
}

/**
 * Retrieves a valid ID token for the current user.
 * Shows the FirebaseUI sign-in panel if the user is not currently authenticated.
 */
export async function getAuthToken(): Promise<string> {
  if (!auth) throw new Error("Auth not initialized");

  // Wait for Firebase to restore auth state before checking (may be null briefly on page load)
  const user = await new Promise<firebase.User | null>((resolve) => {
    const unsubscribe = auth!.onAuthStateChanged((u) => { unsubscribe(); resolve(u); });
  });

  if (user) {
    return user.getIdToken(true);
  }

  return new Promise((resolve, reject) => {
    showSignInUI(resolve, reject);
  });
}

/**
 * API: Fetch the list of robots bound to the user.
 */
export async function apiListRobots(token: string): Promise<RobotInfo[]> {
  const response = await fetch('/listrobots', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Failed to fetch robot list: ${response.statusText}`);
  const result = await response.json();
  return result['bots'];
}

/**
 * API: Bind a specific robot ID to the user's account.
 */
export async function apiBindRobot(robotId: string, nickname: string, token: string): Promise<void> {
  const encodedNick = encodeURIComponent(nickname);
  const response = await fetch(`/bind/${robotId}?nickname=${encodedNick}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Binding failed: ${response.statusText}`);
}

/**
 * API: Obtain a short-lived stream ticket for the given robot.
 * Pass the returned ticket as ?ticket= on the WHEP URL instead of a Firebase token.
 */
export async function apiGetStreamTicket(robotId: string, token: string): Promise<string> {
  const response = await fetch(`/ticket/${robotId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Failed to get stream ticket: ${response.statusText}`);
  const data = await response.json();
  return data.ticket as string;
}

/**
 * API: Unlink a robot from the user's account.
 */
export async function apiUnbindRobot(robotId: string, token: string): Promise<void> {
  const response = await fetch(`/unbind/${robotId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Unbind failed");
}
