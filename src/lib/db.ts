import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Project } from '../types';

const PROJECT_ID = 'default-project';

export async function saveProject(project: Project) {
  const docRef = doc(db, 'projects', PROJECT_ID);
  await setDoc(docRef, project);
}

export async function loadProject(): Promise<Project | null> {
  const docRef = doc(db, 'projects', PROJECT_ID);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as Project;
  }
  return null;
}

export function subscribeToProject(callback: (project: Project | null) => void) {
  const docRef = doc(db, 'projects', PROJECT_ID);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as Project);
    } else {
      callback(null);
    }
  });
}

export async function clearProject() {
  const docRef = doc(db, 'projects', PROJECT_ID);
  await setDoc(docRef, { id: PROJECT_ID, scriptText: '', assets: [] });
}
