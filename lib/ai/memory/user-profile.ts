export type UserProfile = { userId: string; preferredLanguage?: string; preferredTone?: "concise" | "balanced" | "detailed"; favoriteWorkflows: string[]; frequentCommands: string[]; updatedAt: string };
export interface UserProfileStore { get(userId: string): Promise<UserProfile | null>; save(profile: UserProfile): Promise<void>; }

/** User preference memory with deduplicated commands and workflows. */
export class InMemoryUserProfileStore implements UserProfileStore {
  private readonly profiles = new Map<string, UserProfile>();
  async get(userId: string): Promise<UserProfile | null> { return this.profiles.get(userId) ?? null; }
  async save(profile: UserProfile): Promise<void> { this.profiles.set(profile.userId, { ...profile, favoriteWorkflows: unique(profile.favoriteWorkflows), frequentCommands: unique(profile.frequentCommands), updatedAt: new Date().toISOString() }); }
}
/** Learns a user command without allowing the profile to grow unbounded. */
export async function rememberCommand(store: UserProfileStore, userId: string, command: string): Promise<UserProfile> { const current = await store.get(userId); const profile: UserProfile = { userId, preferredLanguage: current?.preferredLanguage, preferredTone: current?.preferredTone, favoriteWorkflows: current?.favoriteWorkflows ?? [], frequentCommands: unique([command, ...(current?.frequentCommands ?? [])]).slice(0, 20), updatedAt: new Date().toISOString() }; await store.save(profile); return profile; }
function unique(values: string[]): string[] { return [...new Set(values.map((value) => value.trim()).filter(Boolean))]; }
