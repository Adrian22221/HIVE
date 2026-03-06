/**
 * Store agentów HIVE
 * Zarządza listą agentów AI z persystencją lokalną.
 * Każdy agent tworzony przez innego agenta wymaga zatwierdzenia przez użytkownika.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Agent, AgentRole, AgentProvider, OllamaModel, AgentStatus } from '@/types/agent';

/** Dane wymagane do utworzenia nowego agenta */
export type CreateAgentData = {
  name: string;
  role: AgentRole;
  systemPrompt: string;
  model: string;
  provider: AgentProvider;
  ollamaModel?: OllamaModel;
  avatar?: string;
  assignedSkills?: string[];
  assignedProjectId?: string;
  /** Domyślnie 'user' — agenci tworzeni przez AI mają createdBy: 'agent' */
  createdBy?: 'user' | 'agent';
};

/** Dane do częściowej aktualizacji agenta */
export type UpdateAgentData = Partial<Omit<Agent, 'id' | 'createdAt'>>;

interface AgentsState {
  agents: Agent[];

  // Akcje
  addAgent: (data: CreateAgentData) => Agent;
  updateAgent: (id: string, data: UpdateAgentData) => void;
  deleteAgent: (id: string) => void;
  approveAgent: (id: string) => void;
  rejectAgent: (id: string) => void;
  getAgent: (id: string) => Agent | undefined;
  setAgentStatus: (id: string, status: AgentStatus) => void;
  /** Zastępuje wszystkich agentów importowanymi danymi */
  replaceAllAgents: (agents: Agent[]) => void;
  /** Dodaje importowanych agentów pomijając duplikaty (po ID) */
  mergeAgents: (agents: Agent[]) => void;
}

export const useAgentsStore = create<AgentsState>()(
  persist(
    (set, get) => ({
      agents: [],

      addAgent: (data) => {
        const createdBy = data.createdBy ?? 'user';
        const agent: Agent = {
          id: crypto.randomUUID(),
          name: data.name,
          role: data.role,
          systemPrompt: data.systemPrompt,
          model: data.model,
          provider: data.provider,
          ollamaModel: data.ollamaModel,
          avatar: data.avatar ?? '🤖',
          status: 'idle',
          assignedSkills: data.assignedSkills ?? [],
          assignedProjectId: data.assignedProjectId,
          createdBy,
          // Agenci stworzeni przez użytkownika są automatycznie zatwierdzeni
          // Agenci stworzeni przez innego agenta wymagają ręcznego zatwierdzenia
          approved: createdBy === 'user',
          createdAt: Date.now(),
        };
        set((state) => ({ agents: [...state.agents, agent] }));
        return agent;
      },

      updateAgent: (id, data) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, ...data } : a
          ),
        }));
      },

      deleteAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
        }));
      },

      approveAgent: (id) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, approved: true } : a
          ),
        }));
      },

      rejectAgent: (id) => {
        // Odrzucenie agenta stworzonego przez AI — usuwa go z listy
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
        }));
      },

      getAgent: (id) => {
        return get().agents.find((a) => a.id === id);
      },

      setAgentStatus: (id, status) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
        }));
      },

      replaceAllAgents: (agents) => {
        set({ agents });
      },

      mergeAgents: (imported) => {
        set((state) => {
          const existingIds = new Set(state.agents.map((a) => a.id));
          const newAgents = imported.filter((a) => !existingIds.has(a.id));
          return { agents: [...state.agents, ...newAgents] };
        });
      },
    }),
    {
      name: 'hive-agents',
    }
  )
);
