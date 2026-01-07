import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionReplyOptions,
} from "discord.js";
import { db } from "../../core/store/db";
import { getNextRoundNumber } from "../../core/bracket/advanceRound";
// Se você tiver matchStore, use. Se não tiver ainda, pode comentar esse import
import { matchStore } from "../../core/store/matches";

function prettyStatus(status: string) {
  const map: Record<string, string> = {
    DRAFT: "🧪 DRAFT",
    INSCRICOES_ABERTAS: "🔓 INSCRIÇÕES ABERTAS",
    INSCRICOES_FECHADAS: "🔒 INSCRIÇÕES FECHADAS",
    EM_ANDAMENTO: "⚔️ EM ANDAMENTO",
    FINALIZADO: "🏁 FINALIZADO",
  };
  return map[status] ?? status;
}

function prettyMode(mode: string) {
  const map: Record<string, string> = {
    TIME: "👥 TIME",
    RANDOM: "🎲 RANDOM",
  };
  return map[mode] ?? mode;
}

function embedColorByStatus(status: string) {
  // cores simples (discord.js accepts number)
  switch (status) {
    case "INSCRICOES_ABERTAS": return 0x2ecc71; // verde
    case "INSCRICOES_FECHADAS": return 0xf1c40f; // amarelo
    case "FINALIZADO": return 0x95a5a6; // cinza
    case "EM_ANDAMENTO": return 0xe67e22; // laranja
    default: return 0x3498db; // azul
  }
}

