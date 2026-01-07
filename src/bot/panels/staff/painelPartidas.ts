import { EmbedBuilder } from "discord.js";
import { registerButton } from "../../interactions/registry";
import { matchStore } from "../../../core/store/matches";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

registerButton("staff:view_matches", async (i) => {
  ensureStaff(i);

  const matches = matchStore.list().sort((a, b) => a.round - b.round || a.position - b.position);
  if (!matches.length) {
    return i.reply({ content: "Ainda não tem partidas. Gere as chaves primeiro.", ephemeral: true });
  }

  const lines = matches.map(m => {
    const a = m.playerAId === "BYE" ? "BYE" : `<@${m.playerAId}>`;
    const b = m.playerBId === "BYE" ? "BYE" : `<@${m.playerBId}>`;
    const thread = m.threadId ? `<#${m.threadId}>` : "(sem thread)";
    return `**R${m.round}-M${m.position}** \`(${m.id})\` — ${a} vs ${b} — **${m.status}** — ${thread}`;
  });

  const embed = new EmbedBuilder()
    .setTitle("⚔️ Partidas")
    .setDescription(lines.join("\n").slice(0, 3900));

  return i.reply({ embeds: [embed], ephemeral: true });
});
