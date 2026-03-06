/**
 * BackupSettings — eksport i import danych HIVE
 * Agenci i projekty mogą być zapisane do pliku JSON i przywrócone później.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAgentsStore } from '@/stores/agents';
import { useProjectsStore } from '@/stores/projects';
import type { Agent } from '@/types/agent';
import type { Project } from '@/types/project';

/** Format pliku backup HIVE */
interface HiveBackup {
  version: '1';
  app: 'HIVE';
  exportedAt: string;
  data: {
    agents: Agent[];
    projects: Project[];
  };
}

/** Walidacja struktury importowanego pliku */
function parseBackup(raw: string): HiveBackup | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as HiveBackup).app !== 'HIVE' ||
      (parsed as HiveBackup).version !== '1' ||
      !Array.isArray((parsed as HiveBackup).data?.agents) ||
      !Array.isArray((parsed as HiveBackup).data?.projects)
    ) {
      return null;
    }
    return parsed as HiveBackup;
  } catch {
    return null;
  }
}

export function BackupSettings() {
  const { t } = useTranslation('settings');

  const agents = useAgentsStore((s) => s.agents);
  const replaceAllAgents = useAgentsStore((s) => s.replaceAllAgents);
  const mergeAgents = useAgentsStore((s) => s.mergeAgents);

  const projects = useProjectsStore((s) => s.projects);
  const replaceAllProjects = useProjectsStore((s) => s.replaceAllProjects);
  const mergeProjects = useProjectsStore((s) => s.mergeProjects);

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  /** Eksportuje dane do pliku JSON wybranego przez użytkownika */
  const handleExport = async () => {
    setExporting(true);
    try {
      const backup: HiveBackup = {
        version: '1',
        app: 'HIVE',
        exportedAt: new Date().toISOString(),
        data: { agents, projects },
      };

      const jsonString = JSON.stringify(backup, null, 2);
      const date = new Date().toISOString().slice(0, 10);
      const defaultFilename = `hive-backup-${date}.json`;

      const result = await window.electron.ipcRenderer.invoke(
        'backup:export',
        jsonString,
        defaultFilename
      ) as { success: boolean; canceled?: boolean; filePath?: string; error?: string };

      if (result.canceled) return;
      if (result.success) {
        toast.success(t('backup.toast.exported'));
      } else {
        toast.error(t('backup.toast.exportFailed', { error: result.error ?? '' }));
      }
    } catch (err) {
      toast.error(t('backup.toast.exportFailed', { error: String(err) }));
    } finally {
      setExporting(false);
    }
  };

  /** Importuje dane z wybranego pliku JSON — zastępuje lub scala */
  const handleImport = async (mode: 'replace' | 'merge') => {
    setImporting(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'backup:import'
      ) as { success: boolean; canceled?: boolean; content?: string; error?: string };

      if (result.canceled) return;
      if (!result.success || !result.content) {
        toast.error(t('backup.toast.importFailed', { error: result.error ?? '' }));
        return;
      }

      const backup = parseBackup(result.content);
      if (!backup) {
        toast.error(t('backup.toast.invalidFile'));
        return;
      }

      const { agents: importedAgents, projects: importedProjects } = backup.data;

      if (mode === 'replace') {
        replaceAllAgents(importedAgents);
        replaceAllProjects(importedProjects);
        toast.success(
          t('backup.toast.importedReplace', {
            agents: importedAgents.length,
            projects: importedProjects.length,
          })
        );
      } else {
        mergeAgents(importedAgents);
        mergeProjects(importedProjects);
        toast.success(
          t('backup.toast.importedMerge', {
            agents: importedAgents.length,
            projects: importedProjects.length,
          })
        );
      }
    } catch (err) {
      toast.error(t('backup.toast.importFailed', { error: String(err) }));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Eksport */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('backup.export')}</p>
          <p className="text-sm text-muted-foreground">
            {t('backup.exportDesc', { agents: agents.length, projects: projects.length })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting || (agents.length === 0 && projects.length === 0)}
          className="shrink-0"
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? t('backup.exporting') : t('backup.exportBtn')}
        </Button>
      </div>

      <Separator />

      {/* Import */}
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('backup.import')}</p>
          <p className="text-sm text-muted-foreground">{t('backup.importDesc')}</p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t('backup.replaceWarning')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleImport('replace')}
            disabled={importing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? t('backup.importing') : t('backup.importReplaceBtn')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleImport('merge')}
            disabled={importing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? t('backup.importing') : t('backup.importMergeBtn')}
          </Button>
        </div>
      </div>
    </div>
  );
}
