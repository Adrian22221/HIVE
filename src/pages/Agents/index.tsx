/**
 * Strona Agentów HIVE
 * Zarządzanie agentami AI — tworzenie, edycja, zatwierdzanie, usuwanie
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Bot, Trash2, Pencil, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAgentsStore } from '@/stores/agents';
import { useProjectsStore } from '@/stores/projects';
import type { Agent, AgentRole, AgentProvider, OllamaModel, AgentStatus } from '@/types/agent';

/** Emoji ikon dla roli agenta */
const ROLE_ICONS: Record<AgentRole, string> = {
  orchestrator: '🎯',
  content: '✍️',
  graphics: '🎨',
  publisher: '📤',
  analytics: '📊',
  custom: '⚙️',
};

/** Kolory odznaki statusu agenta */
const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: 'bg-slate-500/20 text-slate-400',
  working: 'bg-amber-500/20 text-amber-400',
  waiting: 'bg-blue-500/20 text-blue-400',
  done: 'bg-green-500/20 text-green-400',
  error: 'bg-red-500/20 text-red-400',
};

/** Modele Ollama dostępne do wyboru */
const OLLAMA_MODELS: OllamaModel[] = [
  'qwen3.5:9b',
  'qwen3.5:4b',
  'qwen3.5:2b',
  'llama4',
  'deepseek-v3',
  'phi3',
  'gemma3',
];

/** Modele Anthropic */
const ANTHROPIC_MODELS = ['claude-sonnet-4-6', 'claude-opus-4'];

/** Modele OpenAI */
const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini'];

/** Stan formularza tworzenia/edycji agenta */
interface AgentFormState {
  name: string;
  avatar: string;
  role: AgentRole;
  provider: AgentProvider;
  model: string;
  ollamaModel: OllamaModel;
  systemPrompt: string;
  assignedProjectId: string;
}

const DEFAULT_FORM: AgentFormState = {
  name: '',
  avatar: '🤖',
  role: 'content',
  provider: 'ollama',
  model: 'claude-sonnet-4-6',
  ollamaModel: 'qwen3.5:9b',
  systemPrompt: '',
  assignedProjectId: '',
};

