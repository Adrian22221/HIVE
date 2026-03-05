/**
 * Strona Kanban projektu HIVE
 * Tablica zadań per-projekt z 3 kolumnami (Todo / In Progress / Done).
 * Przeciąganie kart via @dnd-kit.
 */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useProjectsStore } from '@/stores/projects';
import { useTasksStore } from '@/stores/tasks';
import { useAgentsStore } from '@/stores/agents';
import type { Task, TaskStatus, TaskPriority } from '@/types/task';

/** Konfiguracja kolumn Kanban */
const COLUMNS: { id: TaskStatus; color: string }[] = [
  { id: 'todo', color: 'border-t-slate-400' },
  { id: 'in-progress', color: 'border-t-amber-500' },
  { id: 'done', color: 'border-t-green-500' },
];

/** Kolory badge priorytetu */
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-500/20 text-slate-400',
  normal: 'bg-blue-500/20 text-blue-400',
  high: 'bg-red-500/20 text-red-400',
};

/** Emoji priorytetu */
const PRIORITY_ICONS: Record<TaskPriority, string> = {
  low: '🟢',
  normal: '🟡',
  high: '🔴',
};

/** Stan formularza zadania */
interface TaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  assignedAgentId: string;
}

const DEFAULT_FORM: TaskFormState = {
  title: '',
  description: '',
  priority: 'normal',
  assignedAgentId: '',
};

// ---------------------------------------------------------------------------
// Komponent: DraggableTaskCard
// ---------------------------------------------------------------------------
interface TaskCardProps {
  task: Task;
  agentName?: string;
  agentAvatar?: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  isDragging?: boolean;
}

