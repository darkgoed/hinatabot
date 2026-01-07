export type MatchStatus =
  | "AGUARDANDO_JOGADORES"
  | "PENDENTE"
  | "AGUARDANDO_CONFIRMACAO"
  | "DISPUTA"
  | "FINALIZADO";


export interface Match {
  id: string;
  round: number;
  position: number;

  playerAId: string; // pode ser "TBD"
  playerBId: string; // pode ser "TBD"

  // NOVO: ligações do bracket
  sourceMatchAId?: string; // match que alimenta o lado A
  sourceMatchBId?: string; // match que alimenta o lado B

  status: MatchStatus; // adicione "AGUARDANDO_JOGADORES"
  winnerId?: string;

  scoreA?: number;
  scoreB?: number;

  threadId?: string;
  createdAt: number;
  updatedAt: number;

  reportedBy?: string;      // userId de quem reportou (capitão) ou decidiu (staff)
  reportReason?: string;    // opcional: motivo (WO/disputa)
}

