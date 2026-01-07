import { Registration, Tournament } from "../types/tournament";

let currentTournament: Tournament | null = null;
let registrations: Registration[] = [];

export const db = {
  getTournament(): Tournament | null {
    return currentTournament;
  },

  // ✅ usar SOMENTE quando criar torneio novo
  createTournament(t: Tournament) {
    currentTournament = t;
    registrations = [];
  },

  // ✅ usar para qualquer update de status, pix, slots, messageId etc.
  updateTournament(patch: Partial<Tournament>) {
    if (!currentTournament) return;
    currentTournament = { ...currentTournament, ...patch };
  },

  // (se você quiser manter setTournament, faça ele NÃO resetar)
  setTournament(t: Tournament) {
    currentTournament = t; // ❌ NÃO RESETAR AQUI
  },

  listRegs() {
    return registrations;
  },
  getRegByUser(userId: string) {
    return registrations.find(r => r.userId === userId);
  },
  getRegById(id: string) {
    return registrations.find(r => r.id === id);
  },
  upsertReg(reg: Registration) {
    const idx = registrations.findIndex(r => r.userId === reg.userId);
    if (idx >= 0) registrations[idx] = reg;
    else registrations.push(reg);
  },

  countConfirmed() {
    return registrations.filter(r => r.status === "CONFIRMADO").length;
  },
  countTotal() {
    return registrations.length;
  },
  listPendingPayments() {
    return registrations.filter(r => r.status === "PAGAMENTO_ENVIADO" || r.status === "PENDENTE_PAGAMENTO");
  }
};
