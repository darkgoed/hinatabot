import { registerButtonPrefix } from "../../interactions/registry";
import { matchStore } from "../../../core/store/matches";

function isCaptain(i: any, match: any) {
  return i.user.id === match.playerAId || i.user.id === match.playerBId;
}

registerButtonPrefix("match:confirm:", async (i) => {
  const matchId = i.customId.split(":")[2];
  const match = matchStore.get(matchId);
  if (!match) return i.reply({ content: "Match não encontrado.", ephemeral: true });
  if (!isCaptain(i, match)) return i.reply({ content: "Apenas capitães.", ephemeral: true });

  // só o oponente pode confirmar (não quem reportou)
  if (i.user.id === match.reportedBy) return i.reply({ content: "Quem reportou não confirma.", ephemeral: true });

  const winner =
    (match.scoreA ?? 0) > (match.scoreB ?? 0) ? match.playerAId : match.playerBId;

  match.winnerId = winner;
  match.status = "FINALIZADO";
  match.updatedAt = Date.now();
  matchStore.upsert(match);

  return i.reply({ content: "✅ Resultado confirmado! Staff pode avançar a chave agora.", ephemeral: false });
});

registerButtonPrefix("match:contest:", async (i) => {
  const matchId = i.customId.split(":")[2];
  const match = matchStore.get(matchId);
  if (!match) return i.reply({ content: "Match não encontrado.", ephemeral: true });
  if (!isCaptain(i, match)) return i.reply({ content: "Apenas capitães.", ephemeral: true });

  match.status = "DISPUTA";
  match.updatedAt = Date.now();
  matchStore.upsert(match);

  return i.reply({ content: "⚖️ Resultado contestado. Staff vai resolver pelo painel.", ephemeral: false });
});
