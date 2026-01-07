import { Match } from "../types/match";

let matches: Match[] = [];

export const matchStore = {
  reset() {
    matches = [];
  },
  list() {
    return matches;
  },
  get(id: string) {
    return matches.find(m => m.id === id);
  },
  upsert(m: Match) {
    const idx = matches.findIndex(x => x.id === m.id);
    if (idx >= 0) matches[idx] = m;
    else matches.push(m);
  }
};
