import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import { registerButton, registerModal } from "../../interactions/registry";
import { matchStore } from "../../../core/store/matches";
import { upsertChavesMessage } from "../../publishers/chavesMessage";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

registerButton("staff:apply_wo", async (i) => {
  ensureStaff(i);

  const modal = new ModalBuilder()
    .setCustomId("modal:apply_wo")
    .setTitle("Aplicar WO");

  const matchId = new TextInputBuilder()
    .setCustomId("matchId")
    .setLabel("Match ID (cole exatamente)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const winner = new TextInputBuilder()
    .setCustomId("winner")
    .setLabel("Vencedor (A ou B)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const reason = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Motivo do WO")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(matchId),
    new ActionRowBuilder<TextInputBuilder>().addComponents(winner),
    new ActionRowBuilder<TextInputBuilder>().addComponents(reason),
  );

  return i.showModal(modal);
});

registerModal("modal:apply_wo", async (i) => {
  ensureStaff(i);

  const id = i.fields.getTextInputValue("matchId").trim();
  const winnerSideRaw = i.fields.getTextInputValue("winner").trim().toUpperCase();
  const reason = i.fields.getTextInputValue("reason").trim();

  const match = matchStore.get(id);
  if (!match) return i.reply({ content: "Match não encontrado.", ephemeral: true });

  const winnerSide = (winnerSideRaw === "A" || winnerSideRaw === "B") ? winnerSideRaw : null;
  if (!winnerSide) return i.reply({ content: "Vencedor inválido. Use A ou B.", ephemeral: true });

  // WO = 2-0 fixo
  if (winnerSide === "A") {
    match.scoreA = 2;
    match.scoreB = 0;
    match.winnerId = match.playerAId;
  } else {
    match.scoreA = 0;
    match.scoreB = 2;
    match.winnerId = match.playerBId;
  }

  match.status = "FINALIZADO";
  match.reportedBy = i.user.id; // decisão staff
  match.updatedAt = Date.now();
  matchStore.upsert(match);

  // Atualiza chaves
  await upsertChavesMessage(i.client, matchStore.list());

  // Aviso na thread
  if (match.threadId) {
    const ch = await i.client.channels.fetch(match.threadId).catch(() => null);
    if (ch && ch.isThread()) {
      await ch.send(
        `🟥 **WO aplicado pela staff**\n✅ Vencedor: <@${match.winnerId}>\n🏐 Placar: ${match.scoreA}-${match.scoreB}\n📝 Motivo: ${reason}`
      );
    }
  }

  return i.reply({ content: `🟥 WO aplicado! Winner: <@${match.winnerId}>`, ephemeral: true });
});
