import {
  ChannelType,
  Client,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { Match } from "../../core/types/match";
import { postMatchEmbed } from "../panels/matches/threadPost";

export async function postChaves(client: Client, matches: Match[]) {
  const channelId = process.env.TORNEIO_CHAVES_CHANNEL_ID;
  if (!channelId) return;

  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (!ch || ch.type !== ChannelType.GuildText) return;

  const channel = ch as TextChannel;

  const lines = matches
    .filter(m => m.round === 1)
    .map(m => {
      const A = m.playerAId === "BYE" ? "BYE" : `<@${m.playerAId}>`;
      const B = m.playerBId === "BYE" ? "BYE" : `<@${m.playerBId}>`;
      return `**Match ${m.position}** — ${A} vs ${B}`;
    });

  const embed = new EmbedBuilder()
    .setTitle("Chaves — Single Elim (R1)")
    .setDescription(lines.join("\n") || "Sem partidas.");

  await channel.send({ embeds: [embed] });
}

export async function createMatchThreads(client: Client, matches: Match[]) {
  const channelId = process.env.TORNEIO_PARTIDAS_CHANNEL_ID;
  if (!channelId) return;

  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (!ch || ch.type !== ChannelType.GuildText) return;

  const channel = ch as TextChannel;

  for (const m of matches.filter(x => x.round === 1 && x.status === "PENDENTE")) {
    // cria thread
    const thread = await channel.threads.create({
      name: `R${m.round}-M${m.position}`,
      autoArchiveDuration: 1440
    });

    // salva threadId no match
    m.threadId = thread.id;

    // adiciona os capitães na thread (pra eles verem fácil)
    await thread.members.add(m.playerAId).catch(() => {});
    await thread.members.add(m.playerBId).catch(() => {});

    // posta o embed + botões
    await postMatchEmbed(thread, m);
  }
}
