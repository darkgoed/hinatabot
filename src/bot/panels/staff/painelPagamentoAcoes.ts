import { registerButtonPrefix } from "../../interactions/registry";
import { db } from "../../../core/store/db";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

registerButtonPrefix("staff:confirm_payment:", async (i) => {
  ensureStaff(i);

  const id = i.customId.split(":").pop()!;
  const reg = db.getRegById(id);
  if (!reg) return i.reply({ content: "Inscrição não encontrada.", ephemeral: true });

  reg.status = "CONFIRMADO";
  reg.updatedAt = Date.now();
  db.upsertReg(reg);

  return i.reply({ content: `✅ Pagamento confirmado para **${reg.nick}**`, ephemeral: true });
});

registerButtonPrefix("staff:reject_payment:", async (i) => {
  ensureStaff(i);

  const id = i.customId.split(":").pop()!;
  const reg = db.getRegById(id);
  if (!reg) return i.reply({ content: "Inscrição não encontrada.", ephemeral: true });

  reg.status = "REJEITADO";
  reg.updatedAt = Date.now();
  db.upsertReg(reg);

  return i.reply({ content: `❌ Pagamento rejeitado para **${reg.nick}**`, ephemeral: true });
});
