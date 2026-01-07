import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { registerButton, registerModal } from "../../interactions/registry";
import { db } from "../../../core/store/db";
import { Registration } from "../../../core/types/tournament";

registerButton("player:signup", async (i) => {
  const t = db.getTournament();
  if (!t) return i.reply({ content: "Nenhum torneio.", ephemeral: true });
  if (t.status === "FINALIZADO") return i.reply({ content: "Torneio finalizado.", ephemeral: true });
  if (t.status !== "INSCRICOES_ABERTAS") return i.reply({ content: "Inscrições não estão abertas.", ephemeral: true });

  const existing = db.getRegByUser(i.user.id);
  if (existing) return i.reply({ content: `Você já está inscrito (status: **${existing.status}**).`, ephemeral: true });

  const modal = new ModalBuilder()
    .setCustomId("modal:signup")
    .setTitle("Inscrição no torneio");

  const nick = new TextInputBuilder()
    .setCustomId("nick")
    .setLabel("Nick VBL")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nick));

  if (t.mode === "TIME") {
    const team = new TextInputBuilder()
      .setCustomId("team")
      .setLabel("Nome do time")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const members = new TextInputBuilder()
      .setCustomId("members")
      .setLabel("Nicks dos membros (separe por vírgula)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(team),
      new ActionRowBuilder<TextInputBuilder>().addComponents(members),
    );
  }

  return i.showModal(modal);
});

registerModal("modal:signup", async (i) => {
  const t = db.getTournament();
  if (!t) return i.reply({ content: "Nenhum torneio.", ephemeral: true });
  if (t.status === "FINALIZADO") return i.reply({ content: "Torneio finalizado.", ephemeral: true });
  if (t.status !== "INSCRICOES_ABERTAS") return i.reply({ content: "Inscrições não estão abertas.", ephemeral: true });

  const existing = db.getRegByUser(i.user.id);
  if (existing) return i.reply({ content: "Você já está inscrito.", ephemeral: true });

  const nick = i.fields.getTextInputValue("nick").trim();

  let teamName: string | undefined;
  let members: string[] | undefined;

  if (t.mode === "TIME") {
    teamName = i.fields.getTextInputValue("team").trim();

    const membersRaw = i.fields.getTextInputValue("members").trim();
    const parsed = membersRaw
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    // Garantia: se o capitão não se incluiu, adiciona o nick dele
    if (!parsed.includes(nick)) parsed.unshift(nick);

    members = parsed;
  }

  const reg: Registration = {
    id: `${i.user.id}-${Date.now()}`,
    userId: i.user.id,
    nick,
    teamName,
    members,
    status: "PENDENTE_PAGAMENTO",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  db.upsertReg(reg);

  return i.reply({
    content:
      "✅ Inscrição registrada! Status: **PENDENTE_PAGAMENTO**.\n" +
      "Agora clique em **💸 Enviar comprovante**.",
    ephemeral: true
  });
});
