import { registerButton } from "../../interactions/registry";
import { buildPainelPayload } from "../../panels/painelTorneio";

const STAFF_ROLE_NAME = process.env.STAFF_ROLE_NAME || "Torneio Staff";

registerButton("staff:refresh_panel", async (i) => {
  return i.reply(buildPainelPayload(i, STAFF_ROLE_NAME));
});
