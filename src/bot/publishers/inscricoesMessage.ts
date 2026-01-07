import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { db } from "../../core/store/db";

function buildInscricoesPublicMessage() {
  const t = db.getTournament();
  const embed = new EmbedBuilder()
    .setTitle("Inscrições — Torneio VBL")
    .setDescription(t?.status === "INSCRICOES_ABERTAS"
      ? "✅ Inscrições **ABERTAS**!\nClique em **📝 Inscrever-se**."
      : "🔒 Inscrições **FECHADAS**."

    );

  if (t) {
    embed.addFields(
      { name: "Status", value: t.status, inline: true },
      { name: "Modo", value: t.mode, inline: true },
      { name: "Formato", value: t.format, inline: true },
      { name: "Valor Pix", value: `R$ ${t.pixValue.toFixed(2)}`, inline: true },
    );
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("player:signup")
      .setLabel("📝 Inscrever-se")
      .setStyle(ButtonStyle.Success)
      .setDisabled(t?.status !== "INSCRICOES_ABERTAS"),
    new ButtonBuilder()
      .setCustomId("player:list")
      .setLabel("👥 Ver inscritos")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("player:send_receipt")
      .setLabel("💸 Enviar comprovante")
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

export async function upsertInscricoesMessage(client: Client) {
  const channelId = process.env.TORNEIO_INSCRICOES_CHANNEL_ID;
  if (!channelId) return;

  const t = db.getTournament();
  if (!t) return;

  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (!ch || ch.type !== ChannelType.GuildText) return;

  const channel = ch as TextChannel;

  const payload = buildInscricoesPublicMessage();

  // se já existe messageId, edita; se não, cria e salva
  if (t.inscricoesMessageId) {
    const msg = await channel.messages.fetch(t.inscricoesMessageId).catch(() => null);
    if (msg) {
      await msg.edit(payload);
      return;
    }
  }

  const msg = await channel.send(payload);
  db.updateTournament({ inscricoesMessageId: msg.id });
}
