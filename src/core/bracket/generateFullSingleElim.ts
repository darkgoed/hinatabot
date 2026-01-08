import { Registration } from "../types/tournament";
import { Match } from "../types/match";

function nextPow2(n: number) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function parseTeamSize(format: string): number {
  const n = Number(String(format).split("v")[0]);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

type Entry = {
  captainId: string;
  nickCaptain: string;
  teamName?: string;
  members: string[]; // nicks VBL
};

type Options = {
  format?: string; // "2v2"
  mode?: string;   // "TIME" | "RANDOM"
};

export function generateFullSingleElim(regsConfirmed: Registration[], opts: Options = {}): Match[] {
  const teamSize = parseTeamSize(opts.format ?? "1v1");
  const mode = opts.mode ?? "RANDOM";

  // monta “entries” (times)
  const entries: Entry[] = regsConfirmed.map((r) => {
    // TIME: usa members do cadastro; RANDOM: normalmente só nick, a não ser que você já tenha montado times em r.members
    const baseMembers =
      mode === "TIME"
        ? (r.members && r.members.length ? r.members : [r.nick])
        : (r.members && r.members.length ? r.members : [r.nick]);

    // garante que o nick do capitão esteja na lista (pelo menos)
    const members = [...baseMembers];
    if (!members.includes(r.nick)) members.unshift(r.nick);

    // opcional: corta para o tamanho do formato (evita 10 nomes no 2v2)
    const trimmed = teamSize > 0 ? members.slice(0, teamSize) : members;

    return {
      captainId: r.userId,
      nickCaptain: r.nick,
      teamName: r.teamName,
      members: trimmed.length ? trimmed : [r.nick],
    };
  });

  const size = nextPow2(entries.length);
  const padded: (Entry | "BYE")[] = [...entries];
  while (padded.length < size) padded.push("BYE");

  const now = Date.now();
  const matches: Match[] = [];

  // R1
  const r1Count = size / 2;
  for (let i = 0; i < r1Count; i++) {
    const A = padded[i * 2];
    const B = padded[i * 2 + 1];

    const isBye = A === "BYE" || B === "BYE";

    const aCaptain = A === "BYE" ? "BYE" : A.captainId;
    const bCaptain = B === "BYE" ? "BYE" : B.captainId;

    const m: Match = {
      id: `m-${now}-1-${i + 1}`,
      round: 1,
      position: i + 1,

      playerAId: aCaptain,
      playerBId: bCaptain,

      teamA: A === "BYE" ? undefined : { name: A.teamName, members: A.members },
      teamB: B === "BYE" ? undefined : { name: B.teamName, members: B.members },

      status: isBye ? "FINALIZADO" : "PENDENTE",
      createdAt: now,
      updatedAt: now,
    };

    if (isBye) {
      const winnerCaptain = A === "BYE" ? bCaptain : aCaptain;
      m.winnerId = winnerCaptain;

      // placar padrão
      m.scoreA = A === "BYE" ? 0 : 2;
      m.scoreB = B === "BYE" ? 0 : 2;
    }

    matches.push(m);
  }

  // Rodadas seguintes (só esqueleto / TBD)
  let prevRoundCount = r1Count;
  let round = 2;

  while (prevRoundCount >= 2) {
    const roundCount = prevRoundCount / 2;

    for (let pos = 1; pos <= roundCount; pos++) {
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
