/**
 * Store projektów HIVE
 * Zarządza listą projektów social media z persystencją lokalną
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, SocialPlatform, SocialAccount, ProjectStatus, PublishMode } from '@/types/project';

/** Dane wymagane do utworzenia nowego projektu */
export type CreateProjectData = {
  name: string;
  description: string;
  workspacePath: string;
  platforms: SocialPlatform[];
  accounts: SocialAccount[];
};

/** Dane do częściowej aktualizacji projektu */
export type UpdateProjectData = Partial<Omit<Project, 'id' | 'createdAt'>>;

interface ProjectsState {
  projects: Project[];

  // Akcje
  addProject: (data: CreateProjectData) => Project;
  updateProject: (id: string, data: UpdateProjectData) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  setProjectStatus: (id: string, status: ProjectStatus) => void;
  setPublishMode: (id: string, mode: PublishMode) => void;
  /** Zastępuje wszystkie projekty importowanymi danymi */
  replaceAllProjects: (projects: Project[]) => void;
  /** Dodaje importowane projekty pomijając duplikaty (po ID) */
  mergeProjects: (projects: Project[]) => void;
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],

      addProject: (data) => {
        const project: Project = {
          id: crypto.randomUUID(),
          name: data.name,
          description: data.description,
          workspacePath: data.workspacePath,
          status: 'planning',
          publishMode: 'manual',
          platforms: data.platforms,
          accounts: data.accounts,
          createdAt: Date.now(),
        };
        set((state) => ({ projects: [...state.projects, project] }));
        return project;
      },

      updateProject: (id, data) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      },

      getProject: (id) => {
        return get().projects.find((p) => p.id === id);
      },

      setProjectStatus: (id, status) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, status } : p
          ),
        }));
      },

      setPublishMode: (id, mode) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, publishMode: mode } : p
          ),
        }));
      },

      replaceAllProjects: (projects) => {
        set({ projects });
      },

      mergeProjects: (imported) => {
        set((state) => {
          const existingIds = new Set(state.projects.map((p) => p.id));
          const newProjects = imported.filter((p) => !existingIds.has(p.id));
          return { projects: [...state.projects, ...newProjects] };
        });
      },
    }),
    {
      name: 'hive-projects',
    }
  )
);
