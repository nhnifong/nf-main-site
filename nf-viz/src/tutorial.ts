// ============================================================
// Guided tutorial overlay for the playroom.
//
// The tutorial is reached by visiting the "/tutorial" alias of the
// playroom (the backend serves the same playroom.html for that path).
// It always starts in LAN mode and walks the user through getting a
// robot online and driving it.
//
// The entire tutorial is described by the TUTORIAL_STEPS data structure
// below: each step names a message, an element to highlight, an optional
// copyable command block, and a predicate deciding when it auto-dismisses.
// Add or reorder steps there — the TutorialManager handles the rest.
// ============================================================

import { isFullyConnected } from './main.ts';

export interface TutorialStep {
  /** Stable id, handy for debugging. */
  id: string;
  /** Explanation shown in the floating panel. May contain inline HTML. */
  message: string;
  /** id of the element to highlight and anchor the panel next to. */
  highlightId: string;
  /** Optional monospaced, copyable command block shown under the message. */
  copyBlock?: string;
  /**
   * Optional predicate. When it returns true the step auto-dismisses and the
   * tutorial advances. Evaluated by polling, so it should be cheap and based
   * on observable state (e.g. reading the DOM). Omit for manual-only steps.
   */
  dismissWhen?: () => boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [

  { // Run stringman-headless on localhost and get online
    id: 'run-host',
    highlightId: 'system-status',
    message: 'Run <strong>stringman-headless</strong> in a virtualenv on this machine to begin:',
    copyBlock: [
      'python3 -m venv venv',
      'source venv/bin/activate',
      'pip install nf_robot[host]',
      'stringman-headless',
    ].join('\n'),
    // Auto-dismiss once the robot is online (status dot drops its offline class).
    dismissWhen: () => !document.getElementById('status-dot-el')?.classList.contains('status-offline'),
  },

  { // turn on the robot and detect the components
    id: 'connect-components',
    highlightId: 'component-status',
    message: 'Great job!<br> Now power on the robot and check here for Anchors and Gripper to be detected on the same wifi network',
    dismissWhen: () => isFullyConnected(),
  },
];

export function isTutorialMode(): boolean {
  return /(^|\/)tutorial\/?$/.test(window.location.pathname);
}

class TutorialManager {
  private steps: TutorialStep[];
  private index = 0;
  private panel: HTMLElement | null = null;
  private highlighted: HTMLElement | null = null;
  private endBtn: HTMLElement | null = null;
  private pollTimer: number | null = null;
  private repositionHandler = () => this.positionPanel();

  constructor(steps: TutorialStep[]) {
    this.steps = steps;
  }

  start() {
    this.injectEndButton();
    this.index = 0;
    this.showCurrentStep();

    // Poll auto-dismiss predicates and keep the panel anchored to its target.
    this.pollTimer = window.setInterval(() => {
      const step = this.steps[this.index];
      if (step?.dismissWhen?.()) {
        this.dismissCurrent();
      } else {
        this.positionPanel();
      }
    }, 400);

    window.addEventListener('resize', this.repositionHandler);
    window.addEventListener('scroll', this.repositionHandler, true);
  }

  /** Tear down everything and restore the URL back to /playroom. */
  end = () => {
    this.clearPanel();
    if (this.pollTimer !== null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    window.removeEventListener('resize', this.repositionHandler);
    window.removeEventListener('scroll', this.repositionHandler, true);
    this.endBtn?.remove();
    this.endBtn = null;

    // Swap /tutorial back to /playroom, keeping any query params (robotid=lan).
    const url = new URL(window.location.href);
    url.pathname = url.pathname.replace(/(^|\/)tutorial\/?$/, '$1playroom');
    window.history.replaceState({}, '', url);
  };

  // --- Step lifecycle ---------------------------------------------------

  private showCurrentStep() {
    this.clearPanel();
    const step = this.steps[this.index];
    if (!step) return; // ran out of steps; tutorial stays active until End.

    const target = document.getElementById(step.highlightId);
    if (target) {
      target.classList.add('tutorial-highlight');
      this.highlighted = target;
    } else {
      console.warn(`Tutorial step "${step.id}": no element with id "${step.highlightId}"`);
    }

    this.panel = this.buildPanel(step);
    document.body.appendChild(this.panel);
    this.positionPanel();
  }

  /** Dismiss the active message, unhighlight its target, advance to the next. */
  private dismissCurrent = () => {
    this.index++;
    this.showCurrentStep();
  };

  private clearPanel() {
    if (this.highlighted) {
      this.highlighted.classList.remove('tutorial-highlight');
      this.highlighted = null;
    }
    this.panel?.remove();
    this.panel = null;
  }

  // --- DOM construction -------------------------------------------------

  private buildPanel(step: TutorialStep): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'tutorial-panel';

    const dismiss = document.createElement('button');
    dismiss.className = 'tutorial-panel-dismiss';
    dismiss.title = 'Dismiss this message';
    dismiss.textContent = '✕';
    dismiss.addEventListener('click', this.dismissCurrent);
    panel.appendChild(dismiss);

    const msg = document.createElement('div');
    msg.className = 'tutorial-panel-message';
    msg.innerHTML = step.message;
    panel.appendChild(msg);

    if (step.copyBlock) {
      panel.appendChild(this.buildCopyBlock(step.copyBlock));
    }

    return panel;
  }

  private buildCopyBlock(text: string): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'tutorial-copy-block';

    const pre = document.createElement('pre');
    pre.textContent = text;
    wrap.appendChild(pre);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'tutorial-copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied!';
        window.setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      } catch {
        copyBtn.textContent = 'Copy failed';
      }
    });
    wrap.appendChild(copyBtn);

    return wrap;
  }

  private injectEndButton() {
    const header = document.querySelector('#panel-header .header-left');
    if (!header) return;
    const btn = document.createElement('button');
    btn.id = 'btn-end-tutorial';
    btn.className = 'header-back-btn tutorial-end-btn';
    btn.title = 'Exit the tutorial';
    btn.textContent = 'End Tutorial';
    btn.addEventListener('click', this.end);
    header.appendChild(btn);
    this.endBtn = btn;
  }

  // --- Positioning ------------------------------------------------------

  /** Anchor the panel next to its highlighted target, preferring above. */
  private positionPanel() {
    if (!this.panel) return;
    const panel = this.panel.getBoundingClientRect();
    const margin = 8;

    // No anchor element (missing/typo'd highlightId): float near the top
    // center so the message is still visible rather than silently lost.
    if (!this.highlighted) {
      this.panel.style.top = `${margin * 2}px`;
      this.panel.style.left = `${Math.max(margin, (window.innerWidth - panel.width) / 2)}px`;
      return;
    }

    const target = this.highlighted.getBoundingClientRect();
    const gap = 14;

    // Vertical: prefer above the target, fall back to below.
    let top = target.top - panel.height - gap;
    if (top < margin) top = target.bottom + gap;
    top = Math.min(top, window.innerHeight - panel.height - margin);
    top = Math.max(margin, top);

    // Horizontal: align to the target's left, clamped to the viewport.
    let left = target.left;
    left = Math.min(left, window.innerWidth - panel.width - margin);
    left = Math.max(margin, left);

    this.panel.style.top = `${top}px`;
    this.panel.style.left = `${left}px`;
  }
}

let manager: TutorialManager | null = null;

/** Start the tutorial if the page was reached via the /tutorial alias. */
export function maybeStartTutorial() {
  if (!isTutorialMode() || manager) return;
  manager = new TutorialManager(TUTORIAL_STEPS);
  manager.start();
}
