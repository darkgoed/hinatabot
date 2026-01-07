import { Match } from "../types/match";

function pairwise<T>(arr: T[]) {
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < arr.length; i += 2) {
    pairs.push([arr[i], arr[i + 1]]);
  }
  return pairs;
}

export function getNextRoundNumber(matches: Match[]) {
  const maxRound = matches.reduce((acc, m) => Math.max(acc, m.round), 0);
  return maxRound + 1;
}

export function canAdvance(matches: Match[], round: number) {
  const roundMatches = matches.filter(m => m.round === round);
  if (!roundMatches.length) return false;

  const blocked = roundMatches.filter(m =>
    m.status === "PENDENTE" ||
    m.status === "AGUARDANDO_CONFIRMACAO" ||
    m.status === "DISPUTA"
  );

  return blocked.length === 0;
}


export function buildNextRoundMatches(allMatches: Match[], roundToBuild: number): Match[] {
  const prevRound = roundToBuild - 1;
  const prevMatches = allMatches
    .filter(m => m.round === prevRound)
    .sort((a, b) => a.position - b.position);

  if (!prevMatches.length) throw new Error("Rodada anterior não existe.");

  // todos devem estar finalizados
  const notDone = prevMatches.find(m => m.status !== "FINALIZADO");
  if (notDone) throw new Error("Ainda existe partida pendente na rodada anterior.");

  // winners em ordem
  const winners = prevMatches.map(m => {
    if (m.winnerId) return m.winnerId;
    // fallback (caso você esqueça de setar winnerId)
    const a = m.scoreA ?? 0;
    const b = m.scoreB ?? 0;
    return a >= b ? m.playerAId : m.playerBId;
  });

  // se sobrou 1 vencedor, acabou o torneio
  if (winners.length === 1) return [];

  // cria pares
  const pairs = pairwise(winners);

  const now = Date.now();
  const next: Match[] = pairs.map((p, idx) => {
    const [A, B] = p;

    // safety: se B não existir (número ímpar), vira BYE
    const bId = (B ?? "BYE") as string;

    const isBye = A === "BYE" || bId === "BYE";

    const m: Match = {
      id: `m-${now}-${roundToBuild}-${idx + 1}`,
      round: roundToBuild,
      position: idx + 1,
      playerAId: A,
      playerBId: bId,
      status: isBye ? "FINALIZADO" : "PENDENTE",
      createdAt: now,
      updatedAt: now,
    };

    // se for BYE, já marca winnerId
    if (isBye) {
      m.winnerId = A === "BYE" ? bId : A;
      m.scoreA = A === "BYE" ? 0 : 2;
      m.scoreB = bId === "BYE" ? 0 : 2; // (não usado, mas ok)
    }

    return m;
  });

  return next;
}
