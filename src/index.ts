import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { makeClient } from "./bot/client";
import { buildPainelPayload } from "./bot/panels/painelTorneio";
import { dispatchInteraction } from "./bot/interactions/dispatcher";
import "./bot/interactions/loadModules";

const token = process.env.DISCORD_TOKEN!;
const guildId = process.env.GUILD_ID!;
const staffRoleName = process.env.STAFF_ROLE_NAME || "Torneio Staff";

async function registerCommands() {
  const cmd = new SlashCommandBuilder()
    .setName("painel-torneio")
    .setDescription("Abre o painel do torneio");

  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId),
    { body: [cmd.toJSON()] }
  );
  console.log("✅ /painel-torneio registrado");
}

async function main() {
  const client = makeClient();

  client.on("ready", () => {
    console.log(`🤖 Online como ${client.user?.tag}`);
  });

  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isChatInputCommand() && interaction.commandName === "painel-torneio") {
        return interaction.reply(buildPainelPayload(interaction, staffRoleName));
      }

      return dispatchInteraction(interaction);
    } catch (err) {
      console.error(err);
      if (interaction.isRepliable()) {
        try {
          await interaction.reply({ content: "Erro interno 😵", ephemeral: true });
        } catch {}
      }
    }
  });

  await client.login(token);
}

registerCommands().then(main).catch(console.error);
