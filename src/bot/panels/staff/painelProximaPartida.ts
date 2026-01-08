import { registerButton } from "../../interactions/registry";
import { matchStore } from "../../../core/store/matches";
import { upsertChavesMessage } from "../../publishers/chavesMessage";
import { createThreadsForMatches } from "../../publishers/matchThreads";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

function pickWinnerTeam(src: any) {
  // src.winnerId é o capitão vencedor (playerAId ou playerBId)
  if (!src?.winnerId) return undefined;
  if (src.winnerId === src.playerAId) return src.teamA;
  if (src.winnerId === src.playerBId) return src.teamB;
  return undefined;
}

function fmtTeamLine(side: "A" | "B", captainId: string, team: any) {
  const name = team?.name ? team.name : `Time ${side}`;
  return `**${name}** (cap: <@${captainId}>)`;
}

registerButton("staff:next_match", async (i) => {
  ensureStaff(i);

  const all = matchStore.list().sort((a, b) => a.round - b.round || a.position - b.position);

  const next = all.find(m => m.status === "AGUARDANDO_JOGADORES");
  if (!next) {
    return i.reply({
      content: "Não há próximas partidas aguardando. (Talvez já esteja tudo liberado.)",
      ephemeral: true
    });
  }

  const aSrc = next.sourceMatchAId ? matchStore.get(next.sourceMatchAId) : null;
  const bSrc = next.sourceMatchBId ? matchStore.get(next.sourceMatchBId) : null;

  if (!aSrc || !bSrc) {
    return i.reply({ content: "Essa partida não tem fontes (source) configuradas.", ephemeral: true });
  }

  const ready =
    aSrc.status === "FINALIZADO" &&
    bSrc.status === "FINALIZADO" &&
    !!aSrc.winnerId &&
    !!bSrc.winnerId;

  if (!ready) {
    const aInfo = `A fonte: R${aSrc.round}-M${aSrc.position} | status=${aSrc.status} | winner=${aSrc.winnerId ?? "—"}`;
    const bInfo = `B fonte: R${bSrc.round}-M${bSrc.position} | status=${bSrc.status} | winner=${bSrc.winnerId ?? "—"}`;

    return i.reply({
      content:
        `Ainda não dá pra liberar **R${next.round}-M${next.position}**.\n` +
        `Precisa finalizar as duas partidas anteriores.\n\n` +
        `• ${aInfo}\n` +
        `• ${bInfo}`,
      ephemeral: true
    });
  }

  // ✅ preenche capitães (usado pra permissões e menção)
  next.playerAId = aSrc.winnerId!;
  next.playerBId = bSrc.winnerId!;

  // ✅ herda roster/time do vencedor de cada source
  next.teamA = pickWinnerTeam(aSrc);
  next.teamB = pickWinnerTeam(bSrc);

  next.status = "PENDENTE";
  next.updatedAt = Date.now();
  matchStore.upsert(next);

  // cria thread e salva threadId no store (createThreadsForMatches seta next.threadId)
  await createThreadsForMatches(i.client, [next]);
  matchStore.upsert(next);

  await upsertChavesMessage(i.client, matchStore.list());

  const lineA = fmtTeamLine("A", next.playerAId, next.teamA);
  const lineB = fmtTeamLine("B", next.playerBId, next.teamB);

  return i.reply({
    content:
      `➡️ Liberada a próxima partida: **R${next.round}-M${next.position}**\n` +
      `${lineA} vs ${lineB}`,
    ephemeral: true
  });
});