function DraggableTaskCard({ task, agentName, agentAvatar, onEdit, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border bg-card p-3 shadow-sm group transition-shadow',
        isDragging ? 'opacity-40' : 'hover:shadow-md'
      )}
    >
      {/* Nagłówek karty */}
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        {/* Akcje — widoczne on hover */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onEdit(task)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(task)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Footer karty */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_COLORS[task.priority])}>
          {PRIORITY_ICONS[task.priority]} {task.priority}
        </span>
        {agentName && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <span>{agentAvatar}</span>
            <span className="truncate max-w-[80px]">{agentName}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Komponent: DroppableColumn
// ---------------------------------------------------------------------------
interface ColumnProps {
  id: TaskStatus;
  title: string;
  colorClass: string;
  tasks: Task[];
  agents: { id: string; name: string; avatar: string }[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function DroppableColumn({ id, title, colorClass, tasks, agents, onEdit, onDelete }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { t } = useTranslation('tasks');

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg border-t-2 bg-muted/30 min-h-[400px] transition-colors',
        colorClass,
        isOver && 'bg-muted/60'
      )}
    >
      {/* Nagłówek kolumny */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      {/* Karty zadań */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        {tasks.map((task) => {
          const agent = agents.find((a) => a.id === task.assignedAgentId);
          return (
            <DraggableTaskCard
              key={task.id}
              task={task}
              agentName={agent?.name}
              agentAvatar={agent?.avatar}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        })}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 py-8 text-center text-muted-foreground/40">
            <p className="text-xs">{t('noTasks')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Główny komponent: KanbanPage
// ---------------------------------------------------------------------------
export function KanbanPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { t } = useTranslation('tasks');

  const { getProject } = useProjectsStore();
  const { tasks, addTask, updateTask, deleteTask, moveTask, getTasksByProject } = useTasksStore();
  const { agents } = useAgentsStore();

  const project = getProject(projectId ?? '');
  const projectTasks = getTasksByProject(projectId ?? '');
  const approvedAgents = agents.filter((a) => a.approved);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(DEFAULT_FORM);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // DnD sensors — wymaga małego ruchu (5px) przed startem drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /** Otwiera formularz tworzenia nowego zadania */
  const handleOpenCreate = () => {
    setForm(DEFAULT_FORM);
    setEditingTask(null);
    setShowForm(true);
  };

  /** Otwiera formularz edycji */
  const handleOpenEdit = (task: Task) => {
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignedAgentId: task.assignedAgentId ?? '',
    });
    setEditingTask(task);
    setShowForm(true);
  };

  /** Zamyka formularz */
  const handleCancel = () => {
    setShowForm(false);
    setEditingTask(null);
    setForm(DEFAULT_FORM);
  };

  /** Zapisuje zadanie */
  const handleSubmit = () => {
    if (!form.title.trim()) return;

    if (editingTask) {
      updateTask(editingTask.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        assignedAgentId: form.assignedAgentId || undefined,
      });
      toast.success('Zadanie zaktualizowane');
    } else {
      addTask({
        projectId: projectId ?? '',
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        assignedAgentId: form.assignedAgentId || undefined,
      });
      toast.success('Zadanie dodane');
    }

    handleCancel();
  };

  /** Usuwa zadanie */
  const handleDelete = (task: Task) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    deleteTask(task.id);
    toast.success('Zadanie usunięte');
  };

  /** DnD: start przeciągania */
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  /** DnD: koniec przeciągania */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    // over.id to id kolumny (TaskStatus) lub id karty
    const targetStatus = COLUMNS.find((c) => c.id === over.id)?.id;
    if (targetStatus && active.id !== over.id) {
      moveTask(active.id as string, targetStatus);
    }
  };

  // Projekt nie istnieje
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Projekt nie istnieje</p>
        <Button variant="link" asChild className="mt-2">
          <Link to="/projects">{t('backToProjects')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Nagłówek */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('backToProjects')}
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{project.name}</h1>
            <p className="text-xs text-muted-foreground">
              {projectTasks.length} {t('taskCount', { count: projectTasks.length }).replace(/^\d+ /, '')}
            </p>
          </div>
        </div>
        {!showForm && (
          <Button
            onClick={handleOpenCreate}
            className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('addTask')}
          </Button>
        )}
      </div>

      {/* Formularz dodawania/edycji zadania */}
      {showForm && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-500 text-base">
              {editingTask ? t('editTask') : t('addTask')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Tytuł */}
              <div className="space-y-1.5">
                <Label htmlFor="task-title">{t('form.title')}</Label>
                <Input
                  id="task-title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t('form.titlePlaceholder')}
                  autoFocus
                />
              </div>

              {/* Priorytet */}
              <div className="space-y-1.5">
                <Label>{t('form.priority')}</Label>
                <Select
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))}
                >
                  <option value="low">{PRIORITY_ICONS.low} {t('priority.low')}</option>
                  <option value="normal">{PRIORITY_ICONS.normal} {t('priority.normal')}</option>
                  <option value="high">{PRIORITY_ICONS.high} {t('priority.high')}</option>
                </Select>
              </div>
            </div>

            {/* Opis */}
            <div className="space-y-1.5">
              <Label htmlFor="task-desc">{t('form.description')}</Label>
              <Textarea
                id="task-desc"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t('form.descriptionPlaceholder')}
                rows={2}
              />
            </div>

            {/* Przypisz agenta */}
            <div className="space-y-1.5">
              <Label>{t('form.assignAgent')}</Label>
              <Select
                value={form.assignedAgentId || 'none'}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  assignedAgentId: e.target.value === 'none' ? '' : e.target.value,
                }))}
              >
                <option value="none">{t('form.noAgent')}</option>
                {approvedAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.avatar} {a.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Przyciski */}
            <div className="flex gap-2 justify-end pt-1 border-t">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Anuluj
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!form.title.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
              >
                {editingTask ? 'Zapisz zmiany' : t('addTask')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tablica Kanban */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <DroppableColumn
              key={col.id}
              id={col.id}
              title={t(`column.${col.id === 'in-progress' ? 'inProgress' : col.id}`)}
              colorClass={col.color}
              tasks={projectTasks.filter((t) => t.status === col.id)}
              agents={approvedAgents}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* DragOverlay — karta widoczna podczas przeciągania */}
        <DragOverlay>
          {activeTask && (
            <div className="rounded-lg border bg-card p-3 shadow-xl rotate-1 cursor-grabbing">
              <p className="font-medium text-sm">{activeTask.title}</p>
              {activeTask.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {activeTask.description}
                </p>
              )}
              <div className="mt-2">
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_COLORS[activeTask.priority])}>
                  {PRIORITY_ICONS[activeTask.priority]} {activeTask.priority}
                </span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default KanbanPage;
