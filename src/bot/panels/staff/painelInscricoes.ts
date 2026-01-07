import { registerButton } from "../../interactions/registry";
import { db } from "../../../core/store/db";
import { buildPainelPayload } from "../../panels/painelTorneio";
import { upsertInscricoesMessage } from "../../publishers/inscricoesMessage";

const STAFF_ROLE_NAME = process.env.STAFF_ROLE_NAME || "Torneio Staff";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

registerButton("staff:open_regs", async (i) => {
  ensureStaff(i);

  const t = db.getTournament();
  if (!t) return i.reply({ content: "Nenhum torneio.", ephemeral: true });

  db.updateTournament({ status: "INSCRICOES_ABERTAS" });

  // atualiza canal público
  await upsertInscricoesMessage(i.client);

  return i.update(buildPainelPayload(i, STAFF_ROLE_NAME));
});

registerButton("staff:close_regs", async (i) => {
  ensureStaff(i);

  const t = db.getTournament();
  if (!t) return i.reply({ content: "Nenhum torneio.", ephemeral: true });

  db.updateTournament({ status: "INSCRICOES_FECHADAS" });

  await upsertInscricoesMessage(i.client);

  return i.update(buildPainelPayload(i, STAFF_ROLE_NAME));
});
