import { create } from 'zustand';
import type {
  UserRole,
  KpiSubmission,
  SectionKey,
  SectionStatus,
  KpiData,
  Notification,
  KpiPeriod,
} from './types';
export const emptyKpiData: KpiData = {
  faculty: { profCount: 0, assocProfCount: 0, asstProfCount: 0, resignedLastMonth: 0, studentFacultyRatio: '' },
  lms: { lessonPlansNotInLms: 0, facultyNamesNotInLms: [], facultyLessThan5Items: 0 },
  latePunchIn: { latePunchInsLastMonth: 0 },
  facultyPublications: { q1Publications: 0, q2Publications: 0, otherApprovedJournals: 0, conferencePapers: 0, q1UnderPreparation: 0, q2UnderPreparation: 0, journalUnderPreparation: 0, facultyNilPublications: 0 },
  studentPublications: { q1Publications: 0, q2Publications: 0, otherApprovedJournals: 0, conferencePapers: 0, q1UnderPreparation: 0, q2UnderPreparation: 0, journalUnderPreparation: 0, projectsWithoutPublications: 0 },
  fundedProjects: { projectsUnderExecution: 0, proposalsUnderPreparation: 0 },
  phdGuideship: { eligibleNotRegistered: 0, namesEligibleNotRegistered: [], registeredGuides: 0, guidesWithNilStudents: 0 },
  mous: { activeMous: 0, mou1Activity: '', mou2Activity: '', mou3Activity: '', mouSummaries: [] },
  fdp: { facultyWithFdp: 0, facultyNilFdp: 0, totalFdpHours: 0 },
  placement: { totalWithOffers: 0, totalWithoutOffers: 0, ctcAbove20L: 0, ctc10to20L: 0, ctc6to10L: 0, ctcBelow6L: 0 },
  awardsFaculty: { totalAwards: 0 },
  awardsStudents: { academicHackathonAwards: 0, sportsMusicAwards: 0 },
  consultancy: { consultanciesUnderExecution: 0, newConsultanciesThisMonth: 0 },
  partialDelivery: { subjectsWithPd: 0, totalPdHours: 0, expertsEngaging: 0 },
  patentsIpr: { patentsFiled: 0, patentsPublished: 0, patentsGranted: 0 },
};
import {
  login as apiLogin,
  checkHealth,
  fetchPeriods as apiFetchPeriods,
  fetchKpiSubmissions,
  saveKpiSubmission as apiSaveKpiSubmission,
  saveKpiSection as apiSaveKpiSection,
  getStoredToken,
  getStoredUser,
  clearStoredToken,
  type StoredUser,
  type ApiError,
} from './api';

// ─── Department Store ─────────────────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  shortName: string;
  color: string; // tailwind bg color class
}

export const departments: Department[] = [
  { id: 'csbs', name: 'Computer Science & Business Systems', shortName: 'CSBS', color: '#f97316' },
  { id: 'mech', name: 'Mechanical Engineering', shortName: 'MECH', color: '#64748b' },
];

interface DeptState {
  selectedDeptId: string;
  setDept: (id: string) => void;
  getSelectedDept: () => Department;
}

export const useDeptStore = create<DeptState>((set, get) => ({
  selectedDeptId: 'csbs',
  setDept: (id) => set({ selectedDeptId: id }),
  getSelectedDept: () => {
    const id = get().selectedDeptId;
    return departments.find((d) => d.id === id) ?? departments[0];
  },
}));

// ─── Auth Store ───────────────────────────────────────────────────────────
interface AuthState {
  role: UserRole | null;
  token: string | null;
  user: StoredUser | null;
  isApiAvailable: boolean;
  isLoading: boolean;
  loginError: string | null;

  // Actions
  setRole: (role: UserRole) => void;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  loginAsDemo: (role: UserRole) => void;
  logout: () => void;
  checkApiHealth: () => Promise<boolean>;
  restoreSession: () => void;
}

