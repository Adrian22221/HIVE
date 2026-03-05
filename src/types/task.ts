/**
 * Typy zadań HIVE
 * Zadania są powiązane z projektami i opcjonalnie przypisane agentom AI
 */

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type TaskPriority = 'low' | 'normal' | 'high';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ID agenta przypisanego do zadania */
  assignedAgentId?: string;
  createdAt: number;
  updatedAt: number;
}
