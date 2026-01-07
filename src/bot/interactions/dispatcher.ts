import { Interaction } from "discord.js";
import { buttons, modals, selects, buttonPrefixes, modalPrefixes } from "./registry";

export async function dispatchInteraction(interaction: Interaction) {
  if (interaction.isButton()) {
    const exact = buttons.get(interaction.customId);
    if (exact) return exact(interaction);

    const pref = buttonPrefixes.find(p => interaction.customId.startsWith(p.prefix));
    if (pref) return pref.fn(interaction);

    return interaction.reply({ content: "Botão não implementado 😅", ephemeral: true });
  }

  if (interaction.isModalSubmit()) {
    const exact = modals.get(interaction.customId);
    if (exact) return exact(interaction);

    const pref = modalPrefixes.find(p => interaction.customId.startsWith(p.prefix));
    if (pref) return pref.fn(interaction);

    return interaction.reply({ content: "Modal não implementado 😅", ephemeral: true });
  }

  if (interaction.isStringSelectMenu()) {
    const handler = selects.get(interaction.customId);
    if (!handler) return interaction.reply({ content: "Menu não implementado 😅", ephemeral: true });
    return handler(interaction);
  }
}
