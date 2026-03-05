/**
 * Store zadań HIVE
 * Zarządza zadaniami powiązanymi z projektami, z persystencją lokalną.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus, TaskPriority } from '@/types/task';

export type CreateTaskData = {
  projectId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  assignedAgentId?: string;
};

export type UpdateTaskData = Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>;

interface TasksState {
  tasks: Task[];

  addTask: (data: CreateTaskData) => Task;
  updateTask: (id: string, data: UpdateTaskData) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: TaskStatus) => void;
  getTasksByProject: (projectId: string) => Task[];
  deleteTasksByProject: (projectId: string) => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (data) => {
        const now = Date.now();
        const task: Task = {
          id: crypto.randomUUID(),
          projectId: data.projectId,
          title: data.title,
          description: data.description,
          status: 'todo',
          priority: data.priority,
          assignedAgentId: data.assignedAgentId,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
        return task;
      },

      updateTask: (id, data) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: Date.now() } : t
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },

      moveTask: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status, updatedAt: Date.now() } : t
          ),
        }));
      },

      getTasksByProject: (projectId) => {
        return get().tasks.filter((t) => t.projectId === projectId);
      },

      deleteTasksByProject: (projectId) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.projectId !== projectId),
        }));
      },
    }),
    { name: 'hive-tasks' }
  )
);
