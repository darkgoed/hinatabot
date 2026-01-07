import { ChannelType, Client, EmbedBuilder, TextChannel } from "discord.js";
import { Match } from "../../core/types/match";
import { db } from "../../core/store/db";

export async function upsertChavesMessage(client: Client, matches: Match[]) {
  const channelId = process.env.TORNEIO_CHAVES_CHANNEL_ID;
  if (!channelId) return;

  const t = db.getTournament();
  if (!t) return;


  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (!ch || ch.type !== ChannelType.GuildText) return;

  const channel = ch as TextChannel;

  const maxRound = matches.reduce((acc, m) => Math.max(acc, m.round), 0);

  const blocks: string[] = [];
  for (let r = 1; r <= maxRound; r++) {
    const roundMatches = matches
      .filter(m => m.round === r)
      .sort((a, b) => a.position - b.position)
      .map(m => {
        const A = m.playerAId === "BYE" ? "BYE" : `<@${m.playerAId}>`;
        const B = m.playerBId === "BYE" ? "BYE" : `<@${m.playerBId}>`;
        const w = m.winnerId ? ` ✅ <@${m.winnerId}>` : "";
        return `**R${r}-M${m.position}** — ${A} vs ${B}${w} (${m.status})`;
      });

    if (roundMatches.length) {
      blocks.push(`__**Rodada ${r}**__\n${roundMatches.join("\n")}`);
    }
  }

  const embed = new EmbedBuilder()
    .setTitle("🌱 Chaves — Single Elim")
    .setDescription((blocks.join("\n\n") || "Sem partidas.").slice(0, 3900));

  if (t.chavesMessageId) {
    const msg = await channel.messages.fetch(t.chavesMessageId).catch(() => null);
    if (msg) {
      await msg.edit({ embeds: [embed] });
      return;
    }
  }

  const msg = await channel.send({ embeds: [embed] });

  if (t?.status === "FINALIZADO") {
    const finalDone = matches
      .filter(m => m.status === "FINALIZADO" && m.winnerId)
      .sort((a, b) => (b.round - a.round) || (b.position - a.position))[0];

    if (finalDone?.winnerId) {
      embed.addFields({ name: "🏆 Campeão", value: `<@${finalDone.winnerId}>`, inline: false });
    }
  }

  t.chavesMessageId = msg.id;
  db.setTournament(t);
}
