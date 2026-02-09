import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  type Auth,
  type User
} from "firebase/auth";

export interface RobotInfo {
  nickname: string;
  robotid: string;
  online: boolean;
}

let auth: Auth | null = null;

/**
 * Initializes Firebase Auth and sets up a listener for user state changes.
 */
export function initAuth(onUserChange?: (user: User | null) => void) {
  if (auth) return; // Already initialized

  const firebaseConfig = {
    apiKey: "AIzaSyBbPMdrWfinNR6at8YDvZJaXP8vdJbkmOI",
    authDomain: "nf-web-480214.firebaseapp.com",
    projectId: "nf-web-480214",
    storageBucket: "nf-web-480214.firebasestorage.app",
    messagingSenderId: "690802609278",
    appId: "1:690802609278:web:8165450202df8179029c2f"
  };

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  if (onUserChange) {
    onAuthStateChanged(auth, onUserChange);
  }
}

/**
 * Retrieves a valid ID token for the current user.
 * Triggers a popup sign-in flow if the user is not currently authenticated.
 */
export async function getAuthToken(): Promise<string> {
  if (!auth) throw new Error("Auth not initialized");
  const provider = new GoogleAuthProvider();

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth!, async (user) => {
      unsubscribe();
      if (user) {
        // Force refresh only if necessary? For now sticking to true as per original logic
        const token = await user.getIdToken(true);
        resolve(token);
      } else {
        try {
          const result = await signInWithPopup(auth!, provider);
          const token = await result.user.getIdToken();
          resolve(token);
        } catch (error) {
          reject(error);
        }
      }
    });
  });
}

/**
 * API: Fetch the list of robots bound to the user.
 */
export async function apiListRobots(token: string): Promise<RobotInfo[]> {
  const response = await fetch('/listrobots', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch robot list: ${response.statusText}`);
  }
  
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

  if (!response.ok) {
    throw new Error(`Binding failed: ${response.statusText}`);
  }
}

/**
 * API: Unlink a robot from the user's account.
 */
export async function apiUnbindRobot(robotId: string, token: string): Promise<void> {
  const response = await fetch(`/unbind/${robotId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error("Unbind failed");
  }
}