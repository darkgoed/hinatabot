import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { registerButton, registerModal } from "../../interactions/registry";
import { db } from "../../../core/store/db";
import { PaymentReceipt } from "../../../core/types/tournament";
import { postPagamentoLog } from "../../publishers/pagamentosLog";

registerButton("player:send_receipt", async (i) => {
  const t = db.getTournament();
  if (!t) return i.reply({ content: "Nenhum torneio no momento.", ephemeral: true });
  if (t.status === "FINALIZADO") return i.reply({ content: "Torneio finalizado.", ephemeral: true });

  const reg = db.getRegByUser(i.user.id);
  if (!reg) return i.reply({ content: "Você precisa se inscrever primeiro.", ephemeral: true });

  // Só deixa enviar (ou reenviar) nessas situações
  const canSend = reg.status === "PENDENTE_PAGAMENTO" || reg.status === "REJEITADO" || reg.status === "PAGAMENTO_ENVIADO";
  if (!canSend) {
    return i.reply({ content: `Seu status atual é **${reg.status}**. Não precisa enviar comprovante agora.`, ephemeral: true });
  }

  const modal = new ModalBuilder()
    .setCustomId("modal:send_receipt")
    .setTitle("Enviar comprovante");

  const amount = new TextInputBuilder()
    .setCustomId("amount")
    .setLabel("Valor (ex: 9.00)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const time = new TextInputBuilder()
    .setCustomId("time")
    .setLabel("Horário (ex: 17:25)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const txid = new TextInputBuilder()
    .setCustomId("txid")
    .setLabel("TXID / Identificador")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(amount),
    new ActionRowBuilder<TextInputBuilder>().addComponents(time),
    new ActionRowBuilder<TextInputBuilder>().addComponents(txid)
  );

  return i.showModal(modal);
});

registerModal("modal:send_receipt", async (i) => {
  const t = db.getTournament();
  if (!t) return i.reply({ content: "Nenhum torneio no momento.", ephemeral: true });
  if (t.status === "FINALIZADO") return i.reply({ content: "Torneio finalizado.", ephemeral: true });

  const reg = db.getRegByUser(i.user.id);
  if (!reg) return i.reply({ content: "Você precisa se inscrever primeiro.", ephemeral: true });

  const amount = Number(i.fields.getTextInputValue("amount").replace(",", "."));
  const time = i.fields.getTextInputValue("time").trim();
  const txid = i.fields.getTextInputValue("txid").trim();

  const receipt: PaymentReceipt = {
    amount: Number.isFinite(amount) ? amount : 0,
    time,
    txid,
    sentAt: Date.now(),
  };

  reg.receipt = receipt;
  reg.status = "PAGAMENTO_ENVIADO";
  reg.updatedAt = Date.now();
  db.upsertReg(reg);

  await postPagamentoLog(i.client, reg);

  return i.reply({
    content:
      "📩 Comprovante registrado!\n" +
      "Agora finalize a confirmação pelo **ticket** (seu outro bot).\n" +
      "Quando a staff confirmar no ticket, ela marca como **CONFIRMADO** no painel.",
    ephemeral: true
  });
});
