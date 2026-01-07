import { registerButton } from "../../interactions/registry";
import { db } from "../../../core/store/db";
import { matchStore } from "../../../core/store/matches";
import { generateSingleElim } from "../../../core/bracket/generateSingleElim";
import { upsertChavesMessage } from "../../publishers/chavesMessage";
import { createThreadsForMatches } from "../../publishers/matchThreads";
import { MessageFlags } from "discord.js";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

registerButton("staff:generate_bracket", async (i) => {
  ensureStaff(i);

  // ✅ ACK imediato (evita 10062)
  await i.deferReply({ flags: MessageFlags.Ephemeral });

  const t = db.getTournament();
  if (!t) return i.editReply("Nenhum torneio.");

  const regs = db.listRegs().filter(r => r.status === "CONFIRMADO");
  if (regs.length < 2) return i.editReply("Precisa de pelo menos 2 confirmados.");

  try {
    matchStore.reset();

    const matches = generateSingleElim(regs);
    for (const m of matches) matchStore.upsert(m);

    await upsertChavesMessage(i.client, matches);
    await createThreadsForMatches(i.client, matches);

    // salva threadId no store (createThreadsForMatches seta m.threadId)
    for (const m of matches) matchStore.upsert(m);

    return i.editReply("🌱 Chaves geradas/atualizadas e threads prontas!");
  } catch (err) {
    console.error("Erro em staff:generate_bracket:", err);
    return i.editReply("❌ Erro ao gerar chaves/threads. Veja o console.");
  }
});
