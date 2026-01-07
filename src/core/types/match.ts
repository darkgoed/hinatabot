export type MatchStatus = "PENDENTE" | "AGUARDANDO_CONFIRMACAO" | "DISPUTA" | "FINALIZADO";

export interface Match {
  id: string;
  round: number;        // 1 = primeira rodada
  position: number;     // ordem dentro da rodada

  playerAId: string;    // userId do capitão A
  playerBId: string;    // userId do capitão B

  scoreA?: number;      // MD3: vitórias (0-2)
  scoreB?: number;

  reportedBy?: string;  // userId
  status: MatchStatus;

  threadId?: string;
  createdAt: number;
  updatedAt: number;
  
  winnerId?: string; // userId do vencedor (ou "BYE" não precisa)
}
