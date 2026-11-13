/**
 * Contrato de datos (solo tipos) para el motor de asignación de mesas.
 * El backend serializa un objeto compatible con `SeatingPlanningInput`
 * a partir de Prisma (evento + invitados + mesas + grupos + relaciones +
 * asignaciones ya fijadas) y se lo pasa a `generateAssignment` (assign.ts),
 * que es lógica pura, sin Prisma ni Express.
 */

export type SeatingGuestDTO = {
  id: number;
  full_name: string;
  guest_type: "MAIN_GUEST" | "PLUS_ONE";
  main_guest_id: number | null;
  host_name: string | null;
  age_range: "ADULT" | "CHILD" | "BABY";
  status: "INVITED" | "CONFIRMED" | "DECLINED";
};

export type SeatingTableDTO = {
  id: number;
  name: string;
  /** Capacidad máxima — estricta. */
  seats: number;
  /** Capacidad mínima deseable — el algoritmo intenta no dejar la mesa por debajo, pero puede no lograrlo. */
  min_seats: number | null;
};

export type SeatingGroupDTO = {
  id: number;
  name: string;
  member_guest_ids: number[];
};

export type SeatingRelationKind = "AFFINITY" | "FAMILY" | "SOCIAL" | "CONFLICT";

export type SeatingRelationDTO = {
  guest_a_id: number;
  guest_b_id: number;
  kind: SeatingRelationKind;
  strength: number;
};

/** Una asignación ya fijada (candado) a mano — el algoritmo nunca la mueve. */
export type SeatingLockedAssignment = {
  guest_id: number;
  table_id: number;
};

export type SeatingPlanningInput = {
  event: { id: number; name: string };
  guests: SeatingGuestDTO[];
  tables: SeatingTableDTO[];
  groups: SeatingGroupDTO[];
  relations: SeatingRelationDTO[];
  lockedAssignments: SeatingLockedAssignment[];
};

export type HostMode = "separate" | "indifferent" | "mixed";

/** 0 = ninguno, 1 = bajo, 2 = medio, 3 = alto. */
export type WeightLevel = 0 | 1 | 2 | 3;

export type SeatingWeights = {
  host: { mode: HostMode; weight: WeightLevel };
  family: WeightLevel;
  affinity: WeightLevel;
  groups: WeightLevel;
  age: WeightLevel;
};

export type SeatingAlert =
  | { type: "conflict_unavoidable"; message: string; guestIds: [number, number]; tableId: number }
  | { type: "table_below_minimum"; message: string; tableId: number }
  | { type: "guest_unassigned"; message: string; guestIds: number[] }
  | { type: "capacity_insufficient"; message: string };

export type SeatingTableScore = {
  tableId: number;
  score: number;
  occupantCount: number;
  belowMinimum: boolean;
};

export type SeatingAssignmentResult = {
  guestId: number;
  tableId: number;
  locked: boolean;
};

export type SeatingResult = {
  assignments: SeatingAssignmentResult[];
  unassignedGuestIds: number[];
  tableScores: SeatingTableScore[];
  alerts: SeatingAlert[];
};
