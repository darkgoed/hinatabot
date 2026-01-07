import { registerButton } from "../../interactions/registry";
import { db } from "../../../core/store/db";
import { buildPainelPayload } from "../../panels/painelTorneio";

const STAFF_ROLE = process.env.STAFF_ROLE_NAME || "Torneio Staff";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

registerButton("staff:open_regs", async (i) => {
  ensureStaff(i);
  const t = db.getTournament();
  if (!t) return i.reply({ content: "Nenhum torneio.", ephemeral: true });
  t.status = "INSCRICOES_ABERTAS";
  db.setTournament(t);
  return i.update(buildPainelPayload(i, STAFF_ROLE));
});

registerButton("staff:close_regs", async (i) => {
  ensureStaff(i);
  const t = db.getTournament();
  if (!t) return i.reply({ content: "Nenhum torneio.", ephemeral: true });
  t.status = "INSCRICOES_FECHADAS";
  db.setTournament(t);
  return i.update(buildPainelPayload(i, STAFF_ROLE));
});
