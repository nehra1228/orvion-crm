export type CompanyProfile = { companyId: string; companyName: string; businessType?: string; projects: string[]; salesProcess: string[]; departments: string[]; crmVersion?: string; policies: string[]; updatedAt: string };
export interface CompanyProfileStore { get(companyId: string): Promise<CompanyProfile | null>; save(profile: CompanyProfile): Promise<void>; }

/** Company context store used to ground agents in business-specific policies and workflows. */
export class InMemoryCompanyProfileStore implements CompanyProfileStore {
  private readonly profiles = new Map<string, CompanyProfile>();
  async get(companyId: string): Promise<CompanyProfile | null> { return this.profiles.get(companyId) ?? null; }
  async save(profile: CompanyProfile): Promise<void> { this.profiles.set(profile.companyId, { ...profile, projects: normalize(profile.projects), salesProcess: normalize(profile.salesProcess), departments: normalize(profile.departments), policies: normalize(profile.policies), updatedAt: new Date().toISOString() }); }
}
function normalize(values: string[]): string[] { return [...new Set(values.map((value) => value.trim()).filter(Boolean))]; }
