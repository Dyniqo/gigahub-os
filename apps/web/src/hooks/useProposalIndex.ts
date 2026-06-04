import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import {
  cachedResource,
  getCachedValue,
  invalidateResource,
  setCachedResource,
} from '../lib/resourceCache';
import type { Proposal, UserRole } from '../types/api';

const PROPOSAL_INDEX_TTL = 60_000;
const PROPOSAL_INDEX_LIMIT = 50;

function proposalIndexKey(userId?: string | null): string {
  return userId ? `proposals:index:me:${userId}` : 'proposals:index:me:anonymous';
}

export type ProposalIndex = {
  proposals: Proposal[];
  byProjectId: Map<string, Proposal>;
  isLoading: boolean;
  error: string | null;
  refresh(force?: boolean): Promise<Proposal[]>;
  find(projectId?: string | null): Proposal | null;
};

async function loadProposalIndex(userId?: string | null, force = false): Promise<Proposal[]> {
  return cachedResource(
    proposalIndexKey(userId),
    async () => {
      const firstPage = await api.proposals.mine({ page: 1, limit: PROPOSAL_INDEX_LIMIT });
      return firstPage.items;
    },
    PROPOSAL_INDEX_TTL,
    force,
  );
}

export function invalidateProposalIndex(userId?: string | null): void {
  invalidateResource(userId ? proposalIndexKey(userId) : 'proposals:index:me');
}

export function primeProposalIndex(proposal: Proposal, userId?: string | null): void {
  const key = proposalIndexKey(userId);
  const current = getCachedValue<Proposal[]>(key) ?? [];
  const next = [
    proposal,
    ...current.filter((item) => item.id !== proposal.id && item.projectId !== proposal.projectId),
  ];
  setCachedResource(key, next, PROPOSAL_INDEX_TTL);
}

export function useProposalIndex(
  enabled: boolean,
  role?: UserRole | null,
  userId?: string | null,
): ProposalIndex {
  const shouldLoad = enabled && role === 'FREELANCER' && Boolean(userId);
  const key = proposalIndexKey(userId);
  const [proposals, setProposals] = useState<Proposal[]>(
    () => getCachedValue<Proposal[]>(key) ?? [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh(force = false) {
    if (!shouldLoad) return [];
    setIsLoading(true);
    setError(null);
    try {
      const next = await loadProposalIndex(userId, force);
      setProposals(next);
      return next;
    } catch (errorValue) {
      setError(
        errorValue instanceof Error ? errorValue.message : 'Proposal state could not be checked.',
      );
      return proposals;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!shouldLoad) {
      setProposals([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const cached = getCachedValue<Proposal[]>(proposalIndexKey(userId));
    if (cached) setProposals(cached);
    void refresh(false);
  }, [shouldLoad, userId]);

  const byProjectId = useMemo(() => {
    const map = new Map<string, Proposal>();
    proposals.forEach((proposal) => {
      if (!map.has(proposal.projectId)) map.set(proposal.projectId, proposal);
    });
    return map;
  }, [proposals]);

  return {
    proposals,
    byProjectId,
    isLoading,
    error,
    refresh,
    find(projectId?: string | null) {
      return projectId ? (byProjectId.get(projectId) ?? null) : null;
    },
  };
}
