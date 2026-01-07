import { Registration } from "../types/tournament";
import { Match } from "../types/match";

function nextPow2(n: number) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function generateSingleElim(regsConfirmed: Registration[]): Match[] {
  const players = regsConfirmed.map(r => r.userId);

  const size = nextPow2(players.length);
  const padded = [...players];
  while (padded.length < size) padded.push("BYE"); // bye

  const matches: Match[] = [];
  const round = 1;

  let pos = 1;
  for (let i = 0; i < padded.length; i += 2) {
    const a = padded[i];
    const b = padded[i + 1];

    // ignorar match BYE vs BYE (não deve acontecer)
    if (a === "BYE" && b === "BYE") continue;

    matches.push({
      id: `m-${Date.now()}-${round}-${pos}`,
      round,
      position: pos,
      playerAId: a,
      playerBId: b,
      status: a === "BYE" || b === "BYE" ? "FINALIZADO" : "PENDENTE",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    pos++;
  }

  return matches;
}
