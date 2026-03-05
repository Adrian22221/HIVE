/**
 * Typy dla modułu Projektów HIVE
 * Definiuje strukturę projektu social media i powiązanych kont
 */

/** Obsługiwane platformy social media */
export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'tiktok'
  | 'twitter'
  | 'linkedin';

/** Status projektu */
export type ProjectStatus = 'planning' | 'active' | 'completed';

/** Tryb publikacji treści */
export type PublishMode = 'manual' | 'semi-auto' | 'auto';

/** Konto social media powiązane z projektem */
export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  name: string;
  ayrshareProfileKey: string;
}

/** Projekt social media — główna jednostka organizacyjna w HIVE */
export interface Project {
  id: string;
  name: string;
  description: string;
  workspacePath: string;
  status: ProjectStatus;
  publishMode: PublishMode;
  platforms: SocialPlatform[];
  accounts: SocialAccount[];
  createdAt: number;
}
