/**
 * API Client — Centralized HTTP layer for communicating with the backend.
 *
 * All requests go through the Vite dev proxy (`/api` → `http://localhost:3000`),
 * so no absolute URLs are needed. JWT token is automatically injected from
 * localStorage when available.
 *
 * When the backend is unreachable, callers should fall back to mock data —
 * this module throws typed errors that stores can catch.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─── Token Management ─────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  return localStorage.getItem('jwt_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('jwt_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_info');
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem('user_info');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser): void {
  localStorage.setItem('user_info', JSON.stringify(user));
}

// ─── Types ────────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export interface LoginResponse {
  token: string;
  user: StoredUser;
}

export interface ApiKpiSubmission {
  id: string;
  periodId: string;
  department: string;
  data: Record<string, unknown>;
  sectionStatuses: Record<string, string>;
  submittedById: string;
  submittedAt: string | null;
  lastUpdated: string;
  createdAt: string;
  submittedBy?: { id: string; name: string; email: string };
}

export interface ApiKpiPeriod {
  id: string;
  month: number;
  year: number;
  label: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData bodies
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error || res.statusText, res.status);
  }

  return res.json();
}

// ─── Auth API ─────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Persist token and user info
  setStoredToken(result.token);
  setStoredUser(result.user);

  return result;
}

export async function checkHealth(): Promise<boolean> {
  try {
    await apiFetch<{ status: string }>('/health');
    return true;
} catch {
    return false;
  }
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<{ url: string }>('/upload', {
    method: 'POST',
    body: formData,
  });
}

// ─── KPI API ──────────────────────────────────────────────────────────────

export async function fetchPeriods(): Promise<ApiKpiPeriod[]> {
  return apiFetch<ApiKpiPeriod[]>('/kpi/periods');
}

export async function fetchKpiSubmissions(department?: string): Promise<ApiKpiSubmission[]> {
  const query = department ? `?department=${encodeURIComponent(department)}` : '';
  return apiFetch<ApiKpiSubmission[]>(`/kpi/submissions${query}`);
}

export async function fetchKpiSubmission(
  periodId: string,
  department?: string
): Promise<ApiKpiSubmission> {
  const query = department ? `?department=${encodeURIComponent(department)}` : '';
  return apiFetch<ApiKpiSubmission>(`/kpi/submissions/${periodId}${query}`);
}

export async function saveKpiSubmission(payload: {
  periodId: string;
  department: string;
  data: Record<string, unknown>;
  sectionStatuses: Record<string, string>;
  submittedAt?: string;
}): Promise<ApiKpiSubmission> {
  return apiFetch<ApiKpiSubmission>('/kpi/submissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function saveKpiSection(
  periodId: string,
  payload: {
    department: string;
    sectionKey: string;
    values: Record<string, unknown>;
  }
): Promise<ApiKpiSubmission> {
  return apiFetch<ApiKpiSubmission>(`/kpi/submissions/${periodId}/section`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function fetchDashboardOverview(
  department?: string
): Promise<{
  submissions: ApiKpiSubmission[];
  departments: string[];
  totalSubmissions: number;
}> {
  const query = department ? `?department=${encodeURIComponent(department)}` : '';
  return apiFetch(`/kpi/dashboard/overview${query}`);
}

// ─── Faculty KPI API ──────────────────────────────────────────────────────

export interface ApiFacultyKpiSubmission {
  id: string;
  periodId: string;
  department: string;
  facultyId: string;
  data: Record<string, unknown>;
  status: string; // DRAFT | SUBMITTED | APPROVED | REJECTED
  reviewedById: string | null;
  reviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  lastUpdated: string;
  createdAt: string;
  faculty?: { id: string; name: string; email: string; department: string };
  reviewedBy?: { id: string; name: string } | null;
}

/** Faculty saves/submits their personal KPI data */
export async function saveFacultyKpiSubmission(payload: {
  periodId: string;
  data: Record<string, unknown>;
  submit?: boolean;
}): Promise<ApiFacultyKpiSubmission> {
  return apiFetch<ApiFacultyKpiSubmission>('/faculty-kpi/submissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Faculty fetches their own submissions */
export async function fetchMyFacultyKpiSubmissions(): Promise<ApiFacultyKpiSubmission[]> {
  return apiFetch<ApiFacultyKpiSubmission[]>('/faculty-kpi/submissions/my');
}

/** Faculty fetches their submission for a specific period */
export async function fetchMyFacultyKpiSubmission(
  periodId: string
): Promise<ApiFacultyKpiSubmission> {
  return apiFetch<ApiFacultyKpiSubmission>(`/faculty-kpi/submissions/my/${periodId}`);
}

/** HOD fetches all faculty submissions for their department */
export async function fetchDepartmentFacultySubmissions(
  periodId?: string,
  status?: string
): Promise<ApiFacultyKpiSubmission[]> {
  const params = new URLSearchParams();
  if (periodId) params.set('periodId', periodId);
  if (status) params.set('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<ApiFacultyKpiSubmission[]>(`/faculty-kpi/department${query}`);
}

/** HOD approves or rejects a faculty submission */
export async function reviewFacultyKpiSubmission(
  id: string,
  action: 'APPROVED' | 'REJECTED',
  reviewNote?: string
): Promise<ApiFacultyKpiSubmission> {
  return apiFetch<ApiFacultyKpiSubmission>(`/faculty-kpi/submissions/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ action, reviewNote }),
  });
}

