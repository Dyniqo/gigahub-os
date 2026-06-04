export type UserRole = 'CLIENT' | 'FREELANCER';
export type RegistrationRole = UserRole;
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | string;
export type ProfileType = 'INDIVIDUAL' | 'AGENCY';
export type ProjectStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'CONTRACTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | string;
export type ProposalStatus =
  | 'SUBMITTED'
  | 'SHORTLISTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | string;
export type ContractStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | string;
export type MilestoneStatus =
  | 'FUNDED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'RELEASED'
  | 'DISPUTED'
  | string;

export type JsonObject = Record<string, unknown>;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type Paginated<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type User = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

export type AuthResponse = {
  user: User;
  tokens: TokenResponse;
};

export type Profile = {
  id: string;
  userId: string;
  type: ProfileType;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
  timezone: string | null;
  hourlyRate: string | null;
  currency: string | null;
  skills: string[];
  createdAt: string;
  updatedAt: string;
};

export type UpsertProfileInput = {
  type: ProfileType;
  displayName: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  countryCode?: string;
  timezone?: string;
  hourlyRate?: number;
  currency?: string;
  skills?: string[];
};

export type Project = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: ProjectStatus;
  budgetMin: string | null;
  budgetMax: string | null;
  currency: string;
  publishedAt: string | null;
  closedAt: string | null;
  skills: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CreateProjectInput = {
  title: string;
  description: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  skills?: string[];
};

export type ProposalProjectSummary = {
  id: string;
  clientId: string;
  title: string;
  status: ProjectStatus;
};

export type Proposal = {
  id: string;
  projectId: string;
  freelancerId: string;
  coverLetter: string;
  proposedAmount: string;
  currency: string;
  deliveryDays: number;
  status: ProposalStatus;
  submittedAt: string;
  decidedAt: string | null;
  project: ProposalProjectSummary;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CreateProposalInput = {
  coverLetter: string;
  proposedAmount: number;
  currency?: string;
  deliveryDays: number;
};

export type ContractMilestoneInput = {
  title: string;
  description?: string;
  amount: number;
  dueAt?: string;
};

export type AcceptProposalInput = {
  milestones: ContractMilestoneInput[];
  terms?: Record<string, string | number | boolean | null>;
};

export type ContractProjectSummary = {
  id: string;
  title: string;
  status: ProjectStatus;
};

export type ContractMilestone = {
  id: string;
  title: string;
  description: string | null;
  amount: string;
  currency: string;
  dueAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  releasedAt: string | null;
  status: MilestoneStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type Contract = {
  id: string;
  projectId: string;
  proposalId: string;
  clientId: string;
  freelancerId: string;
  status: ContractStatus;
  totalAmount: string;
  currency: string;
  startedAt: string;
  endedAt: string | null;
  terms: unknown | null;
  project: ContractProjectSummary;
  milestones: ContractMilestone[];
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type MilestoneContractSummary = {
  id: string;
  clientId: string;
  freelancerId: string;
  status: ContractStatus;
  project: ContractProjectSummary;
};

export type Milestone = ContractMilestone & {
  contractId: string;
  contract: MilestoneContractSummary;
};

export type DisputeMilestoneInput = {
  reason: string;
  evidenceUrls?: string[];
};

export type StatusCount = {
  status: string;
  count: number;
};

export type MoneyAmount = {
  currency: string;
  amount: string;
};

export type Dashboard = {
  generatedAt: string;
  projectStatuses: StatusCount[];
  proposalStatuses: StatusCount[];
  contractStatuses: StatusCount[];
  milestoneStatuses: StatusCount[];
  workQueue: {
    clientMilestonesWaitingForReview: number;
    freelancerMilestonesReadyToSubmit: number;
    proposalsWaitingForClientDecision: number;
    activeContractsAsClient: number;
    activeContractsAsFreelancer: number;
  };
  financials: {
    earned: MoneyAmount[];
    spent: MoneyAmount[];
    pendingEarnings: MoneyAmount[];
    committedSpend: MoneyAmount[];
  };
  recentActivity: Pick<AuditLog, 'id' | 'action' | 'resourceType' | 'resourceId' | 'createdAt'>[];
};

export type AuditLog = {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown | null;
  createdAt: string;
};

export type HealthStatus = {
  status?: string;
  info?: Record<string, unknown>;
  error?: Record<string, unknown>;
  details?: Record<string, unknown>;
};
