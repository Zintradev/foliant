import { FoliantProject } from '../types/project';
import { Language } from '../types/settings';
import { DEFAULT_PROJECT as DEFAULT_PROJECT_EN } from './mockProject';
import { DEFAULT_PROJECT_ES } from './mockProjectEs';

export { DEFAULT_PROJECT_EN as DEFAULT_PROJECT };

export function getDefaultProject(language: Language = 'en'): FoliantProject {
  return language === 'es' ? DEFAULT_PROJECT_ES : DEFAULT_PROJECT_EN;
}

