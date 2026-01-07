import { registerButton } from "../../interactions/registry";
import { matchStore } from "../../../core/store/matches";
import { buildNextRoundMatches, getNextRoundNumber } from "../../../core/bracket/advanceRound";
import { upsertChavesMessage } from "../../publishers/chavesMessage";
import { createThreadsForMatches } from "../../publishers/matchThreads";
import { MessageFlags } from "discord.js";
import { db } from "../../../core/store/db";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

registerButton("staff:advance_round", async (i) => {
  ensureStaff(i);

  // ✅ ACK imediato
  await i.deferReply({ flags: MessageFlags.Ephemeral });

  const matches = matchStore.list();
  if (!matches.length) {
    return i.editReply("Não há partidas. Gere as chaves primeiro.");
  }

  const nextRound = getNextRoundNumber(matches);
  const roundToBuild = nextRound;

  // se já existe essa rodada, não recria
  const exists = matches.some(m => m.round === roundToBuild);
  if (exists) return i.editReply(`Rodada ${roundToBuild} já existe.`);

  // precisa ter rodada anterior finalizada
  const prevRound = roundToBuild - 1;
  const prevMatches = matches.filter(m => m.round === prevRound);
  if (!prevMatches.length) return i.editReply("Não existe rodada anterior.");

  const notDone = prevMatches.find(m => m.status !== "FINALIZADO");
  if (notDone) {
    return i.editReply(`Ainda há partidas pendentes na Rodada ${prevRound}.`);
  }

  try {
    const created = buildNextRoundMatches(matches, roundToBuild);

    // se não criou nada = acabou (campeão é o vencedor da última partida do torneio)
    if (!created.length) {
      const lastFinal = matches
        .filter(m => m.status === "FINALIZADO" && m.winnerId)
        .sort((a, b) => (b.round - a.round) || (b.position - a.position))[0];

      const champion = lastFinal?.winnerId;

      // ✅ marca torneio como FINALIZADO (se você já corrigiu o db pra não resetar regs)
      const t = db.getTournament();
      if (t) {
        t.status = "FINALIZADO";
        db.setTournament(t);
      }

      // atualiza embed das chaves com campeão
      await upsertChavesMessage(i.client, matchStore.list());

      return i.editReply(champion
        ? `🏆 Torneio finalizado! Campeão: <@${champion}>`
        : "🏆 Torneio finalizado!"
      );
    }

    for (const m of created) matchStore.upsert(m);

    // criar threads apenas para PENDENTE (seu publisher já ignora threadId existente)
    await createThreadsForMatches(i.client, created);

    // atualiza chaves com tudo
    await upsertChavesMessage(i.client, matchStore.list());

    // persist threadId após publisher
    for (const m of created) matchStore.upsert(m);

    // ✅ se quiser: colocar torneio EM_ANDAMENTO assim que existir R2+
    const t = db.getTournament();
    if (t && t.status !== "FINALIZADO") {
      t.status = "EM_ANDAMENTO";
      db.setTournament(t);
    }

    return i.editReply(`➡️ Rodada ${roundToBuild} criada com sucesso!`);
  } catch (err) {
    console.error("Erro em staff:advance_round:", err);
    return i.editReply("❌ Erro ao avançar rodada. Veja o console.");
  }
});
