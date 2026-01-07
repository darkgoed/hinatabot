import { Client, GatewayIntentBits } from "discord.js";

export function makeClient() {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds
    ]
  });
}
