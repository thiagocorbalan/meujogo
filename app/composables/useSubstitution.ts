import type { CreateSubstitutionRequest, Substitution } from '~/types/match';

export interface PoolPlayerDto {
  id: number;
  name: string;
}

export interface WaitingTeamDto {
  team: { id: number; name: string; color: string };
  players: PoolPlayerDto[];
}

export interface AvailablePoolDto {
  reserves: PoolPlayerDto[];
  waitingTeams: WaitingTeamDto[];
}

export function useSubstitution() {
  const { fetch } = useApi();
  return {
    createSubstitution: (sessionId: string | number, data: CreateSubstitutionRequest) =>
      fetch<Substitution>(`/sessions/${sessionId}/substitutions`, {
        method: 'POST',
        body: data,
      }),
    getSubstitutions: (sessionId: string | number) =>
      fetch<Substitution[]>(`/sessions/${sessionId}/substitutions`),
    getAvailablePool: (sessionId: string | number) =>
      fetch<AvailablePoolDto>(`/sessions/${sessionId}/substitutions/pool`),
    undoSubstitution: (sessionId: string | number, substitutionId: string | number) =>
      fetch<Substitution>(`/sessions/${sessionId}/substitutions/${substitutionId}`, {
        method: 'DELETE',
      }),
  };
}
