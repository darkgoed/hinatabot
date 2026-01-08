import { ChannelType, Client, TextChannel } from "discord.js";
import { Match } from "../../core/types/match";
import { postMatchEmbed } from "../panels/matches/threadPost";

function canAddMember(id: string) {
  return !!id && id !== "TBD" && id !== "BYE";
}

export async function createThreadsForMatches(client: Client, matches: Match[]) {
  const channelId = process.env.TORNEIO_PARTIDAS_CHANNEL_ID;
  if (!channelId) throw new Error("TORNEIO_PARTIDAS_CHANNEL_ID não configurado.");

  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (!ch || ch.type !== ChannelType.GuildText) throw new Error("Canal de partidas inválido.");

  const channel = ch as TextChannel;

  let created = 0;

  for (const m of matches) {
    try {
      if (m.status !== "PENDENTE") continue;
      if (m.threadId) continue;

      const thread = await channel.threads.create({
        name: `R${m.round}-M${m.position}`,
        autoArchiveDuration: 1440,
      });

      m.threadId = thread.id;
      created++;

      if (canAddMember(m.playerAId)) {
        await thread.members.add(m.playerAId).catch(() => {});
      }
      if (canAddMember(m.playerBId)) {
        await thread.members.add(m.playerBId).catch(() => {});
      }

      await postMatchEmbed(thread, m);
    } catch (err) {
      console.error(`❌ Falha criando thread para R${m.round}-M${m.position} (${m.id}):`, err);
      // não interrompe outras threads
      continue;
    }
  }

  console.log(`🧵 Threads criadas: ${created}/${matches.filter(x => x.status === "PENDENTE" && !x.threadId).length}`);
}
