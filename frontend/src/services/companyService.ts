import { apiFetch } from './api';

export interface CompanyProfile {
  organizationName: string;
  country: string;
  currency: string;
  payFrequency: string;
  weekStartsOn: string;
  weekEndsOn: string;
  address: string;
  phone: string;
  email: string;
  overtimeThreshold: string;
  paymentLink: string;
  taxSystem: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  organizationName: 'Central Dispatch Limited',
  country: 'Bermuda',
  currency: 'BMD',
  payFrequency: 'Weekly',
  weekStartsOn: 'Thursday',
  weekEndsOn: 'Wednesday',
  address: '3 Laffan Street, Pembroke HM09',
  phone: '(441) 295-4141',
  email: 'info@bermudaislandtaxi.com',
  overtimeThreshold: '40',
  paymentLink: 'https://ridebermuda-prod.web.app/paylink',
  taxSystem: 'Bermuda Statutory Deduction Matrix Active'
};

const STORAGE_KEY = 'cdl_company_profile_settings';

class CompanyService {
  private getStorage(): CompanyProfile {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMPANY_PROFILE;
    try {
      return { ...DEFAULT_COMPANY_PROFILE, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_COMPANY_PROFILE;
    }
  }

  private saveStorage(profile: CompanyProfile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  public getCompanyProfile(): CompanyProfile {
    // Fetch in background to ensure sync
    apiFetch<{ success: boolean; data: any }>('/settings').then(res => {
      if (res && res.success && res.data) {
        const updated = { ...DEFAULT_COMPANY_PROFILE, ...res.data };
        this.saveStorage(updated);
      }
    }).catch(() => {});

    return this.getStorage();
  }

  public async fetchCompanyProfile(): Promise<CompanyProfile> {
    try {
      const res = await apiFetch<{ success: boolean; data: any }>('/settings');
      if (res && res.success && res.data) {
        const updated = { ...DEFAULT_COMPANY_PROFILE, ...res.data };
        this.saveStorage(updated);
        return updated;
      }
    } catch (err) {
      console.warn('Failed to fetch /settings:', err);
    }
    return this.getStorage();
  }

  public async updateCompanyProfile(profile: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const current = this.getStorage();
    const updated = { ...current, ...profile };
    this.saveStorage(updated);

    try {
      await apiFetch<{ success: boolean; data?: any }>('/settings', {
        method: 'POST',
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Failed to post /settings:', err);
    }
    return updated;
  }
}

export const companyService = new CompanyService();
