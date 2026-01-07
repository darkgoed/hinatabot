import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { makeClient } from "./bot/client";
import { buildPainelPayload } from "./bot/panels/painelTorneio";
import { dispatchInteraction } from "./bot/interactions/dispatcher";
import "./bot/interactions/loadModules";
import { handleClearCommand } from "./bot/commands/clear";


const token = process.env.DISCORD_TOKEN!;
const guildId = process.env.GUILD_ID!;
const staffRoleName = process.env.STAFF_ROLE_NAME || "Torneio Staff";

async function registerCommands() {
  const cmdPainel = new SlashCommandBuilder()
    .setName("painel-torneio")
    .setDescription("Abre o painel do torneio");

  const cmdClear = new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Limpa todas as mensagens do canal (staff)");

  const rest = new REST({ version: "10" }).setToken(token);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId),
    { body: [cmdPainel.toJSON(), cmdClear.toJSON()] } // ✅ registra os dois
  );

  console.log("✅ /painel-torneio registrado");
  console.log("✅ /clear registrado");
}


async function main() {
  const client = makeClient();

  client.on("ready", () => {
    console.log(`🤖 Online como ${client.user?.tag}`);
  });


  client.on("interactionCreate", async (interaction) => {
    try {
      // ✅ comandos (slash)
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "painel-torneio") {
          return interaction.reply(buildPainelPayload(interaction, staffRoleName));
        }

        if (interaction.commandName === "clear") {
          return handleClearCommand(interaction);
        }

        return; // outros comandos: ignora
      }

      // ✅ botões / modais / selects
      return dispatchInteraction(interaction);

    } catch (err) {
      console.error(err);
      if (interaction.isRepliable()) {
        try {
          await interaction.reply({ content: "Erro interno 😵", ephemeral: true });
        } catch { }
      }
    }
  });

  await client.login(token);
}

registerCommands().then(main).catch(console.error);
