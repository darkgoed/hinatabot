import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ThreadChannel } from "discord.js";
import { Match } from "../../../core/types/match";

function teamBlock(label: "A" | "B", captainId: string, team?: { name?: string; members?: string[] }) {
  const cap = captainId === "TBD" ? "TBD" : (captainId === "BYE" ? "BYE" : `<@${captainId}>`);
  const name = team?.name ? `**${team.name}**` : `**Time ${label}**`;
  const members = team?.members?.length ? `👥 ${team.members.join(", ")}` : "👥 (sem lista)";
  return `${name}\n🎖️ Capitão: ${cap}\n${members}`;
}

export async function postMatchEmbed(thread: ThreadChannel, match: Match) {
  const embed = new EmbedBuilder()
    .setTitle(`Partida R${match.round} - M${match.position}`)
    .setDescription(
      `${teamBlock("A", match.playerAId, match.teamA)}\n\n` +
      `**VS**\n\n` +
      `${teamBlock("B", match.playerBId, match.teamB)}\n\n` +
      `**MD3**: reporte o placar (2-0 / 2-1).`
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
