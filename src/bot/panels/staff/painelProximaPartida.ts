import { registerButton } from "../../interactions/registry";
import { matchStore } from "../../../core/store/matches";
import { upsertChavesMessage } from "../../publishers/chavesMessage";
import { createThreadsForMatches } from "../../publishers/matchThreads";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

registerButton("staff:next_match", async (i) => {
  ensureStaff(i);

  const all = matchStore.list().sort((a, b) => a.round - b.round || a.position - b.position);

  const next = all.find(m => m.status === "AGUARDANDO_JOGADORES");
  if (!next) {
    return i.reply({ content: "Não há próximas partidas aguardando. (Talvez já esteja tudo liberado.)", ephemeral: true });
  }

  const aSrc = next.sourceMatchAId ? matchStore.get(next.sourceMatchAId) : null;
  const bSrc = next.sourceMatchBId ? matchStore.get(next.sourceMatchBId) : null;

  if (!aSrc || !bSrc) {
    return i.reply({ content: "Essa partida não tem fontes (source) configuradas.", ephemeral: true });
  }

  if (aSrc.status !== "FINALIZADO" || bSrc.status !== "FINALIZADO" || !aSrc.winnerId || !bSrc.winnerId) {
    return i.reply({
      content: `Ainda não dá pra liberar **R${next.round}-M${next.position}**.\nPrecisa finalizar as duas partidas anteriores.`,
      ephemeral: true
    });
  }

  next.playerAId = aSrc.winnerId;
  next.playerBId = bSrc.winnerId;
  next.status = "PENDENTE";
  next.updatedAt = Date.now();
  matchStore.upsert(next);

  await createThreadsForMatches(i.client, [next]);
  matchStore.upsert(next);
  
  await upsertChavesMessage(i.client, matchStore.list());
  

  return i.reply({
    content: `➡️ Liberada a próxima partida: **R${next.round}-M${next.position}** — <@${next.playerAId}> vs <@${next.playerBId}>`,
    ephemeral: true
  });
});