export function buildPainelPayload(interaction: any, staffRoleName: string): InteractionReplyOptions {
  const isStaff = interaction.memberPermissions?.has?.("Administrator") || false; // simples por enquanto
  const t = db.getTournament();

  const embed = new EmbedBuilder()
    .setTitle(isStaff ? "🧠 Painel de Controle — Torneio" : "🎮 Painel do Torneio — VBL")
    .setFooter({ text: "Tudo acontece via /painel-torneio" });

  // =========================
  // SEM TORNEIO
  // =========================
  if (!t) {
    embed
      .setColor(0x95a5a6)
      .setDescription(
        isStaff
          ? "Nenhum torneio criado ainda.\n\nClique em **🆕 Criar torneio** para começar."
          : "Nenhum torneio disponível no momento."
      );

    if (!isStaff) return { embeds: [embed], ephemeral: true };

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("staff:create_tournament")
        .setLabel("🆕 Criar torneio")
        .setStyle(ButtonStyle.Success)
    );

    return { embeds: [embed], components: [row], ephemeral: true };
  }

  // =========================
  // MÉTRICAS / CONTADORES
  // =========================
  const regs = db.listRegs?.() ?? [];
  const totalRegs = regs.length;

  const confirmed = regs.filter((r: any) => r.status === "CONFIRMADO").length;
  const pendPay = regs.filter((r: any) => r.status === "PENDENTE_PAGAMENTO").length;
  const sentPay = regs.filter((r: any) => r.status === "PAGAMENTO_ENVIADO").length;
  const rejected = regs.filter((r: any) => r.status === "REJEITADO").length;

  const matches = matchStore?.list?.() ?? [];
  const totalMatches = matches.length;
  const pendingMatches = matches.filter((m: any) => m.status === "PENDENTE" || m.status === "AGUARDANDO_CONFIRMACAO").length;
  const disputes = matches.filter((m: any) => m.status === "DISPUTA").length;
  const doneMatches = matches.filter((m: any) => m.status === "FINALIZADO").length;

  const maxRound = matches.reduce((acc: number, m: any) => Math.max(acc, m.round ?? 0), 0);

  // rodada ativa = menor round que ainda tem partida não finalizada
  const activeRound = matches
    .filter((m: any) => m.status !== "FINALIZADO")
    .reduce((min: number, m: any) => Math.min(min, m.round ?? 1), Infinity);

  const currentRound =
    activeRound !== Infinity ? activeRound : (maxRound || (totalMatches ? 1 : 0));

  const pendingInCurrentRound = matches.filter((m: any) =>
    (m.round ?? 1) === currentRound &&
    (m.status === "PENDENTE" || m.status === "AGUARDANDO_CONFIRMACAO")
  ).length;

  const disputesInCurrentRound = matches.filter((m: any) =>
    (m.round ?? 1) === currentRound &&
    m.status === "DISPUTA"
  ).length;


  // =========================
  // EMBED PRINCIPAL
  // =========================
  embed.setColor(embedColorByStatus(t.status));

  embed.addFields(
    { name: "📌 Status", value: prettyStatus(t.status), inline: true },
    { name: "🎛️ Modo", value: prettyMode(t.mode), inline: true },
    { name: "🏐 Formato", value: String(t.format ?? "-"), inline: true },
    { name: "💸 Valor Pix", value: t.pixValue != null ? `R$ ${Number(t.pixValue).toFixed(2)}` : "-", inline: true },
    { name: "👥 Vagas", value: t.slots ? `${totalRegs}/${t.slots}` : `${totalRegs}`, inline: true },
    { name: "✅ Confirmados", value: `${confirmed}`, inline: true },
  );

  embed.addFields({
    name: "📊 Pagamentos",
    value:
      `🕒 Pendente: **${pendPay}**\n` +
      `📩 Enviado: **${sentPay}**\n` +
      `❌ Rejeitado: **${rejected}**`,
    inline: true,
  });

  embed.addFields({
    name: "⚔️ Partidas",
    value:
      `📌 Total: **${totalMatches}**\n` +
      `⏳ Pendentes: **${pendingMatches}**\n` +
      `⚖️ Disputas: **${disputes}**\n` +
      `✅ Finalizadas: **${doneMatches}**\n` +
      (currentRound ? `🧩 Rodada atual: **${currentRound}**` : `🧩 Rodada atual: **-**`),
    inline: true,
  });

  // =========================
  // STAFF VIEW
  // =========================
  if (isStaff) {
    const canOpen = t.status === "DRAFT" || t.status === "INSCRICOES_FECHADAS";
    const canClose = t.status === "INSCRICOES_ABERTAS";
    const canGenerate = confirmed >= 2 && t.status !== "FINALIZADO";

    const nextRound = getNextRoundNumber(matches);      // ex: se só tem R1, isso deve dar 2
    const prevRound = nextRound - 1;

    const prevMatches = matches.filter((m: any) => m.round === prevRound);
    const nextExists = matches.some((m: any) => m.round === nextRound);

    const pendingPrev = prevMatches.filter((m: any) =>
      m.status === "PENDENTE" || m.status === "AGUARDANDO_CONFIRMACAO"
    ).length;

    const disputesPrev = prevMatches.filter((m: any) => m.status === "DISPUTA").length;

    const canAdvance =
      totalMatches > 0 &&
      prevRound >= 1 &&
      prevMatches.length > 0 &&
      pendingPrev === 0 &&
      disputesPrev === 0 &&
      !nextExists &&
      t.status !== "FINALIZADO";


    const canFinish = t.status !== "FINALIZADO";

    // dicas rápidas
    const tips: string[] = [];
    if (t.status === "DRAFT") tips.push("➡️ Crie/ajuste e **Abra inscrições** quando estiver pronto.");
    if (t.status === "INSCRICOES_ABERTAS") tips.push("➡️ Quando lotar, **Feche inscrições**.");
    if (t.status === "INSCRICOES_FECHADAS" && confirmed >= 2) tips.push("➡️ Agora clique em **Gerar chaves**.");
    if (totalMatches > 0 && disputes > 0) tips.push("➡️ Existem **disputas** — resolva antes de avançar rodada.");
    if (totalMatches > 0 && pendingMatches === 0 && disputes === 0) tips.push("➡️ Tudo OK — pode **Avançar rodada**.");
    if (t.status === "FINALIZADO") tips.push("🏁 Torneio encerrado.");

    if (tips.length) {
      embed.addFields({ name: "🧭 Próximos passos", value: tips.join("\n"), inline: false });
    }

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("staff:open_regs")
        .setLabel("🔓 Abrir inscrições")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!canOpen),

      new ButtonBuilder()
        .setCustomId("staff:close_regs")
        .setLabel("🔒 Fechar inscrições")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!canClose),

      new ButtonBuilder()
        .setCustomId("staff:payments")
        .setLabel(sentPay > 0 ? `💰 Pagamentos (${sentPay})` : "💰 Pagamentos")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("staff:generate_bracket")
        .setLabel("🌱 Gerar chaves")
        .setStyle(ButtonStyle.Success)
        .setDisabled(!canGenerate),

      new ButtonBuilder()
        .setCustomId("staff:view_matches")
        .setLabel("⚔️ Partidas")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(totalMatches === 0),
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("staff:advance_round")
        .setLabel("➡️ Avançar rodada")
        .setStyle(ButtonStyle.Success)
        .setDisabled(!canAdvance),

      new ButtonBuilder()
        .setCustomId("staff:view_disputes")
        .setLabel(disputes > 0 ? `⚖️ Disputas (${disputes})` : "⚖️ Disputas")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disputes === 0),

      new ButtonBuilder()
        .setCustomId("staff:resolve_dispute")
        .setLabel("🧩 Resolver disputa")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disputes === 0),

      new ButtonBuilder()
        .setCustomId("staff:apply_wo")
        .setLabel("🟥 Aplicar WO")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(totalMatches === 0 || t.status === "FINALIZADO"),

      new ButtonBuilder()
        .setCustomId("staff:finish_tournament")
        .setLabel("🛑 Finalizar")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!canFinish),
    );

    return { embeds: [embed], components: [row1, row2], ephemeral: true };
  }

  // =========================
  // PLAYER VIEW
  // =========================
  const reg = db.getRegByUser(interaction.user.id);

  const canSignup =
    t.status === "INSCRICOES_ABERTAS" &&
    !reg;
  const canSendReceipt =
    !!reg &&
    t.status !== "FINALIZADO" &&
    (reg.status === "PENDENTE_PAGAMENTO" || reg.status === "REJEITADO" || reg.status === "PAGAMENTO_ENVIADO");

  const statusPlayer = reg ? `✅ ${reg.status}` : "❌ Não inscrito";

  const hint: string[] = [];
  if (!reg && t.status === "INSCRICOES_ABERTAS") hint.push("➡️ Clique em **📝 Inscrever-se** para garantir sua vaga.");
  if (reg?.status === "PENDENTE_PAGAMENTO") hint.push("➡️ Envie o comprovante em **💸 Enviar comprovante**.");
  if (reg?.status === "PAGAMENTO_ENVIADO") hint.push("⏳ Aguardando confirmação via ticket.");
  if (reg?.status === "CONFIRMADO") hint.push("✅ Você está confirmado! Aguarde a chave.");
  if (t.status === "FINALIZADO") hint.push("🏁 Torneio finalizado.");

  embed.addFields(
    { name: "👤 Seu status", value: statusPlayer, inline: false },
    { name: "🧭 O que fazer agora", value: hint.join("\n") || "Acompanhe o canal de chaves e partidas.", inline: false }
  );

  const rowP = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("player:signup")
      .setLabel("📝 Inscrever-se")
      .setStyle(ButtonStyle.Success)
      .setDisabled(!canSignup),

    new ButtonBuilder()
      .setCustomId("player:send_receipt")
      .setLabel(reg?.status === "PAGAMENTO_ENVIADO" ? "💸 Reenviar comprovante" : "💸 Enviar comprovante")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!canSendReceipt),

    new ButtonBuilder()
      .setCustomId("player:list")
      .setLabel("👥 Ver inscritos")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [rowP], ephemeral: true };
}
