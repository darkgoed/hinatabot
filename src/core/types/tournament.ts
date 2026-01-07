export type TournamentMode = "TIME" | "RANDOM";
export type TournamentStatus =
    | "DRAFT"
    | "INSCRICOES_ABERTAS"
    | "INSCRICOES_FECHADAS"
    | "EM_ANDAMENTO"
    | "FINALIZADO";

export type TournamentFormat = "1v1" | "2v2" | "3v3" | "4v4" | "6v6";

export type RegistrationStatus =
    | "PENDENTE_PAGAMENTO"
    | "PAGAMENTO_ENVIADO"
    | "CONFIRMADO"
    | "REJEITADO"
    | "ELIMINADO";

export interface PaymentReceipt {
    amount: number;
    time: string; // "HH:MM" ou "HH:MM:SS"
    txid: string;
    sentAt: number;
}

export interface Registration {
    id: string;
    userId: string;

    // sempre
    nick: string;

    // modo TIME
    teamName?: string;
    members?: string[];

    status: RegistrationStatus;

    receipt?: PaymentReceipt;

    createdAt: number;
    updatedAt: number;
}

export interface Tournament {
    id: string;
    status: TournamentStatus;
    mode: TournamentMode;
    format: TournamentFormat;
    slots: number;
    pixValue: number;
    md3: boolean;
    createdAt: number;
    inscricoesMessageId?: string;
    pagamentosMessageId?: string;
    chavesMessageId?: string;
}

