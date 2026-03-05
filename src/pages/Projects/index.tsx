/**
 * Strona Projektów HIVE
 * Zarządzanie projektami social media — tworzenie, edycja, usuwanie
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  FolderKanban,
  Trash2,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useProjectsStore } from '@/stores/projects';
import type { Project, SocialPlatform, PublishMode, ProjectStatus } from '@/types/project';

/** Emoji ikon dla każdej platformy social media */
const PLATFORM_ICONS: Record<SocialPlatform, string> = {
  instagram: '📷',
  facebook: '📘',
  youtube: '▶️',
  tiktok: '🎵',
  twitter: '𝕏',
  linkedin: '💼',
};

/** Wszystkie dostępne platformy */
const ALL_PLATFORMS: SocialPlatform[] = [
  'instagram',
  'facebook',
  'youtube',
  'tiktok',
  'twitter',
  'linkedin',
];

/** Kolory dla statusu projektu */
const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
};

/** Kolory dla trybu publikacji */
const PUBLISH_MODE_COLORS: Record<PublishMode, string> = {
  manual: 'bg-slate-500/20 text-slate-400',
  'semi-auto': 'bg-amber-500/20 text-amber-400',
  auto: 'bg-orange-500/20 text-orange-400',
};

/** Stan formularza tworzenia/edycji projektu */
interface ProjectFormState {
  name: string;
  description: string;
  workspacePath: string;
  platforms: SocialPlatform[];
  publishMode: PublishMode;
  status: ProjectStatus;
}

const DEFAULT_FORM: ProjectFormState = {
  name: '',
  description: '',
  workspacePath: '',
  platforms: [],
  publishMode: 'manual',
  status: 'planning',
};

export function Projects() {
  const { t } = useTranslation('projects');
  const { projects, addProject, updateProject, deleteProject } = useProjectsStore();

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormState>(DEFAULT_FORM);

  /** Otwiera formularz tworzenia nowego projektu */
  const handleOpenCreate = () => {
    setForm(DEFAULT_FORM);
    setEditingProject(null);
    setShowForm(true);
  };

  /** Otwiera formularz edycji istniejącego projektu */
  const handleOpenEdit = (project: Project) => {
    setForm({
      name: project.name,
      description: project.description,
      workspacePath: project.workspacePath,
      platforms: project.platforms,
      publishMode: project.publishMode,
      status: project.status,
    });
    setEditingProject(project);
    setShowForm(true);
  };

  /** Zamknięcie formularza bez zapisywania */
  const handleCancel = () => {
    setShowForm(false);
    setEditingProject(null);
    setForm(DEFAULT_FORM);
  };

  /** Zapisuje nowy projekt lub aktualizuje istniejący */
  const handleSubmit = () => {
    if (!form.name.trim()) return;

    if (editingProject) {
      updateProject(editingProject.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        workspacePath: form.workspacePath.trim(),
        platforms: form.platforms,
        publishMode: form.publishMode,
        status: form.status,
      });
      toast.success('Projekt zaktualizowany');
    } else {
      addProject({
        name: form.name.trim(),
        description: form.description.trim(),
        workspacePath: form.workspacePath.trim(),
        platforms: form.platforms,
        accounts: [],
      });
      toast.success('Projekt utworzony');
    }

    handleCancel();
  };

  /** Usuwa projekt po potwierdzeniu */
  const handleDelete = (project: Project) => {
    if (!window.confirm(`${t('deleteConfirm')}\n"${project.name}"`)) return;
    deleteProject(project.id);
    toast.success('Projekt usunięty');
  };

  /** Przełącza platformę w liście wybranych platform */
  const togglePlatform = (platform: SocialPlatform) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

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
            {t('newProject')}
          </Button>
        )}
      </div>

      {/* Formularz tworzenia/edycji projektu */}
      {showForm && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-amber-500">
              {editingProject ? t('editProject') : t('createProject')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Nazwa projektu */}
              <div className="space-y-1.5">
                <Label htmlFor="proj-name">{t('form.name')}</Label>
                <Input
                  id="proj-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t('form.namePlaceholder')}
                />
              </div>

              {/* Folder workspace */}
              <div className="space-y-1.5">
                <Label htmlFor="proj-path">{t('form.workspacePath')}</Label>
                <Input
                  id="proj-path"
                  value={form.workspacePath}
                  onChange={(e) => setForm((prev) => ({ ...prev, workspacePath: e.target.value }))}
                  placeholder={t('form.workspacePathPlaceholder')}
                />
              </div>
            </div>

            {/* Opis projektu */}
            <div className="space-y-1.5">
              <Label htmlFor="proj-desc">{t('form.description')}</Label>
              <Textarea
                id="proj-desc"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t('form.descriptionPlaceholder')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Tryb publikacji */}
              <div className="space-y-1.5">
                <Label>{t('form.publishMode')}</Label>
                <Select
                  value={form.publishMode}
                  onChange={(e) => setForm((prev) => ({ ...prev, publishMode: e.target.value as PublishMode }))}
                >
                  <option value="manual">{t('form.publishModeManual')}</option>
                  <option value="semi-auto">{t('form.publishModeSemiAuto')}</option>
                  <option value="auto">{t('form.publishModeAuto')}</option>
                </Select>
              </div>

              {/* Status (tylko przy edycji) */}
              {editingProject && (
                <div className="space-y-1.5">
                  <Label>{t('form.status')}</Label>
                  <Select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ProjectStatus }))}
                  >
                    <option value="planning">{t('status.planning')}</option>
                    <option value="active">{t('status.active')}</option>
                    <option value="completed">{t('status.completed')}</option>
                  </Select>
                </div>
              )}
            </div>

            {/* Wybór platform */}
            <div className="space-y-1.5">
              <Label>{t('form.platforms')}</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_PLATFORMS.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors cursor-pointer',
                      form.platforms.includes(platform)
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                        : 'border-border text-muted-foreground hover:border-amber-500/30 hover:text-foreground'
                    )}
                  >
                    <span>{PLATFORM_ICONS[platform]}</span>
                    {t(`platforms.${platform}`)}
                  </button>
                ))}
              </div>
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
                {editingProject ? 'Zapisz zmiany' : t('createProject')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pusta lista projektów */}
      {projects.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderKanban className="h-14 w-14 text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-semibold">{t('noProjects')}</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">{t('noProjectsDesc')}</p>
            <Button
              onClick={handleOpenCreate}
              className="mt-6 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('newProject')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Siatka kart projektów */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group hover:border-amber-500/30 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="mt-1 line-clamp-2 text-xs">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  {/* Przyciski akcji — widoczne po najechaniu */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenEdit(project)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(project)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Odznaki statusu i trybu publikacji */}
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                      STATUS_COLORS[project.status]
                    )}
                  >
                    {t(`status.${project.status}`)}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      PUBLISH_MODE_COLORS[project.publishMode]
                    )}
                  >
                    {t(`publishMode.${project.publishMode}`)}
                  </span>
                </div>

                {/* Ikony platform */}
                {project.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.platforms.map((p) => (
                      <span
                        key={p}
                        className="text-base"
                        title={t(`platforms.${p}`)}
                      >
                        {PLATFORM_ICONS[p]}
                      </span>
                    ))}
                  </div>
                )}

                {/* Data utworzenia */}
                <p className="text-xs text-muted-foreground">
                  {t('created')}: {new Date(project.createdAt).toLocaleDateString('pl-PL')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Projects;
