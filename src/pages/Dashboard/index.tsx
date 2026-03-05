/**
 * Dashboard Page
 * Main overview page showing system status and quick actions
 */
import { useEffect, useState } from 'react';
import {
  Activity,
  MessageSquare,
  Radio,
  Puzzle,
  Clock,
  Settings,
  Plus,
  Terminal,
  FolderKanban,
  Bot,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGatewayStore } from '@/stores/gateway';
import { useChannelsStore } from '@/stores/channels';
import { useSkillsStore } from '@/stores/skills';
import { useSettingsStore } from '@/stores/settings';
import { useProjectsStore } from '@/stores/projects';
import { useAgentsStore } from '@/stores/agents';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useTranslation } from 'react-i18next';

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📷',
  facebook: '📘',
  youtube: '▶️',
  tiktok: '🎵',
  twitter: '𝕏',
  linkedin: '💼',
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const AGENT_STATUS_COLORS: Record<string, string> = {
  idle: 'bg-slate-500/20 text-slate-400',
  working: 'bg-amber-500/20 text-amber-400',
  waiting: 'bg-blue-500/20 text-blue-400',
  done: 'bg-green-500/20 text-green-400',
  error: 'bg-red-500/20 text-red-400',
};

export function Dashboard() {
  const { t } = useTranslation('dashboard');
  const gatewayStatus = useGatewayStore((state) => state.status);
  const { channels, fetchChannels } = useChannelsStore();
  const { skills, fetchSkills } = useSkillsStore();
  const devModeUnlocked = useSettingsStore((state) => state.devModeUnlocked);
  const { projects } = useProjectsStore();
  const { agents } = useAgentsStore();

  const isGatewayRunning = gatewayStatus.state === 'running';
  const [uptime, setUptime] = useState(0);

  // Fetch data only when gateway is running
  useEffect(() => {
    if (isGatewayRunning) {
      fetchChannels();
      fetchSkills();
    }
  }, [fetchChannels, fetchSkills, isGatewayRunning]);

  // Calculate statistics safely
  const connectedChannels = Array.isArray(channels) ? channels.filter((c) => c.status === 'connected').length : 0;
  const enabledSkills = Array.isArray(skills) ? skills.filter((s) => s.enabled).length : 0;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const approvedAgents = agents.filter((a) => a.approved).length;
  const pendingAgents = agents.filter((a) => !a.approved).length;

  // Update uptime periodically
  useEffect(() => {
    const updateUptime = () => {
      if (gatewayStatus.connectedAt) {
        setUptime(Math.floor((Date.now() - gatewayStatus.connectedAt) / 1000));
      } else {
        setUptime(0);
      }
    };

    // Update immediately
    updateUptime();

    // Update every second
    const interval = setInterval(updateUptime, 1000);

    return () => clearInterval(interval);
  }, [gatewayStatus.connectedAt]);

  const openDevConsole = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('gateway:getControlUiUrl') as {
        success: boolean;
        url?: string;
        error?: string;
      };
      if (result.success && result.url) {
        window.electron.openExternal(result.url);
      } else {
        console.error('Failed to get Dev Console URL:', result.error);
      }
    } catch (err) {
      console.error('Error opening Dev Console:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Gateway Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('gateway')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <StatusBadge status={gatewayStatus.state} />
            </div>
            {gatewayStatus.state === 'running' && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('port', { port: gatewayStatus.port })} | {t('pid', { pid: gatewayStatus.pid || 'N/A' })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Channels */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('channels')}</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedChannels}</div>
            <p className="text-xs text-muted-foreground">
              {t('connectedOf', { connected: connectedChannels, total: channels.length })}
            </p>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('skills')}</CardTitle>
            <Puzzle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledSkills}</div>
            <p className="text-xs text-muted-foreground">
              {t('enabledOf', { enabled: enabledSkills, total: skills.length })}
            </p>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('uptime')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uptime > 0 ? formatUptime(uptime) : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {gatewayStatus.state === 'running' ? t('sinceRestart') : t('gatewayNotRunning')}
            </p>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('projects')}</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('activeOf', { active: activeProjects, total: projects.length })}
            </p>
          </CardContent>
        </Card>

        {/* Agents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('agents')}</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedAgents}</div>
            <p className="text-xs text-muted-foreground">
              {pendingAgents > 0
                ? t('agentsPending', { pending: pendingAgents })
                : t('approvedOf', { approved: approvedAgents, total: agents.length })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quickActions.title')}</CardTitle>
          <CardDescription>{t('quickActions.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to="/projects">
                <FolderKanban className="h-5 w-5" />
                <span>{t('quickActions.newProject')}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to="/agents">
                <Bot className="h-5 w-5" />
                <span>{t('quickActions.newAgent')}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to="/channels">
                <Plus className="h-5 w-5" />
                <span>{t('quickActions.addChannel')}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to="/skills">
                <Puzzle className="h-5 w-5" />
                <span>{t('quickActions.browseSkills')}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to="/">
                <MessageSquare className="h-5 w-5" />
                <span>{t('quickActions.openChat')}</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to="/settings">
                <Settings className="h-5 w-5" />
                <span>{t('quickActions.settings')}</span>
              </Link>
            </Button>
            {devModeUnlocked && (
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                onClick={openDevConsole}
              >
                <Terminal className="h-5 w-5" />
                <span>{t('quickActions.devConsole')}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects & Agents */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('recentProjects')}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projects">{t('viewAll')}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('noProjects')}</p>
                <Button variant="link" asChild className="mt-2">
                  <Link to="/projects">{t('createFirst')}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.platforms.map((p) => PLATFORM_ICONS[p]).join(' ')}
                      </p>
                    </div>
                    <span className={`ml-2 shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PROJECT_STATUS_COLORS[project.status]}`}>
                      {t(`projectStatus.${project.status}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Agents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('activeAgents')}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/agents">{t('viewAll')}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('noAgents')}</p>
                <Button variant="link" asChild className="mt-2">
                  <Link to="/agents">{t('addFirstAgent')}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {agents.filter((a) => a.approved).slice(0, 5).map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <span className="text-xl shrink-0">{agent.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.model}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${AGENT_STATUS_COLORS[agent.status]}`}>
                      {t(`agentStatus.${agent.status}`)}
                    </span>
                  </div>
                ))}
                {pendingAgents > 0 && (
                  <Button variant="outline" size="sm" className="w-full border-amber-500/30 text-amber-500" asChild>
                    <Link to="/agents">
                      {t('agentsPendingAction', { count: pendingAgents })}
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Channels & Skills */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Connected Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('connectedChannels')}</CardTitle>
          </CardHeader>
          <CardContent>
            {channels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('noChannels')}</p>
                <Button variant="link" asChild className="mt-2">
                  <Link to="/channels">{t('addFirst')}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {channels.slice(0, 5).map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {channel.type === 'whatsapp' && '📱'}
                        {channel.type === 'telegram' && '✈️'}
                        {channel.type === 'discord' && '🎮'}
                      </span>
                      <div>
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {channel.type}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={channel.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enabled Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('activeSkills')}</CardTitle>
          </CardHeader>
          <CardContent>
            {skills.filter((s) => s.enabled).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Puzzle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('noSkills')}</p>
                <Button variant="link" asChild className="mt-2">
                  <Link to="/skills">{t('enableSome')}</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills
                  .filter((s) => s.enabled)
                  .slice(0, 12)
                  .map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.icon && <span className="mr-1">{skill.icon}</span>}
                      {skill.name}
                    </Badge>
                  ))}
                {skills.filter((s) => s.enabled).length > 12 && (
                  <Badge variant="outline">
                    {t('more', { count: skills.filter((s) => s.enabled).length - 12 })}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export default Dashboard;
