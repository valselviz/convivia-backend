import { createRng, seededShuffle } from "./prng.js";
import type {
  SeatingAlert,
  SeatingAssignmentResult,
  SeatingGuestDTO,
  SeatingPlanningInput,
  SeatingResult,
  SeatingTableScore,
  SeatingWeights,
} from "./ia-planning-input.js";

const CONFLICT_PENALTY = 1000;

type Unit = {
  /** Invitado principal si hay uno; si no, el propio invitado. */
  key: number;
  guestIds: number[];
};

const pairKey = (a: number, b: number): string =>
  a <= b ? `${a}-${b}` : `${b}-${a}`;

const weightScale = (level: number): number => level;

const buildUnits = (guests: SeatingGuestDTO[]): Unit[] => {
  const byKey = new Map<number, number[]>();
  for (const guest of guests) {
    const key =
      guest.guest_type === "PLUS_ONE" && guest.main_guest_id
        ? guest.main_guest_id
        : guest.id;
    const list = byKey.get(key) ?? [];
    list.push(guest.id);
    byKey.set(key, list);
  }
  return Array.from(byKey.entries()).map(([key, guestIds]) => ({
    key,
    guestIds,
  }));
};

export const generateAssignment = (
  input: SeatingPlanningInput,
  weights: SeatingWeights,
  options: { seed?: number } = {},
): SeatingResult => {
  const rng = createRng(options.seed ?? 42);

  const guestById = new Map(input.guests.map((g) => [g.id, g]));
  const confirmedGuests = input.guests.filter((g) => g.status === "CONFIRMED");
  const confirmedIds = new Set(confirmedGuests.map((g) => g.id));

  const relationLookup = new Map<
    string,
    { kind: string; strength: number }
  >();
  for (const relation of input.relations) {
    relationLookup.set(pairKey(relation.guest_a_id, relation.guest_b_id), {
      kind: relation.kind,
      strength: relation.strength,
    });
  }

  const groupsByGuest = new Map<number, Set<number>>();
  for (const group of input.groups) {
    for (const guestId of group.member_guest_ids) {
      const set = groupsByGuest.get(guestId) ?? new Set<number>();
      set.add(group.id);
      groupsByGuest.set(guestId, set);
    }
  }
  const sharedGroupCount = (a: number, b: number): number => {
    const groupsA = groupsByGuest.get(a);
    const groupsB = groupsByGuest.get(b);
    if (!groupsA || !groupsB) return 0;
    let count = 0;
    for (const g of groupsA) if (groupsB.has(g)) count++;
    return count;
  };

  const pairScore = (aId: number, bId: number): number => {
    const a = guestById.get(aId);
    const b = guestById.get(bId);
    if (!a || !b) return 0;
    let score = 0;

    const relation = relationLookup.get(pairKey(aId, bId));
    if (relation) {
      if (relation.kind === "CONFLICT") {
        score -= CONFLICT_PENALTY * relation.strength;
      } else if (relation.kind === "FAMILY") {
        score += weightScale(weights.family) * relation.strength;
      } else if (relation.kind === "AFFINITY" || relation.kind === "SOCIAL") {
        score += weightScale(weights.affinity) * relation.strength;
      }
    }

    const shared = sharedGroupCount(aId, bId);
    if (shared > 0) {
      score += weightScale(weights.groups) * shared;
    }

    if (
      weights.host.mode !== "indifferent" &&
      a.host_name &&
      b.host_name
    ) {
      const sameHost = a.host_name === b.host_name;
      const hostWeight = weightScale(weights.host.weight);
      if (weights.host.mode === "separate") {
        score += sameHost ? hostWeight : -hostWeight;
      } else {
        score += sameHost ? -hostWeight : hostWeight;
      }
    }

    if (a.age_range === b.age_range) {
      score += weightScale(weights.age);
    }

    return score;
  };

  /** Puntaje de un invitado contra todos los ya sentados en una mesa. */
  const marginalScore = (guestId: number, occupants: number[]): number => {
    let score = 0;
    for (const occupantId of occupants) {
      score += pairScore(guestId, occupantId);
    }
    return score;
  };

  const hasConflictWith = (guestId: number, occupants: number[]): boolean =>
    occupants.some(
      (occupantId) =>
        relationLookup.get(pairKey(guestId, occupantId))?.kind === "CONFLICT",
    );

  // --- 1. Armar unidades (invitado principal + sus +1, siempre juntos) ---
  const allUnits = buildUnits(confirmedGuests);
  const unitByGuestId = new Map<number, Unit>();
  for (const unit of allUnits) {
    for (const guestId of unit.guestIds) unitByGuestId.set(guestId, unit);
  }

  // --- 2. Separar unidades ya fijadas de las libres ---
  const lockedTableByGuest = new Map(
    input.lockedAssignments.map((a) => [a.guest_id, a.table_id]),
  );

  const occupancy = new Map<number, number[]>(
    input.tables.map((t) => [t.id, [] as number[]]),
  );
  const capacityLeft = new Map<number, number>(
    input.tables.map((t) => [t.id, t.seats]),
  );

  const lockedUnitKeys = new Set<number>();
  const assignments: SeatingAssignmentResult[] = [];

  for (const unit of allUnits) {
    const lockedMemberId = unit.guestIds.find((id) =>
      lockedTableByGuest.has(id),
    );
    if (lockedMemberId === undefined) continue;
    const tableId = lockedTableByGuest.get(lockedMemberId)!;
    lockedUnitKeys.add(unit.key);
    const occupants = occupancy.get(tableId);
    if (!occupants) continue; // mesa fijada que ya no existe, se ignora
    for (const guestId of unit.guestIds) {
      occupants.push(guestId);
      assignments.push({ guestId, tableId, locked: true });
    }
    capacityLeft.set(
      tableId,
      (capacityLeft.get(tableId) ?? 0) - unit.guestIds.length,
    );
  }

  const freeUnits = allUnits.filter((u) => !lockedUnitKeys.has(u.key));

  // --- 3. Chequeo de capacidad total ---
  const alerts: SeatingAlert[] = [];
  const totalCapacity = input.tables.reduce((sum, t) => sum + t.seats, 0);
  const totalNeeded = confirmedIds.size;
  if (totalNeeded > totalCapacity) {
    alerts.push({
      type: "capacity_insufficient",
      message: `Hay ${totalNeeded} invitados confirmados pero la capacidad total de las mesas es ${totalCapacity}.`,
    });
  }

  // --- 4. Orden de colocación: primero lo más restringido ---
  const hasConflictRelation = (unit: Unit): boolean =>
    unit.guestIds.some((id) =>
      input.relations.some(
        (r) =>
          r.kind === "CONFLICT" &&
          (r.guest_a_id === id || r.guest_b_id === id),
      ),
    );

  const shuffled = seededShuffle(freeUnits, rng);
  const orderedUnits = [...shuffled].sort((a, b) => {
    const conflictDiff = Number(hasConflictRelation(b)) - Number(hasConflictRelation(a));
    if (conflictDiff !== 0) return conflictDiff;
    return b.guestIds.length - a.guestIds.length;
  });

  const unassignedUnits: Unit[] = [];

  const tableIdsShuffled = () => seededShuffle(input.tables.map((t) => t.id), rng);

  for (const unit of orderedUnits) {
    const size = unit.guestIds.length;
    let bestTableId: number | null = null;
    let bestScore = -Infinity;

    for (const tableId of tableIdsShuffled()) {
      const remaining = capacityLeft.get(tableId) ?? 0;
      if (remaining < size) continue;
      const occupants = occupancy.get(tableId) ?? [];
      const score = unit.guestIds.reduce(
        (sum, guestId) => sum + marginalScore(guestId, occupants),
        0,
      );
      if (score > bestScore) {
        bestScore = score;
        bestTableId = tableId;
      }
    }

    if (bestTableId === null) {
      unassignedUnits.push(unit);
      continue;
    }

    const occupants = occupancy.get(bestTableId)!;
    for (const guestId of unit.guestIds) {
      occupants.push(guestId);
      assignments.push({ guestId, tableId: bestTableId, locked: false });
    }
    capacityLeft.set(bestTableId, (capacityLeft.get(bestTableId) ?? 0) - size);
  }

  // --- 5. Búsqueda local: swaps entre unidades libres que mejoren el puntaje ---
  const assignmentByGuest = new Map(assignments.map((a) => [a.guestId, a]));

  const tableScoreOf = (tableId: number): number => {
    const occupants = occupancy.get(tableId) ?? [];
    let score = 0;
    for (let i = 0; i < occupants.length; i++) {
      for (let j = i + 1; j < occupants.length; j++) {
        score += pairScore(occupants[i], occupants[j]);
      }
    }
    return score;
  };

  const movableUnits = orderedUnits.filter((u) => !unassignedUnits.includes(u));
  const MAX_PASSES = 4;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let improved = false;
    const order = seededShuffle(movableUnits, rng);
    for (let i = 0; i < order.length; i++) {
      for (let j = i + 1; j < order.length; j++) {
        const unitA = order[i];
        const unitB = order[j];
        const tableA = assignmentByGuest.get(unitA.guestIds[0])?.tableId;
        const tableB = assignmentByGuest.get(unitB.guestIds[0])?.tableId;
        if (tableA === undefined || tableB === undefined || tableA === tableB) {
          continue;
        }
        const sizeA = unitA.guestIds.length;
        const sizeB = unitB.guestIds.length;
        const freeAtA = (capacityLeft.get(tableA) ?? 0) + sizeA;
        const freeAtB = (capacityLeft.get(tableB) ?? 0) + sizeB;
        if (freeAtA < sizeB || freeAtB < sizeA) continue;

        const before = tableScoreOf(tableA) + tableScoreOf(tableB);

        // swap tentativo
        occupancy.set(
          tableA,
          (occupancy.get(tableA) ?? [])
            .filter((id) => !unitA.guestIds.includes(id))
            .concat(unitB.guestIds),
        );
        occupancy.set(
          tableB,
          (occupancy.get(tableB) ?? [])
            .filter((id) => !unitB.guestIds.includes(id))
            .concat(unitA.guestIds),
        );

        const after = tableScoreOf(tableA) + tableScoreOf(tableB);

        if (after > before) {
          capacityLeft.set(tableA, (capacityLeft.get(tableA) ?? 0) + sizeA - sizeB);
          capacityLeft.set(tableB, (capacityLeft.get(tableB) ?? 0) + sizeB - sizeA);
          for (const guestId of unitA.guestIds) {
            assignmentByGuest.set(guestId, { guestId, tableId: tableB, locked: false });
          }
          for (const guestId of unitB.guestIds) {
            assignmentByGuest.set(guestId, { guestId, tableId: tableA, locked: false });
          }
          improved = true;
        } else {
          // revertir
          occupancy.set(
            tableA,
            (occupancy.get(tableA) ?? [])
              .filter((id) => !unitB.guestIds.includes(id))
              .concat(unitA.guestIds),
          );
          occupancy.set(
            tableB,
            (occupancy.get(tableB) ?? [])
              .filter((id) => !unitA.guestIds.includes(id))
              .concat(unitB.guestIds),
          );
        }
      }
    }
    if (!improved) break;
  }

  const finalAssignments = Array.from(assignmentByGuest.values());

  // --- 6. Invitados sin ubicar ---
  const unassignedGuestIds = unassignedUnits.flatMap((u) => u.guestIds);
  if (unassignedGuestIds.length > 0) {
    alerts.push({
      type: "guest_unassigned",
      message: `${unassignedGuestIds.length} invitado(s) no se pudieron ubicar por falta de capacidad.`,
      guestIds: unassignedGuestIds,
    });
  }

  // --- 7. Alertas de conflicto inevitable y mesas bajo el mínimo ---
  const finalOccupancy = new Map<number, number[]>(
    input.tables.map((t) => [t.id, [] as number[]]),
  );
  for (const assignment of finalAssignments) {
    finalOccupancy.get(assignment.tableId)?.push(assignment.guestId);
  }

  const reportedConflicts = new Set<string>();
  for (const [, occupants] of finalOccupancy) {
    for (let i = 0; i < occupants.length; i++) {
      for (let j = i + 1; j < occupants.length; j++) {
        const relation = relationLookup.get(pairKey(occupants[i], occupants[j]));
        if (relation?.kind === "CONFLICT") {
          const key = pairKey(occupants[i], occupants[j]);
          if (reportedConflicts.has(key)) continue;
          reportedConflicts.add(key);
          const tableId = Array.from(finalOccupancy.entries()).find(([, o]) =>
            o.includes(occupants[i]),
          )?.[0];
          const nameA = guestById.get(occupants[i])?.full_name ?? "?";
          const nameB = guestById.get(occupants[j])?.full_name ?? "?";
          alerts.push({
            type: "conflict_unavoidable",
            message: `"${nameA}" y "${nameB}" tienen una relación de conflicto pero quedaron en la misma mesa (no se encontró alternativa posible).`,
            guestIds: [occupants[i], occupants[j]],
            tableId: tableId ?? -1,
          });
        }
      }
    }
  }

  const tableScores: SeatingTableScore[] = input.tables.map((table) => {
    const occupants = finalOccupancy.get(table.id) ?? [];
    const belowMinimum =
      table.min_seats != null &&
      occupants.length > 0 &&
      occupants.length < table.min_seats;
    if (belowMinimum) {
      alerts.push({
        type: "table_below_minimum",
        message: `"${table.name}" quedó con ${occupants.length} invitado(s), por debajo del mínimo (${table.min_seats}).`,
        tableId: table.id,
      });
    }
    let score = 0;
    for (let i = 0; i < occupants.length; i++) {
      for (let j = i + 1; j < occupants.length; j++) {
        score += pairScore(occupants[i], occupants[j]);
      }
    }
    return {
      tableId: table.id,
      score,
      occupantCount: occupants.length,
      belowMinimum,
    };
  });

  return {
    assignments: finalAssignments,
    unassignedGuestIds,
    tableScores,
    alerts,
  };
};
