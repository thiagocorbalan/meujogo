export type GoalSource = 'LIVE' | 'LATE';

export type MatchEventType =
  | 'MATCH_STARTED'
  | 'GOAL_SCORED'
  | 'MATCH_ENDED'
  | 'GOAL_UNDONE'
  | 'LATE_GOAL_ADDED'
  | 'LATE_GOAL_REMOVED'
  | 'PLAYER_SUBSTITUTED'
  | 'SUBSTITUTION_REVERTED';

export type SubstitutionType = 'TEMPORARIA' | 'PERMANENTE';

export type SubstitutionReason = 'LESAO' | 'CANSACO' | 'SEM_MOTIVO';

export type PlayerPosition = 'LINHA' | 'GOLEIRO';

export type PlayerStatus = 'ATIVO' | 'LESIONADO' | 'AUSENTE' | 'RESERVA';

export type SessionStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED';

export interface Player {
  id: number;
  name: string;
  position: PlayerPosition;
  status: PlayerStatus;
  elo: number;
  goals: number;
  games: number;
}

export interface Team {
  id: number;
  name: string;
  color: string;
  sessionId: number;
  players?: Player[];
}

export interface Goal {
  id: number;
  matchId: number;
  playerId: number | null;
  teamId: number;
  minute: number | null;
  source: GoalSource;
  createdAt: string;
  player?: Player | null;
  team?: Team;
}

export interface MatchEvent {
  id: number;
  matchId: number;
  type: MatchEventType;
  timestamp: string;
  payload: Record<string, unknown> | null;
  goalId: number | null;
}

export interface MatchPlayer {
  id: number;
  matchId: number;
  playerId: number;
  teamId: number;
  isStarter: boolean;
  enteredMinute: number | null;
  leftMinute: number | null;
  player?: Player;
}

export interface Match {
  id: number;
  sessionId: number;
  teamAId: number;
  teamBId: number;
  scoreA: number;
  scoreB: number;
  winnerId: number | null;
  isDraw: boolean;
  matchOrder: number;
  createdAt: string;
  updatedAt: string;
  teamA?: Team;
  teamB?: Team;
  winner?: Team | null;
  events?: MatchEvent[];
  goals?: Goal[];
  matchPlayers?: MatchPlayer[];
}

export interface Substitution {
  id: number;
  sessionId: number;
  matchId: number | null;
  teamId: number;
  sourceTeamId: number | null;
  playerOutId: number;
  playerInId: number;
  type: SubstitutionType;
  reason: SubstitutionReason;
  minute: number | null;
  isReverted: boolean;
  createdAt: string;
  revertedAt: string | null;
  team?: Team;
  sourceTeam?: Team | null;
  playerOut?: Player;
  playerIn?: Player;
}

export interface LateGoalRequest {
  teamId: number;
  reason?: string;
}

export interface Session {
  id: number;
  groupId: number;
  status: SessionStatus;
  date: string;
  totalMatches: number;
  durationMinutes: number;
  matchDurationMinutes: number;
  createdAt: string;
}

export interface LateGoalMatchOption {
  id: number;
  teamAId: number;
  teamAName: string;
  teamBId: number;
  teamBName: string;
  scoreA: number;
  scoreB: number;
}

export interface SessionReviewGoal {
  id: number;
  playerName: string | null;
  teamName: string;
  source: GoalSource;
  minute: number | null;
}

export interface SessionReviewMatch {
  id: number;
  matchOrder: number;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  goals: SessionReviewGoal[];
}

export interface CreateSubstitutionRequest {
  teamId: number;
  playerOutId: number;
  playerInId: number;
  type: SubstitutionType;
  reason: SubstitutionReason;
  matchId?: number | null;
  minute?: number | null;
}

export interface UndoGoalContext {
  matchId: number;
  goalId: number;
  playerName: string | null;
  teamName: string;
  minute: number | null;
}

export interface AvailablePoolPlayer {
  player: Player;
  origin: 'RESERVA' | 'OTHER_TEAM';
  sourceTeam?: Team;
}

export interface AvailablePoolGroup {
  label: string;
  origin: 'RESERVA' | 'OTHER_TEAM';
  sourceTeamId: number | null;
  players: Player[];
}
