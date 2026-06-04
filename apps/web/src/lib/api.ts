import {
  AUTH_CLEARED_EVENT,
  AUTH_REFRESHED_EVENT,
  clearStoredAuth,
  persistAuth,
  isAccessTokenExpiring,
  readAccessToken,
  readRefreshToken,
} from './storage';
import type {
  AcceptProposalInput,
  AuditLog,
  AuthResponse,
  Contract,
  ContractStatus,
  CreateProjectInput,
  CreateProposalInput,
  Dashboard,
  DisputeMilestoneInput,
  HealthStatus,
  Milestone,
  Paginated,
  Profile,
  Project,
  ProjectStatus,
  Proposal,
  ProposalStatus,
  RegistrationRole,
  UpsertProfileInput,
  User,
} from '../types/api';

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type QueryPrimitive = string | number | boolean | null | undefined;
type QueryValue = QueryPrimitive | QueryPrimitive[];
type Query = Record<string, QueryValue>;

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  query?: Query;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';
let refreshInFlight: Promise<AuthResponse | null> | null = null;

function createUrl(path: string, query?: Query): string {
  const normalizedBase = BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];

    values.forEach((item) => {
      if (item !== undefined && item !== null && item !== '') {
        url.searchParams.append(key, String(item));
      }
    });
  });

  return url.toString();
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const message =
      record.message ??
      record.error ??
      (record.data as Record<string, unknown> | undefined)?.message;
    if (Array.isArray(message)) return message.join(' · ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

async function parsePayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined;

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false) {
    const accessToken = readAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  return fetch(createUrl(path, options.query), {
    ...options,
    headers,
    credentials: 'include',
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });
}

function dispatchAuthCleared(): void {
  window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
}

function dispatchAuthRefreshed(auth: AuthResponse): void {
  window.dispatchEvent(new CustomEvent<AuthResponse>(AUTH_REFRESHED_EVENT, { detail: auth }));
}

async function refreshSession(): Promise<AuthResponse | null> {
  const refreshToken = readRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      auth: false,
      retryOnUnauthorized: false,
      body: { refreshToken },
    })
      .then((auth) => {
        persistAuth(auth);
        dispatchAuthRefreshed(auth);
        return auth;
      })
      .catch(() => {
        clearStoredAuth();
        dispatchAuthCleared();
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const canRefresh = options.auth !== false && options.retryOnUnauthorized !== false;

  if (canRefresh && isAccessTokenExpiring()) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      clearStoredAuth();
      dispatchAuthCleared();
      throw new ApiError('Your session expired. Please sign in again.', 401, null);
    }
  }

  let response = await send(path, options);
  let sessionExpired = false;

  if (response.status === 401 && canRefresh) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await send(path, options);
    } else {
      sessionExpired = true;
      clearStoredAuth();
      dispatchAuthCleared();
    }
  }

  const payload = await parsePayload(response);

  if (!response.ok) {
    throw new ApiError(
      sessionExpired
        ? 'Your session expired. Please sign in again.'
        : extractErrorMessage(payload, response.statusText),
      response.status,
      payload,
    );
  }

  return unwrap<T>(payload);
}

export const api = {
  baseUrl: BASE_URL,

  auth: {
    register(email: string, password: string, role: RegistrationRole) {
      return request<AuthResponse>('/auth/register', {
        method: 'POST',
        auth: false,
        retryOnUnauthorized: false,
        body: { email, password, role },
      });
    },
    login(email: string, password: string) {
      return request<AuthResponse>('/auth/login', {
        method: 'POST',
        auth: false,
        retryOnUnauthorized: false,
        body: { email, password },
      });
    },
    refresh(refreshToken: string) {
      return request<AuthResponse>('/auth/refresh', {
        method: 'POST',
        auth: false,
        retryOnUnauthorized: false,
        body: { refreshToken },
      });
    },
    logout(refreshToken: string) {
      return request<{ revoked: boolean }>('/auth/logout', {
        method: 'POST',
        auth: false,
        retryOnUnauthorized: false,
        body: { refreshToken },
      });
    },
  },

  users: {
    me() {
      return request<User>('/users/me');
    },
  },

  profiles: {
    me() {
      return request<Profile>('/profiles/me');
    },
    get(id: string) {
      return request<Profile>(`/profiles/${id}`, { auth: false });
    },
    upsert(input: UpsertProfileInput) {
      return request<Profile>('/profiles/me', { method: 'PUT', body: input });
    },
  },

  projects: {
    published(
      query: { page?: number; limit?: number; search?: string; skill?: string | string[] } = {},
    ) {
      return request<Paginated<Project>>('/projects', { auth: false, query });
    },
    mine(
      query: {
        page?: number;
        limit?: number;
        status?: ProjectStatus;
        search?: string;
        skill?: string | string[];
      } = {},
    ) {
      return request<Paginated<Project>>('/projects/me', { query });
    },
    get(id: string) {
      return request<Project>(`/projects/${id}`, { auth: false });
    },
    create(input: CreateProjectInput) {
      return request<Project>('/projects', { method: 'POST', body: input });
    },
    publish(id: string) {
      return request<Project>(`/projects/${id}/publish`, { method: 'PATCH' });
    },
  },

  proposals: {
    create(projectId: string, input: CreateProposalInput) {
      return request<Proposal>(`/projects/${projectId}/proposals`, { method: 'POST', body: input });
    },
    mine(query: { page?: number; limit?: number; status?: ProposalStatus } = {}) {
      return request<Paginated<Proposal>>('/proposals/me', { query });
    },
    forProject(
      projectId: string,
      query: { page?: number; limit?: number; status?: ProposalStatus } = {},
    ) {
      return request<Paginated<Proposal>>(`/projects/${projectId}/proposals`, { query });
    },
    withdraw(id: string) {
      return request<Proposal>(`/proposals/${id}/withdraw`, { method: 'PATCH' });
    },
  },

  contracts: {
    accept(proposalId: string, input: AcceptProposalInput) {
      return request<Contract>(`/proposals/${proposalId}/accept`, { method: 'POST', body: input });
    },
    mine(query: { page?: number; limit?: number; status?: ContractStatus } = {}) {
      return request<Paginated<Contract>>('/contracts/me', { query });
    },
    get(id: string) {
      return request<Contract>(`/contracts/${id}`);
    },
  },

  milestones: {
    forContract(contractId: string) {
      return request<Milestone[]>(`/contracts/${contractId}/milestones`);
    },
    get(id: string) {
      return request<Milestone>(`/milestones/${id}`);
    },
    submit(id: string) {
      return request<Milestone>(`/milestones/${id}/submit`, { method: 'PATCH' });
    },
    approve(id: string) {
      return request<Milestone>(`/milestones/${id}/approve`, { method: 'PATCH' });
    },
    release(id: string) {
      return request<Milestone>(`/milestones/${id}/release`, { method: 'PATCH' });
    },
    dispute(id: string, input: DisputeMilestoneInput) {
      return request<Milestone>(`/milestones/${id}/dispute`, { method: 'PATCH', body: input });
    },
  },

  dashboard: {
    me() {
      return request<Dashboard>('/dashboard/me');
    },
  },

  audit: {
    mine(
      query: {
        page?: number;
        limit?: number;
        action?: string;
        resourceType?: string;
        resourceId?: string;
      } = {},
    ) {
      return request<Paginated<AuditLog>>('/audit-logs/me', { query });
    },
  },

  health: {
    live() {
      return request<HealthStatus>('/health/live', { auth: false });
    },
    ready() {
      return request<HealthStatus>('/health/ready', { auth: false });
    },
  },
};
