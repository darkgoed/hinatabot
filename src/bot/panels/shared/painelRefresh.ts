import { registerButton } from "../../interactions/registry";
import { buildPainelPayload } from "../painelTorneio";

const STAFF_ROLE_NAME = process.env.STAFF_ROLE_NAME || "Torneio Staff";

registerButton("panel:refresh", async (i) => {
  // Se for mensagem com botões (o normal), update é o correto
  const payload = buildPainelPayload(i, STAFF_ROLE_NAME);

  // update só funciona se veio de um componente (button), que é o caso aqui
  return i.update(payload);
});
