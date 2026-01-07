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

registerButton("staff:resolve_dispute", async (i) => {
  ensureStaff(i);

  const modal = new ModalBuilder()
    .setCustomId("modal:resolve_dispute")
    .setTitle("Resolver disputa");

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

  const score = new TextInputBuilder()
    .setCustomId("score")
    .setLabel("Placar (2-0 ou 2-1)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const reason = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Motivo (resumo da decisão)")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(matchId),
    new ActionRowBuilder<TextInputBuilder>().addComponents(winner),
    new ActionRowBuilder<TextInputBuilder>().addComponents(score),
    new ActionRowBuilder<TextInputBuilder>().addComponents(reason),
  );

  return i.showModal(modal);
});

registerModal("modal:resolve_dispute", async (i) => {
  ensureStaff(i);

  const id = i.fields.getTextInputValue("matchId").trim();
  const winnerSideRaw = i.fields.getTextInputValue("winner").trim().toUpperCase();
  const scoreText = i.fields.getTextInputValue("score").trim();
  const reason = i.fields.getTextInputValue("reason").trim();

  const match = matchStore.get(id);
  if (!match) return i.reply({ content: "Match não encontrado.", ephemeral: true });

  const winnerSide = (winnerSideRaw === "A" || winnerSideRaw === "B") ? winnerSideRaw : null;
  if (!winnerSide) return i.reply({ content: "Vencedor inválido. Use A ou B.", ephemeral: true });

  const [aStr, bStr] = scoreText.split("-").map((s: string) => s.trim());
  const a = Number(aStr);
  const b = Number(bStr);

  const valid =
    (a === 2 && (b === 0 || b === 1)) ||
    (b === 2 && (a === 0 || a === 1));

  if (!valid) return i.reply({ content: "Placar inválido. Use 2-0 ou 2-1.", ephemeral: true });

  const loserGames = (a === 2) ? b : a; // 0 ou 1
  if (winnerSide === "A") {
    match.scoreA = 2;
    match.scoreB = loserGames;
    match.winnerId = match.playerAId;
  } else {
    match.scoreB = 2;
    match.scoreA = loserGames;
    match.winnerId = match.playerBId;
  }

  match.status = "FINALIZADO";
  match.reportedBy = i.user.id; // staff decision
  match.updatedAt = Date.now();
  matchStore.upsert(match);

  // atualiza o post das chaves
  await upsertChavesMessage(i.client, matchStore.list());

  // opcional: avisar na thread (se tiver)
  if (match.threadId) {
    const thread = await i.client.channels.fetch(match.threadId).catch(() => null);
    if (thread && thread.isThread()) {
      await thread.send(`⚖️ **Disputa resolvida pela staff**\n✅ Vencedor: <@${match.winnerId}>\n📌 Placar: ${match.scoreA}-${match.scoreB}\n📝 Motivo: ${reason}`);
    }
  }

  return i.reply({ content: `✅ Disputa resolvida! Winner: <@${match.winnerId}>`, ephemeral: true });
});
