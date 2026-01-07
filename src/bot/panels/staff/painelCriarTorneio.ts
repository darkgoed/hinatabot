import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { ButtonBuilder, ButtonStyle } from "discord.js";

import { registerButton, registerModal } from "../../interactions/registry";
import { db } from "../../../core/store/db";
import { Tournament } from "../../../core/types/tournament";

function ensureStaff(i: any) {
    const isStaff = i.memberPermissions?.has?.("Administrator");
    if (!isStaff) throw new Error("Sem permissão.");
}

registerButton("staff:create_tournament", async (i) => {
    ensureStaff(i);

    const modal = new ModalBuilder()
        .setCustomId("modal:create_tournament")
        .setTitle("Criar torneio");

    const format = new TextInputBuilder()
        .setCustomId("format")
        .setLabel("Formato (1v1,2v2,3v3,4v4,6v6)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const mode = new TextInputBuilder()
        .setCustomId("mode")
        .setLabel("Modo (TIME ou RANDOM)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const slots = new TextInputBuilder()
        .setCustomId("slots")
        .setLabel("Vagas (ex: 32)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const pix = new TextInputBuilder()
        .setCustomId("pix")
        .setLabel("Valor Pix (ex: 9.00)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(format),
        new ActionRowBuilder<TextInputBuilder>().addComponents(mode),
        new ActionRowBuilder<TextInputBuilder>().addComponents(slots),
        new ActionRowBuilder<TextInputBuilder>().addComponents(pix)
    );

    return i.showModal(modal);
});

registerModal("modal:create_tournament", async (i) => {
    ensureStaff(i);

    const format = i.fields.getTextInputValue("format").trim() as Tournament["format"];
    const modeRaw = i.fields.getTextInputValue("mode").trim().toUpperCase();
    const slots = Number(i.fields.getTextInputValue("slots"));
    const pixValue = Number(i.fields.getTextInputValue("pix").replace(",", "."));

    const t: Tournament = {
        id: String(Date.now()),
        status: "DRAFT",
        mode: modeRaw === "RANDOM" ? "RANDOM" : "TIME",
        format: ["1v1", "2v2", "3v3", "4v4", "6v6"].includes(format) ? format : "2v2",
        slots: Number.isFinite(slots) ? slots : 32,
        pixValue: Number.isFinite(pixValue) ? pixValue : 0,
        md3: true,
        createdAt: Date.now()
    };

    db.setTournament(t);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("staff:refresh_panel")
          .setLabel("🔄 Abrir painel atualizado")
          .setStyle(ButtonStyle.Secondary)
      );
      
      return i.reply({
        content: `✅ Torneio criado! ID: ${t.id} (status: DRAFT)\nClique abaixo para abrir o painel atualizado:`,
        components: [row],
        ephemeral: true
      });
      

});
