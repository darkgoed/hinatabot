import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ThreadChannel } from "discord.js";
import { Match } from "../../../core/types/match";

export async function postMatchEmbed(thread: ThreadChannel, match: Match) {
  const embed = new EmbedBuilder()
    .setTitle(`Partida R${match.round} - M${match.position}`)
    .setDescription(
      `Capitães:\nA: <@${match.playerAId}>\nB: <@${match.playerBId}>\n\n**MD3**: reporte o placar (2-0 / 2-1).`
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`match:report:${match.id}:A`)
      .setLabel("🏐 Vitória A")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`match:report:${match.id}:B`)
      .setLabel("🏐 Vitória B")
      .setStyle(ButtonStyle.Primary),
  );

  await thread.send({ embeds: [embed], components: [row] });
}
