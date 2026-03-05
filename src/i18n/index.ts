import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// EN
import enCommon from './locales/en/common.json';
import enSettings from './locales/en/settings.json';
import enDashboard from './locales/en/dashboard.json';
import enChat from './locales/en/chat.json';
import enChannels from './locales/en/channels.json';
import enSkills from './locales/en/skills.json';
import enCron from './locales/en/cron.json';
import enSetup from './locales/en/setup.json';
import enProjects from './locales/en/projects.json';
import enAgents from './locales/en/agents.json';
import enTasks from './locales/en/tasks.json';

// PL
import plCommon from './locales/pl/common.json';
import plSettings from './locales/pl/settings.json';
import plDashboard from './locales/pl/dashboard.json';
import plChat from './locales/pl/chat.json';
import plChannels from './locales/pl/channels.json';
import plSkills from './locales/pl/skills.json';
import plCron from './locales/pl/cron.json';
import plSetup from './locales/pl/setup.json';
import plProjects from './locales/pl/projects.json';
import plAgents from './locales/pl/agents.json';
import plTasks from './locales/pl/tasks.json';

// ZH
import zhCommon from './locales/zh/common.json';
import zhSettings from './locales/zh/settings.json';
import zhDashboard from './locales/zh/dashboard.json';
import zhChat from './locales/zh/chat.json';
import zhChannels from './locales/zh/channels.json';
import zhSkills from './locales/zh/skills.json';
import zhCron from './locales/zh/cron.json';
import zhSetup from './locales/zh/setup.json';
import zhProjects from './locales/zh/projects.json';
import zhAgents from './locales/zh/agents.json';
import zhTasks from './locales/zh/tasks.json';

// JA
import jaCommon from './locales/ja/common.json';
import jaSettings from './locales/ja/settings.json';
import jaDashboard from './locales/ja/dashboard.json';
import jaChat from './locales/ja/chat.json';
import jaChannels from './locales/ja/channels.json';
import jaSkills from './locales/ja/skills.json';
import jaCron from './locales/ja/cron.json';
import jaSetup from './locales/ja/setup.json';
import jaProjects from './locales/ja/projects.json';
import jaAgents from './locales/ja/agents.json';
import jaTasks from './locales/ja/tasks.json';

export const SUPPORTED_LANGUAGES = [
    { code: 'pl', label: 'Polski' },
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const resources = {
    pl: {
        common: plCommon,
        settings: plSettings,
        dashboard: plDashboard,
        chat: plChat,
        channels: plChannels,
        skills: plSkills,
        cron: plCron,
        setup: plSetup,
        projects: plProjects,
        agents: plAgents,
        tasks: plTasks,
    },
    en: {
        common: enCommon,
        settings: enSettings,
        dashboard: enDashboard,
        chat: enChat,
        channels: enChannels,
        skills: enSkills,
        cron: enCron,
        setup: enSetup,
        projects: enProjects,
        agents: enAgents,
        tasks: enTasks,
    },
    zh: {
        common: zhCommon,
        settings: zhSettings,
        dashboard: zhDashboard,
        chat: zhChat,
        channels: zhChannels,
        skills: zhSkills,
        cron: zhCron,
        setup: zhSetup,
        projects: zhProjects,
        agents: zhAgents,
        tasks: zhTasks,
    },
    ja: {
        common: jaCommon,
        settings: jaSettings,
        dashboard: jaDashboard,
        chat: jaChat,
        channels: jaChannels,
        skills: jaSkills,
        cron: jaCron,
        setup: jaSetup,
        projects: jaProjects,
        agents: jaAgents,
        tasks: jaTasks,
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'pl', // Polski jako domyślny język
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: ['common', 'settings', 'dashboard', 'chat', 'channels', 'skills', 'cron', 'setup', 'projects', 'agents', 'tasks'],
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

export default i18n;
