import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { registerButton, registerModal } from "../../interactions/registry";
import { db } from "../../../core/store/db";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

registerButton("staff:mark_paid", async (i) => {
  ensureStaff(i);

  const modal = new ModalBuilder()
    .setCustomId("modal:mark_paid")
    .setTitle("Marcar pagamento como confirmado");

  const userId = new TextInputBuilder()
    .setCustomId("userId")
    .setLabel("User ID do Discord (recomendado)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const nick = new TextInputBuilder()
    .setCustomId("nick")
    .setLabel("Ou Nick VBL (se não tiver User ID)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(userId),
    new ActionRowBuilder<TextInputBuilder>().addComponents(nick)
  );

  return i.showModal(modal);
});

registerModal("modal:mark_paid", async (i) => {
  ensureStaff(i);

  const userId = i.fields.getTextInputValue("userId").trim();
  const nick = i.fields.getTextInputValue("nick").trim().toLowerCase();

  const regs = db.listRegs();
  const reg =
    (userId ? regs.find(r => r.userId === userId) : undefined) ||
    (nick ? regs.find(r => r.nick.toLowerCase() === nick) : undefined);

  if (!reg) return i.reply({ content: "Não encontrei inscrição com esse User ID/Nick.", ephemeral: true });

  reg.status = "CONFIRMADO";
  reg.updatedAt = Date.now();
  db.upsertReg(reg);

  return i.reply({ content: `✅ Marcado como CONFIRMADO: **${reg.nick}**`, ephemeral: true });
});
