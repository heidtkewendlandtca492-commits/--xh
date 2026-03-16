import { doc, getDoc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Project } from '../types';

const PROJECT_ID = 'default-project';

export async function saveProject(project: Project) {
  const docRef = doc(db, 'projects', PROJECT_ID);
  // Firestore does not support 'undefined' values. 
  // We use JSON parse/stringify to cleanly strip all undefined properties from the object tree before saving.
  const cleanProject = JSON.parse(JSON.stringify(project));
  await setDoc(docRef, cleanProject);
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
  await deleteDoc(docRef);
}
