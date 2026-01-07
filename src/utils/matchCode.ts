import { Match } from "../../core/types/match";

export function matchGlobalNumber(matches: Match[], m: Match) {
  const sorted = [...matches].sort((a, b) => a.round - b.round || a.position - b.position);
  const idx = sorted.findIndex(x => x.id === m.id);
  return idx >= 0 ? idx + 1 : (m.position ?? 1);
}

export function matchLabel(tournamentId: string, n: number) {
  // se o id for timestamp, pode encurtar
  const shortT = tournamentId.length > 6 ? tournamentId.slice(-4) : tournamentId;
  return `T${shortT}-M${n}`;
}
