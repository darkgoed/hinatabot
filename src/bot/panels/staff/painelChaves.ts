import { registerButton } from "../../interactions/registry";
import { db } from "../../../core/store/db";
import { matchStore } from "../../../core/store/matches";
import { generateFullSingleElim } from "../../../core/bracket/generateFullSingleElim";
import { upsertChavesMessage } from "../../publishers/chavesMessage";
import { createThreadsForMatches } from "../../publishers/matchThreads";
import { MessageFlags } from "discord.js";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

function parseTeamSize(format: string): number {
  // "1v1" -> 1, "2v2" -> 2, etc.
  const n = Number(String(format).split("v")[0]);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

registerButton("staff:generate_bracket", async (i) => {
  ensureStaff(i);

  // ✅ ACK imediato (evita 10062)
  await i.deferReply({ flags: MessageFlags.Ephemeral });

  const t = db.getTournament();
  if (!t) return i.editReply("Nenhum torneio.");

  const botId = i.client.user?.id;

  // só CONFIRMADOS + filtra o bot (pra nunca aparecer @bot vs alguém)
  const regs = db
    .listRegs()
    .filter(r => r.status === "CONFIRMADO")
    .filter(r => r.userId !== botId);

  if (regs.length < 2) return i.editReply("Precisa de pelo menos 2 confirmados.");

  const teamSize = parseTeamSize(String(t.format));

  // Validação rápida do modo TIME pra 2v2/3v3...
  if (t.mode === "TIME" && teamSize > 1) {
    const bad = regs.find(r => (r.members?.length ?? 0) < teamSize);
    if (bad) {
      return i.editReply(
        `❌ Time do <@${bad.userId}> tem **${bad.members?.length ?? 0}** membros, mas o torneio é **${t.format}**.`
      );
    }
  }

  try {
    matchStore.reset();

    // ✅ agora o gerador entende times e formato
    const matches = generateFullSingleElim(regs, {
      format: String(t.format),
      mode: String(t.mode),
    });

    for (const m of matches) matchStore.upsert(m);

    await upsertChavesMessage(i.client, matches);

    // cria threads apenas pro que já está PENDENTE (R1 ou liberadas)
    await createThreadsForMatches(i.client, matches);

    // salva threadId no store (createThreadsForMatches seta m.threadId)
    for (const m of matches) matchStore.upsert(m);

    return i.editReply("🌱 Chaves geradas/atualizadas e threads prontas!");
  } catch (err) {
    console.error("Erro em staff:generate_bracket:", err);
    return i.editReply("❌ Erro ao gerar chaves/threads. Veja o console.");
  }
});
