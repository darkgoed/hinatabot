import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import { registerButtonPrefix, registerModalPrefix } from "../../interactions/registry";
import { matchStore } from "../../../core/store/matches";

function isCaptain(i: any, match: any) {
  return i.user.id === match.playerAId || i.user.id === match.playerBId;
}

registerButtonPrefix("match:report:", async (i) => {
  // customId: match:report:<matchId>:A|B
  const parts = i.customId.split(":");
  const matchId = parts[2];
  const winnerSide = parts[3]; // "A" or "B"

  const match = matchStore.get(matchId);
  if (!match) return i.reply({ content: "Match não encontrado.", ephemeral: true });
  if (!isCaptain(i, match)) return i.reply({ content: "Apenas capitães podem reportar.", ephemeral: true });

  const modal = new ModalBuilder()
    .setCustomId(`modal:report_score:${matchId}:${winnerSide}`)
    .setTitle("Reportar placar (MD3)");

  const score = new TextInputBuilder()
    .setCustomId("score")
    .setLabel("Placar (ex: 2-0 ou 2-1)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(score));
  return i.showModal(modal);
});

// PREFIXO (porque o customId tem matchId e A/B)
registerModalPrefix("modal:report_score:", async (i) => {
  // customId: modal:report_score:<matchId>:A|B
  const parts = i.customId.split(":");
  const matchId = parts[2];
  const winnerSide = parts[3];

  const match = matchStore.get(matchId);
  if (!match) return i.reply({ content: "Match não encontrado.", ephemeral: true });
  if (!isCaptain(i, match)) return i.reply({ content: "Apenas capitães.", ephemeral: true });

  const scoreText = i.fields.getTextInputValue("score").trim();
  const [aStr, bStr] = scoreText.split("-").map((s: string) => s.trim());
  const a = Number(aStr);
  const b = Number(bStr);

  // valida: 2-0 ou 2-1 (independente de A/B vencedor)
  const valid =
    (a === 2 && (b === 0 || b === 1)) ||
    (b === 2 && (a === 0 || a === 1));

  if (!valid) {
    return i.reply({ content: "Placar inválido. Use 2-0 ou 2-1.", ephemeral: true });
  }

  // regra: winnerSide define quem recebeu o 2
  const loserGames = (a === 2) ? b : a; // 0 ou 1
  if (winnerSide === "A") {
    match.scoreA = 2;
    match.scoreB = loserGames;
  } else {
    match.scoreB = 2;
    match.scoreA = loserGames;
  }

  match.reportedBy = i.user.id;
  match.status = "AGUARDANDO_CONFIRMACAO";
  match.updatedAt = Date.now();
  matchStore.upsert(match);

  const opponentId = i.user.id === match.playerAId ? match.playerBId : match.playerAId;

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`match:confirm:${match.id}`).setLabel("✅ Confirmar").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`match:contest:${match.id}`).setLabel("❌ Contestar").setStyle(ButtonStyle.Danger),
  );

  return i.reply({
    content: `📣 Report enviado: **${match.scoreA}-${match.scoreB}**. Aguardando confirmação de <@${opponentId}>.`,
    components: [row]
  });
});