export function Agents() {
  const { t } = useTranslation('agents');
  const { agents, addAgent, updateAgent, deleteAgent, approveAgent, rejectAgent } = useAgentsStore();
  const { projects } = useProjectsStore();

  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState<AgentFormState>(DEFAULT_FORM);

  /** Zwraca właściwy model na podstawie dostawcy */
  const getEffectiveModel = (f: AgentFormState): string => {
    if (f.provider === 'ollama') return f.ollamaModel;
    return f.model;
  };

  /** Otwiera formularz tworzenia nowego agenta */
  const handleOpenCreate = () => {
    setForm(DEFAULT_FORM);
    setEditingAgent(null);
    setShowForm(true);
  };

  /** Otwiera formularz edycji istniejącego agenta */
  const handleOpenEdit = (agent: Agent) => {
    setForm({
      name: agent.name,
      avatar: agent.avatar,
      role: agent.role,
      provider: agent.provider,
      model: agent.provider !== 'ollama' ? agent.model : 'claude-sonnet-4-6',
      ollamaModel: agent.provider === 'ollama' ? (agent.ollamaModel ?? 'qwen3.5:9b') : 'qwen3.5:9b',
      systemPrompt: agent.systemPrompt,
      assignedProjectId: agent.assignedProjectId ?? '',
    });
    setEditingAgent(agent);
    setShowForm(true);
  };

  /** Zamknięcie formularza bez zapisywania */
  const handleCancel = () => {
    setShowForm(false);
    setEditingAgent(null);
    setForm(DEFAULT_FORM);
  };

  /** Zapisuje nowego agenta lub aktualizuje istniejącego */
  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const effectiveModel = getEffectiveModel(form);

    if (editingAgent) {
      updateAgent(editingAgent.id, {
        name: form.name.trim(),
        avatar: form.avatar.trim() || '🤖',
        role: form.role,
        provider: form.provider,
        model: effectiveModel,
        ollamaModel: form.provider === 'ollama' ? form.ollamaModel : undefined,
        systemPrompt: form.systemPrompt.trim(),
        assignedProjectId: form.assignedProjectId || undefined,
      });
      toast.success('Agent zaktualizowany');
    } else {
      addAgent({
        name: form.name.trim(),
        avatar: form.avatar.trim() || '🤖',
        role: form.role,
        provider: form.provider,
        model: effectiveModel,
        ollamaModel: form.provider === 'ollama' ? form.ollamaModel : undefined,
        systemPrompt: form.systemPrompt.trim(),
        assignedProjectId: form.assignedProjectId || undefined,
        createdBy: 'user',
      });
      toast.success('Agent utworzony');
    }

    handleCancel();
  };

  /** Usuwa agenta po potwierdzeniu */
  const handleDelete = (agent: Agent) => {
    if (!window.confirm(`${t('deleteConfirm')}\n"${agent.name}"`)) return;
    deleteAgent(agent.id);
    toast.success('Agent usunięty');
  };

  /** Zatwierdza agenta stworzonego przez innego agenta */
  const handleApprove = (id: string) => {
    approveAgent(id);
    toast.success('Agent zatwierdzony i gotowy do pracy');
  };

  /** Odrzuca agenta stworzonego przez innego agenta */
  const handleReject = (id: string) => {
    rejectAgent(id);
    toast.info('Agent odrzucony');
  };

  /** Agenci oczekujący na zatwierdzenie */
  const pendingAgents = agents.filter((a) => !a.approved);
  /** Zatwierdzone agenty */
  const approvedAgents = agents.filter((a) => a.approved);

  return (
    <div className="space-y-6">
      {/* Nagłówek strony */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        {!showForm && (
          <Button
            onClick={handleOpenCreate}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('newAgent')}
          </Button>
        )}
      </div>

      {/* Formularz tworzenia/edycji agenta */}
      {showForm && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-amber-500">
              {editingAgent ? t('editAgent') : t('createAgent')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Nazwa agenta */}
              <div className="space-y-1.5">
                <Label htmlFor="agent-name">{t('form.name')}</Label>
                <Input
                  id="agent-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t('form.namePlaceholder')}
                />
              </div>

              {/* Avatar agenta */}
              <div className="space-y-1.5">
                <Label htmlFor="agent-avatar">{t('form.avatar')}</Label>
                <Input
                  id="agent-avatar"
                  value={form.avatar}
                  onChange={(e) => setForm((prev) => ({ ...prev, avatar: e.target.value }))}
                  placeholder={t('form.avatarPlaceholder')}
                  maxLength={4}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Rola agenta */}
              <div className="space-y-1.5">
                <Label>{t('form.role')}</Label>
                <Select
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as AgentRole }))}
                >
                  <option value="orchestrator">{ROLE_ICONS.orchestrator} {t('role.orchestrator')}</option>
                  <option value="content">{ROLE_ICONS.content} {t('role.content')}</option>
                  <option value="graphics">{ROLE_ICONS.graphics} {t('role.graphics')}</option>
                  <option value="publisher">{ROLE_ICONS.publisher} {t('role.publisher')}</option>
                  <option value="analytics">{ROLE_ICONS.analytics} {t('role.analytics')}</option>
                  <option value="custom">{ROLE_ICONS.custom} {t('role.custom')}</option>
                </Select>
              </div>

              {/* Przypisany projekt */}
              <div className="space-y-1.5">
                <Label>{t('form.assignedProject')}</Label>
                <Select
                  value={form.assignedProjectId || 'none'}
                  onChange={(e) => setForm((prev) => ({ ...prev, assignedProjectId: e.target.value === 'none' ? '' : e.target.value }))}
                >
                  <option value="none">— brak —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Dostawca AI */}
              <div className="space-y-1.5">
                <Label>{t('form.provider')}</Label>
                <Select
                  value={form.provider}
                  onChange={(e) => {
                    const provider = e.target.value as AgentProvider;
                    const defaultModel =
                      provider === 'anthropic'
                        ? 'claude-sonnet-4-6'
                        : provider === 'openai'
                        ? 'gpt-4o'
                        : 'claude-sonnet-4-6';
                    setForm((prev) => ({ ...prev, provider, model: defaultModel }));
                  }}
                >
                  <option value="ollama">{t('provider.ollama')} 🆓</option>
                  <option value="anthropic">{t('provider.anthropic')}</option>
                  <option value="openai">{t('provider.openai')}</option>
                </Select>
              </div>

              {/* Model AI */}
              <div className="space-y-1.5">
                <Label>{t('form.model')}</Label>
                {form.provider === 'ollama' ? (
                  <Select
                    value={form.ollamaModel}
                    onChange={(e) => setForm((prev) => ({ ...prev, ollamaModel: e.target.value as OllamaModel }))}
                  >
                    {OLLAMA_MODELS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Select>
                ) : form.provider === 'anthropic' ? (
                  <Select
                    value={form.model}
                    onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
                  >
                    {ANTHROPIC_MODELS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Select>
                ) : (
                  <Select
                    value={form.model}
                    onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
                  >
                    {OPENAI_MODELS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Select>
                )}
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-1.5">
              <Label htmlFor="agent-prompt">{t('form.systemPrompt')}</Label>
              <Textarea
                id="agent-prompt"
                value={form.systemPrompt}
                onChange={(e) => setForm((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder={t('form.systemPromptPlaceholder')}
                rows={4}
              />
            </div>

            {/* Przyciski akcji */}
            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={handleCancel}>
                Anuluj
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.name.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
              >
                {editingAgent ? 'Zapisz zmiany' : t('createAgent')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agenci oczekujący na zatwierdzenie */}
      {pendingAgents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-500 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t('pendingApproval')} ({pendingAgents.length})
          </h2>
          {pendingAgents.map((agent) => (
            <Card key={agent.id} className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="flex items-center gap-4 py-4">
                <span className="text-3xl">{agent.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_ICONS[agent.role]} {t(`role.${agent.role}`)} • {agent.model}
                    {' • '}{t('createdBy.agent')}
                  </p>
                  {agent.systemPrompt && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                      "{agent.systemPrompt}"
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleApprove(agent.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t('approveAgent')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => handleReject(agent.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Odrzuć
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pusta lista agentów */}
      {agents.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="h-14 w-14 text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-semibold">{t('noAgents')}</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">{t('noAgentsDesc')}</p>
            <Button
              onClick={handleOpenCreate}
              className="mt-6 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('newAgent')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Siatka zatwierdzonych agentów */}
      {approvedAgents.length > 0 && (
        <div className="space-y-3">
          {pendingAgents.length > 0 && (
            <h2 className="text-sm font-semibold text-muted-foreground">
              Aktywni agenci ({approvedAgents.length})
            </h2>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {approvedAgents.map((agent) => (
              <Card
                key={agent.id}
                className="group hover:border-amber-500/30 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar agenta */}
                      <span className="text-3xl shrink-0">{agent.avatar}</span>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{agent.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {ROLE_ICONS[agent.role]} {t(`role.${agent.role}`)}
                        </CardDescription>
                      </div>
                    </div>
                    {/* Akcje — widoczne po najechaniu */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenEdit(agent)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(agent)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Status i dostawca */}
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_COLORS[agent.status]
                      )}
                    >
                      {t(`status.${agent.status}`)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-500/10 text-slate-400 px-2 py-0.5 text-xs font-medium">
                      {agent.provider === 'ollama' ? '🆓 ' : ''}{agent.model}
                    </span>
                  </div>

                  {/* System prompt — skrócony */}
                  {agent.systemPrompt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">
                      "{agent.systemPrompt}"
                    </p>
                  )}

                  {/* Przypisany projekt */}
                  {agent.assignedProjectId && (
                    <p className="text-xs text-muted-foreground">
                      📁 {projects.find((p) => p.id === agent.assignedProjectId)?.name ?? '—'}
                    </p>
                  )}

                  {/* Stworzony przez */}
                  <p className="text-xs text-muted-foreground">
                    {t(`createdBy.${agent.createdBy}`)} •{' '}
                    {new Date(agent.createdAt).toLocaleDateString('pl-PL')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Agents;
