import { ChannelType, Client, TextChannel } from "discord.js";
import { Match } from "../../core/types/match";
import { postMatchEmbed } from "../panels/matches/threadPost";

export async function createThreadsForMatches(client: Client, matches: Match[]) {
  const channelId = process.env.TORNEIO_PARTIDAS_CHANNEL_ID;
  if (!channelId) throw new Error("TORNEIO_PARTIDAS_CHANNEL_ID não configurado.");

  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (!ch || ch.type !== ChannelType.GuildText) throw new Error("Canal de partidas inválido.");

  const channel = ch as TextChannel;

  for (const m of matches) {
    // ✅ cria para qualquer rodada
    if (m.status !== "PENDENTE") continue;
    if (m.threadId) continue;

    const thread = await channel.threads.create({
      name: `R${m.round}-M${m.position}`,
      autoArchiveDuration: 1440,
    });

    // ✅ salva threadId no próprio objeto
    m.threadId = thread.id;

    // ⚠️ não deixa falhar a criação da thread por erro de add member
    await thread.members.add(m.playerAId).catch(() => {});
    await thread.members.add(m.playerBId).catch(() => {});

    await postMatchEmbed(thread, m);
  }
}