/** Map backend role strings to frontend UserRole */
function mapRole(backendRole: string): UserRole {
  switch (backendRole) {
    case 'HOD':
      return 'hod';
    case 'MANAGEMENT':
      return 'management';
    case 'FACULTY':
      return 'faculty';
    default:
      return 'faculty';
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  token: null,
  user: null,
  isApiAvailable: false,
  isLoading: false,
  loginError: null,

  setRole: (role) => set({ role }),

  loginWithCredentials: async (email: string, password: string) => {
    set({ isLoading: true, loginError: null });
    try {
      const result = await apiLogin(email, password);
      set({
        role: mapRole(result.user.role),
        token: result.token,
        user: result.user,
        isApiAvailable: true,
        isLoading: false,
        loginError: null,
      });
    } catch (err) {
      const apiErr = err as ApiError;
      set({
        isLoading: false,
        loginError: apiErr.message || 'Login failed. Please check your credentials.',
      });
      throw err;
    }
  },

  loginAsDemo: (role: UserRole) => {
    set({
      role,
      token: null,
      user: null,
      isApiAvailable: false,
      loginError: null,
    });
  },

  logout: () => {
    clearStoredToken();
    set({
      role: null,
      token: null,
      user: null,
      loginError: null,
    });
  },

  checkApiHealth: async () => {
    const available = await checkHealth();
    set({ isApiAvailable: available });
    return available;
  },

  restoreSession: () => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      set({
        role: mapRole(user.role),
        token,
        user,
        isApiAvailable: true,
      });
    }
  },
}));

// ─── KPI Store ────────────────────────────────────────────────────────────
interface KpiState {
  currentPeriodId: string;
  periods: KpiPeriod[];
  submissions: Record<string, KpiSubmission>;
  isSyncing: boolean;
  syncError: string | null;

  setCurrentPeriod: (periodId: string) => void;
  getSubmission: (periodId: string) => KpiSubmission;
  getSectionStatus: (periodId: string, sectionKey: SectionKey) => SectionStatus;
  saveSection: (periodId: string, sectionKey: SectionKey, values: Record<string, unknown>) => void;
  submitAll: (periodId: string) => void;

  // API-backed actions
  loadPeriodsFromApi: () => Promise<void>;
  loadSubmissionsFromApi: (department: string) => Promise<void>;
  saveSectionToApi: (periodId: string, sectionKey: SectionKey, values: Record<string, unknown>, department: string) => Promise<void>;
  syncSubmissionToApi: (periodId: string, department: string) => Promise<void>;
}

