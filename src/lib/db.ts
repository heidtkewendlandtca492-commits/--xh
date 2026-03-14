import { get, set, del } from 'idb-keyval';
import { Project } from '../types';

const PROJECT_KEY = 'collab_project';

export async function saveProject(project: Project) {
  await set(PROJECT_KEY, project);
}

export async function loadProject(): Promise<Project | undefined> {
  return await get(PROJECT_KEY);
}

export async function clearProject() {
  await del(PROJECT_KEY);
}
