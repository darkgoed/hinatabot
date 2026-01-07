import { ChannelType, Client, EmbedBuilder, TextChannel } from "discord.js";
import { Registration } from "../../core/types/tournament";

export async function postPagamentoLog(client: Client, reg: Registration) {
  const channelId = process.env.TORNEIO_PAGAMENTOS_CHANNEL_ID;
  if (!channelId) return;

  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (!ch || ch.type !== ChannelType.GuildText) return;

  const channel = ch as TextChannel;

  const embed = new EmbedBuilder()
    .setTitle("Comprovante enviado")
    .addFields(
      { name: "Nick", value: reg.nick, inline: true },
      { name: "UserId", value: reg.userId, inline: true },
      { name: "Time", value: reg.teamName ?? "-", inline: false },
      { name: "Valor", value: reg.receipt ? `R$ ${reg.receipt.amount.toFixed(2)}` : "-", inline: true },
      { name: "Horário", value: reg.receipt?.time ?? "-", inline: true },
      { name: "TXID", value: reg.receipt?.txid ?? "-", inline: false },
      { name: "Status", value: reg.status, inline: true }
    );

  await channel.send({ embeds: [embed] });
}
