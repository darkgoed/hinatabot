import {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
  } from "discord.js";
  import { registerButton, registerModal } from "../../interactions/registry";
  import { db } from "../../../core/store/db";
  import { Registration } from "../../../core/types/tournament";
  import { upsertInscricoesMessage } from "../../publishers/inscricoesMessage";
  
  function ensureStaff(i: any) {
    const isStaff = i.memberPermissions?.has?.("Administrator");
    if (!isStaff) throw new Error("Sem permissão.");
  }
  
  registerButton("staff:add_player", async (i) => {
    ensureStaff(i);
  
    const t = db.getTournament();
    if (!t) return i.reply({ content: "Nenhum torneio.", ephemeral: true });
    if (t.status === "FINALIZADO") return i.reply({ content: "Torneio finalizado.", ephemeral: true });
  
    const modal = new ModalBuilder()
      .setCustomId("modal:staff_add_player")
      .setTitle("Adicionar player (manual)");
  
    const userId = new TextInputBuilder()
      .setCustomId("userId")
      .setLabel("User ID do Discord")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
  
    const nick = new TextInputBuilder()
      .setCustomId("nick")
      .setLabel("Nick VBL")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
  
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(userId),
      new ActionRowBuilder<TextInputBuilder>().addComponents(nick),
    );
  
    if (t.mode === "TIME") {
      const team = new TextInputBuilder()
        .setCustomId("team")
        .setLabel("Nome do time (opcional)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);
  
      const members = new TextInputBuilder()
        .setCustomId("members")
        .setLabel("Membros (vírgula) (opcional)")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);
  
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(team),
        new ActionRowBuilder<TextInputBuilder>().addComponents(members),
      );
    }
  
    return i.showModal(modal);
  });
  
  registerModal("modal:staff_add_player", async (i) => {
    ensureStaff(i);
  
    const t = db.getTournament();
    if (!t) return i.reply({ content: "Nenhum torneio.", ephemeral: true });
    if (t.status === "FINALIZADO") return i.reply({ content: "Torneio finalizado.", ephemeral: true });
  
    const userId = i.fields.getTextInputValue("userId").trim();
    const nick = i.fields.getTextInputValue("nick").trim();
  
    // evita duplicidade
    const existingByUser = db.getRegByUser(userId);
    if (existingByUser) {
      return i.reply({ content: `Esse user já está inscrito (status: **${existingByUser.status}**).`, ephemeral: true });
    }
  
    // TIME (opcional)
    let teamName: string | undefined;
    let members: string[] | undefined;
  
    if (t.mode === "TIME") {
      const teamRaw = i.fields.getTextInputValue("team")?.trim() ?? "";
      const membersRaw = i.fields.getTextInputValue("members")?.trim() ?? "";
  
      if (teamRaw) teamName = teamRaw;
  
      if (membersRaw) {
        const parsed = membersRaw
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
  
        // garante que o nick do capitão esteja incluso
        if (!parsed.includes(nick)) parsed.unshift(nick);
  
        members = parsed;
      }
    }
  
    const reg: Registration = {
      id: `${userId}-${Date.now()}`,
      userId,
      nick,
      teamName,
      members,
      status: "CONFIRMADO", // <- aqui é o "sem pagamento"
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  
    db.upsertReg(reg);
  
    // atualiza post público de inscrições (se existir)
    await upsertInscricoesMessage(i.client);
  
    return i.reply({
      content: `✅ Player adicionado manualmente como **CONFIRMADO**: <@${userId}> (**${nick}**)`,
      ephemeral: true,
    });
  });
  