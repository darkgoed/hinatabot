import { registerButton } from "../../interactions/registry";
import { db } from "../../../core/store/db";
import { matchStore } from "../../../core/store/matches";
import { upsertChavesMessage } from "../../publishers/chavesMessage";
import { upsertInscricoesMessage } from "../../publishers/inscricoesMessage";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

function getChampionId() {
  const all = matchStore.list().filter(m => m.status === "FINALIZADO" && !!m.winnerId);
  if (!all.length) return null;

  // pega a maior rodada e maior position só pra garantir
  all.sort((a, b) => (b.round - a.round) || (b.position - a.position));
  return all[0].winnerId ?? null;
}

registerButton("staff:finish_tournament", async (i) => {
  ensureStaff(i);

  const t = db.getTournament();
  if (!t) return i.reply({ content: "Nenhum torneio.", ephemeral: true });

  const championId = getChampionId();

  t.status = "FINALIZADO";
  db.setTournament(t);

  // Atualiza posts públicos
  await upsertChavesMessage(i.client, matchStore.list());
  await upsertInscricoesMessage(i.client);

  const msg = championId
    ? `🛑 Torneio finalizado!\n🏆 Campeão: <@${championId}>`
    : "🛑 Torneio finalizado! (campeão não encontrado)";

  return i.reply({ content: msg, ephemeral: false });
});
