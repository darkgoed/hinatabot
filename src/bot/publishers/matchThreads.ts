import { ChannelType, Client, TextChannel } from "discord.js";
import { Match } from "../../core/types/match";
import { postMatchEmbed } from "../panels/matches/threadPost";

export async function createThreadsForMatches(client: Client, matches: Match[]) {
  const channelId = process.env.TORNEIO_PARTIDAS_CHANNEL_ID;
  if (!channelId) return;

  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (!ch || ch.type !== ChannelType.GuildText) return;

  const channel = ch as TextChannel;

  for (const m of matches.filter(x => x.round === 1 && x.status === "PENDENTE")) {
    // evita recriar se já tem thread
    if (m.threadId) continue;

    const thread = await channel.threads.create({
      name: `R${m.round}-M${m.position}`,
      autoArchiveDuration: 1440
    });

    m.threadId = thread.id;

    await thread.members.add(m.playerAId).catch(() => {});
    await thread.members.add(m.playerBId).catch(() => {});

    await postMatchEmbed(thread, m);
  }
}
