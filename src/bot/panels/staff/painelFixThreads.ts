import { registerButton } from "../../interactions/registry";
import { matchStore } from "../../../core/store/matches";
import { createThreadsForMatches } from "../../publishers/matchThreads";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

registerButton("staff:fix_threads", async (i) => {
  ensureStaff(i);

  const pendingNoThread = matchStore
    .list()
    .filter(m => m.status === "PENDENTE" && !m.threadId);

  if (!pendingNoThread.length) {
    return i.reply({ content: "✅ Nenhuma thread faltando.", ephemeral: true });
  }

  await createThreadsForMatches(i.client, pendingNoThread);

  // salva threadId no store
  for (const m of pendingNoThread) matchStore.upsert(m);

  return i.reply({
    content: `🧵 Threads criadas para **${pendingNoThread.length}** partidas pendentes.`,
    ephemeral: true
  });
});
