import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { registerButton, registerSelect } from "../../interactions/registry";
import { db } from "../../../core/store/db";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

registerButton("staff:payments", async (i) => {
  ensureStaff(i);

  const pending = db.listRegs().filter(r => r.status === "PAGAMENTO_ENVIADO");
  const embed = new EmbedBuilder()
    .setTitle("Pagamentos pendentes")
    .setDescription(pending.length ? "Selecione uma inscrição." : "Nenhum comprovante pendente.");

  if (!pending.length) return i.reply({ embeds: [embed], ephemeral: true });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("staff:select_payment")
    .setPlaceholder("Selecionar inscrição…")
    .addOptions(
      pending.slice(0, 25).map(r => ({
        label: r.teamName ? `${r.teamName} — ${r.nick}` : r.nick,
        description: `TXID: ${r.receipt?.txid ?? "-"}`,
        value: r.id
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
  return i.reply({ embeds: [embed], components: [row], ephemeral: true });
});

registerSelect("staff:select_payment", async (i) => {
  ensureStaff(i);

  const regId = i.values[0];
  const reg = db.getRegById(regId);
  if (!reg) return i.reply({ content: "Inscrição não encontrada.", ephemeral: true });

  const embed = new EmbedBuilder()
    .setTitle("Revisar pagamento")
    .addFields(
      { name: "Nick", value: reg.nick, inline: true },
      { name: "Time", value: reg.teamName ?? "-", inline: true },
      { name: "Status", value: reg.status, inline: true },
      { name: "Valor", value: reg.receipt ? `R$ ${reg.receipt.amount.toFixed(2)}` : "-", inline: true },
      { name: "Horário", value: reg.receipt?.time ?? "-", inline: true },
      { name: "TXID", value: reg.receipt?.txid ?? "-", inline: false },
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`staff:confirm_payment:${reg.id}`).setLabel("✅ Confirmar").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`staff:reject_payment:${reg.id}`).setLabel("❌ Rejeitar").setStyle(ButtonStyle.Danger),
  );

  return i.reply({ embeds: [embed], components: [row], ephemeral: true });
});
