export function formatTeamSize(format: string): number {
    // "1v1" -> 1, "2v2" -> 2...
    const n = Number(String(format).split("v")[0]);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  