export const useKpiStore = create<KpiState>((set, get) => ({
  currentPeriodId: '',
  periods: [],
  submissions: {},
  isSyncing: false,
  syncError: null,

  setCurrentPeriod: (periodId) => set({ currentPeriodId: periodId }),

  getSubmission: (periodId) => {
    const sub = get().submissions[periodId];
    if (sub) return sub;
    // Create empty submission for unknown period
    const newSub: KpiSubmission = {
      periodId,
      data: { ...emptyKpiData },
      sectionStatuses: {
        faculty: 'not_started', lms: 'not_started', latePunchIn: 'not_started',
        facultyPublications: 'not_started', studentPublications: 'not_started',
        fundedProjects: 'not_started', phdGuideship: 'not_started', mous: 'not_started',
        fdp: 'not_started', placement: 'not_started', awardsFaculty: 'not_started',
        awardsStudents: 'not_started', consultancy: 'not_started',
        partialDelivery: 'not_started', patentsIpr: 'not_started',
      },
      lastUpdated: new Date().toISOString(),
    };
    set((state) => ({
      submissions: { ...state.submissions, [periodId]: newSub },
    }));
    return newSub;
  },

  getSectionStatus: (periodId, sectionKey) => {
    const sub = get().getSubmission(periodId);
    return sub.sectionStatuses[sectionKey];
  },

  saveSection: (periodId, sectionKey, values) => {
    set((state) => {
      const sub = state.submissions[periodId] || get().getSubmission(periodId);
      const updatedData = {
        ...sub.data,
        [sectionKey]: { ...sub.data[sectionKey], ...values },
      };
      const updatedStatuses = {
        ...sub.sectionStatuses,
        [sectionKey]: 'completed' as SectionStatus,
      };
      return {
        submissions: {
          ...state.submissions,
          [periodId]: {
            ...sub,
            data: updatedData as KpiData,
            sectionStatuses: updatedStatuses,
            lastUpdated: new Date().toISOString(),
          },
        },
      };
    });
  },

  submitAll: (periodId) => {
    set((state) => {
      const sub = state.submissions[periodId];
      if (!sub) return state;
      const allCompleted: Record<SectionKey, SectionStatus> = {} as Record<SectionKey, SectionStatus>;
      for (const key of Object.keys(sub.sectionStatuses) as SectionKey[]) {
        allCompleted[key] = 'completed';
      }
      return {
        submissions: {
          ...state.submissions,
          [periodId]: {
            ...sub,
            sectionStatuses: allCompleted,
            submittedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          },
        },
      };
    });
  },

  // ─── API-backed actions ──────────────────────────────────────────────

  loadPeriodsFromApi: async () => {
    try {
      const periods = await apiFetchPeriods();
      if (periods && periods.length > 0) {
        set({
          periods,
          currentPeriodId: periods[periods.length - 1].id,
        });
      }
    } catch {
      // Keep mock periods as fallback — no-op
      console.warn('Failed to load periods from API, using mock data');
    }
  },

  loadSubmissionsFromApi: async (department: string) => {
    try {
      set({ isSyncing: true, syncError: null });
      const apiSubmissions = await fetchKpiSubmissions(department);

      if (apiSubmissions && apiSubmissions.length > 0) {
        const submissionsMap: Record<string, KpiSubmission> = {};
        for (const apiSub of apiSubmissions) {
          submissionsMap[apiSub.periodId] = {
            periodId: apiSub.periodId,
            data: apiSub.data as unknown as KpiData,
            sectionStatuses: apiSub.sectionStatuses as Record<SectionKey, SectionStatus>,
            lastUpdated: apiSub.lastUpdated,
            submittedAt: apiSub.submittedAt || undefined,
          };
        }
        set({ submissions: submissionsMap, isSyncing: false });
      } else {
        set({ isSyncing: false });
        // Keep mock data if no API submissions exist
      }
    } catch {
      console.warn('Failed to load submissions from API, using mock data');
      set({ isSyncing: false });
    }
  },

  saveSectionToApi: async (periodId, sectionKey, values, department) => {
    // Always save locally first (optimistic update)
    get().saveSection(periodId, sectionKey, values);

    try {
      set({ isSyncing: true, syncError: null });
      await apiSaveKpiSection(periodId, {
        department,
        sectionKey,
        values,
      });
      set({ isSyncing: false });
    } catch (err) {
      console.warn('Failed to save section to API (local save succeeded):', err);
      set({ isSyncing: false, syncError: 'Failed to sync with server' });
    }
  },

  syncSubmissionToApi: async (periodId, department) => {
    const sub = get().getSubmission(periodId);
    try {
      set({ isSyncing: true, syncError: null });
      await apiSaveKpiSubmission({
        periodId,
        department,
        data: sub.data as unknown as Record<string, unknown>,
        sectionStatuses: sub.sectionStatuses,
        submittedAt: sub.submittedAt,
      });
      set({ isSyncing: false });
    } catch (err) {
      console.warn('Failed to sync submission to API:', err);
      set({ isSyncing: false, syncError: 'Failed to sync with server' });
    }
  },
}));

// ─── Notification Store ──────────────────────────────────────────────────
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));

// ─── Theme Store ──────────────────────────────────────────────────────────
interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return { isDark: next };
    }),
  setDark: (dark) => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    set({ isDark: dark });
  },
}));
