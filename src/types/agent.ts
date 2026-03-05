/**
 * Typy dla modułu Agentów HIVE
 * Definiuje strukturę agenta AI i jego konfiguracji
 */

/** Rola agenta w hierarchii HIVE */
export type AgentRole =
  | 'orchestrator'
  | 'content'
  | 'graphics'
  | 'publisher'
  | 'analytics'
  | 'custom';

/** Dostawca AI */
export type AgentProvider = 'anthropic' | 'openai' | 'ollama';

/** Dostępne modele lokalne przez Ollama */
export type OllamaModel =
  | 'qwen3.5:9b'
  | 'qwen3.5:4b'
  | 'qwen3.5:2b'
  | 'llama4'
  | 'deepseek-v3'
  | 'phi3'
  | 'gemma3';

/** Status agenta */
export type AgentStatus = 'idle' | 'working' | 'waiting' | 'done' | 'error';

/** Agent AI — jednostka wykonująca zadania w systemie HIVE */
export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  model: string;
  provider: AgentProvider;
  ollamaModel?: OllamaModel;
  avatar: string;
  status: AgentStatus;
  assignedSkills: string[];
  assignedProjectId?: string;
  lastReportPath?: string;
  /** Czy agent został stworzony przez użytkownika czy przez innego agenta */
  createdBy: 'user' | 'agent';
  /** Czy agent został zatwierdzony przez użytkownika — wymagane przed uruchomieniem */
  approved: boolean;
  createdAt: number;
}
