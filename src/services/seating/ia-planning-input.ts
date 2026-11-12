/**
 * Contrato de datos (solo tipos) para una futura capa de IA u optimizador de mesas.
 * El backend puede serializar un objeto compatible con `SeatingPlanningInput`
 * a partir de Prisma (evento + invitados + mesas + grupos + relaciones).
 */

export type SeatingGuestDTO = {
  id: number;
  full_name: string;
  guest_type: "MAIN_GUEST" | "PLUS_ONE";
  main_guest_id: number | null;
  host_name: string | null;
  age_range: string;
  status: string;
};

export type SeatingTableDTO = {
  id: number;
  name: string;
  seats: number;
  shape: string | null;
  category: string | null;
};

export type SeatingGroupDTO = {
  id: number;
  name: string;
  category: string | null;
  member_guest_ids: number[];
};

export type SeatingRelationDTO = {
  guest_a_id: number;
  guest_b_id: number;
  kind: "AFFINITY" | "FAMILY" | "SOCIAL" | "CONFLICT";
  strength: number;
  source: "USER" | "IMPORT" | "AI_SUGGESTION";
  notes: string | null;
};

export type SeatingPlanningInput = {
  event: { id: number; name: string };
  guests: SeatingGuestDTO[];
  tables: SeatingTableDTO[];
  groups: SeatingGroupDTO[];
  relations: SeatingRelationDTO[];
  /** Instrucciones en lenguaje natural o reglas ya interpretadas por el cliente */
  constraints_text?: string;
};
