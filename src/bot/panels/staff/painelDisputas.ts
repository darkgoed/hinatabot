import { EmbedBuilder } from "discord.js";
import { registerButton } from "../../interactions/registry";
import { matchStore } from "../../../core/store/matches";

function ensureStaff(i: any) {
  const isStaff = i.memberPermissions?.has?.("Administrator");
  if (!isStaff) throw new Error("Sem permissão.");
}

registerButton("staff:view_disputes", async (i) => {
  ensureStaff(i);

  const disputes = matchStore.list()
    .filter(m => m.status === "DISPUTA")
    .sort((a, b) => a.round - b.round || a.position - b.position);

  if (!disputes.length) return i.reply({ content: "Nenhuma disputa no momento ✅", ephemeral: true });

  const lines = disputes.map(m => {
    const A = m.playerAId === "BYE" ? "BYE" : `<@${m.playerAId}>`;
    const B = m.playerBId === "BYE" ? "BYE" : `<@${m.playerBId}>`;
    const thread = m.threadId ? `<#${m.threadId}>` : "(sem thread)";
    return `**${m.id}** — R${m.round}-M${m.position} — ${A} vs ${B} — ${thread}`;
  });

  const embed = new EmbedBuilder()
    .setTitle("⚖️ Disputas")
    .setDescription(lines.join("\n").slice(0, 3900));

  return i.reply({ embeds: [embed], ephemeral: true });
});
