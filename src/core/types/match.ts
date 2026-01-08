export type MatchStatus =
  | "AGUARDANDO_JOGADORES"
  | "PENDENTE"
  | "AGUARDANDO_CONFIRMACAO"
  | "DISPUTA"
  | "FINALIZADO";


export interface MatchTeamInfo {
  name?: string;        // nome do time (se tiver)
  members?: string[];   // nicks (VBL) do time
}

export interface Match {
  id: string;
  round: number;
  position: number;

  // capitães (usados pra permissões e menção)
  playerAId: string; // captain userId
  playerBId: string; // captain userId

  // ✅ NOVO: dados do time (pra exibir 2v2/3v3 etc)
  teamA?: MatchTeamInfo;
  teamB?: MatchTeamInfo;

  // restante...
  status: MatchStatus;
  winnerId?: string;
  scoreA?: number;
  scoreB?: number;
  reportedBy?: string;
  reportReason?: string;
  threadId?: string;
  createdAt: number;
  updatedAt: number;

  // se você já está usando bracket full:
  sourceMatchAId?: string;
  sourceMatchBId?: string;
}


