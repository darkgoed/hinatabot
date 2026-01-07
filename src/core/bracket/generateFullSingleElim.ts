import { Registration } from "../types/tournament";
import { Match } from "../types/match";

function nextPow2(n: number) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function generateFullSingleElim(regsConfirmed: Registration[]): Match[] {
  const players = regsConfirmed.map(r => r.userId);
  const size = nextPow2(players.length);

  const padded = [...players];
  while (padded.length < size) padded.push("BYE");

  const now = Date.now();
  const matches: Match[] = [];

  // R1
  const r1Count = size / 2;
  for (let i = 0; i < r1Count; i++) {
    const A = padded[i * 2];
    const B = padded[i * 2 + 1];
    const isBye = A === "BYE" || B === "BYE";

    const m: Match = {
      id: `m-${now}-1-${i + 1}`,
      round: 1,
      position: i + 1,
      playerAId: A,
      playerBId: B,
      status: isBye ? "FINALIZADO" : "PENDENTE",
      createdAt: now,
      updatedAt: now,
    };

    if (isBye) {
      m.winnerId = A === "BYE" ? B : A;
      m.scoreA = A === "BYE" ? 0 : 2;
      m.scoreB = B === "BYE" ? 0 : 2;
    }

    matches.push(m);
  }

  // Rodadas seguintes (só esqueleto)
  let prevRoundCount = r1Count;
  let round = 2;

  while (prevRoundCount >= 2) {
    const roundCount = prevRoundCount / 2;

    for (let pos = 1; pos <= roundCount; pos++) {
      // pais: na rodada anterior, os matches 2*pos-1 e 2*pos alimentam este
      const sourceA = matches.find(m => m.round === round - 1 && m.position === (pos * 2 - 1))!;
      const sourceB = matches.find(m => m.round === round - 1 && m.position === (pos * 2))!;

      matches.push({
        id: `m-${now}-${round}-${pos}`,
        round,
        position: pos,
        playerAId: "TBD",
        playerBId: "TBD",
        sourceMatchAId: sourceA.id,
        sourceMatchBId: sourceB.id,
        status: "AGUARDANDO_JOGADORES",
        createdAt: now,
        updatedAt: now,
      });
    }

    prevRoundCount = roundCount;
    round++;
  }

  return matches;
}
