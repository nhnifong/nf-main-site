import { initializeApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  signInWithRedirect,
} from 'firebase/auth';

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

let auth: Auth | null = null;

/**
 * Initializes Firebase Auth and sets up a listener for user state changes.
 */
export function initAuth(onUserChange?: (user: User | null) => void) {
  if (auth) return;
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  if (onUserChange) {
    onAuthStateChanged(auth, onUserChange);
  }
}

/**
 * Hides the sign-in panel.
 * Call this from a "back" button in the sign-in panel.
 */
export function hideSignInUI() {
  document.getElementById('signin-overlay')?.classList.add('hidden');
}

function showSignInUI() {
  document.getElementById('signin-overlay')?.classList.remove('hidden');

  // Replace each button element to clear any previous click listeners
  const wire = (id: string, handler: () => void) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const fresh = btn.cloneNode(true) as HTMLElement;
    btn.replaceWith(fresh);
    fresh.addEventListener('click', handler);
  };

  wire('signin-google', () => signInWithRedirect(auth!, new GoogleAuthProvider()));
  wire('signin-github', () => signInWithRedirect(auth!, new GithubAuthProvider()));
  wire('signin-twitter', () => signInWithRedirect(auth!, new TwitterAuthProvider()));
}

/**
 * Retrieves a valid ID token for the current user.
 * Shows the sign-in panel if the user is not currently authenticated.
 * Shows the sign-in panel if not authenticated. Sign-in uses redirect, so
 * the page reloads after OAuth completes and the caller must retry.
 */
export async function getAuthToken(): Promise<string> {
  if (!auth) throw new Error("Auth not initialized");

  // Wait for Firebase to restore auth state before checking (may be null briefly on page load)
  const user = await new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth!, (u) => { unsubscribe(); resolve(u); });
  });

  if (user) {
    return user.getIdToken(true);
  }

  showSignInUI();
  return new Promise(() => {}); // page will reload after OAuth redirect
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
