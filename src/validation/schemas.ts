import { z } from "zod";

// --- shared param schemas ---

export const eventIdParamsSchema = z.object({
  eventId: z.coerce.number().int().positive(),
});

export const idParamsSchema = eventIdParamsSchema.extend({
  id: z.coerce.number().int().positive(),
});

export const guestIdParamsSchema = idParamsSchema.extend({
  guestId: z.coerce.number().int().positive(),
});

export const eventGuestParamsSchema = eventIdParamsSchema.extend({
  guestId: z.coerce.number().int().positive(),
});

// --- guests ---

export const guestTypeSchema = z.enum(["MAIN_GUEST", "PLUS_ONE"]);
export const genderSchema = z.enum(["FEMALE", "MALE"]);
export const ageRangeSchema = z.enum(["ADULT", "CHILD", "BABY"]);
export const guestStatusSchema = z.enum(["INVITED", "CONFIRMED", "DECLINED"]);

export const createGuestSchema = z.object({
  full_name: z.string().trim().min(1, "full_name is required"),
  guest_type: guestTypeSchema,
  main_guest_id: z.coerce.number().int().positive().optional().nullable(),
  host_name: z.string().trim().min(1).optional().nullable(),
  gender: genderSchema,
  age_range: ageRangeSchema.optional(),
  avatar_key: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: guestStatusSchema.optional(),
});

export const updateGuestSchema = createGuestSchema.partial();

// --- guest groups ---

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  category: z.string().trim().min(1).optional().nullable(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const addMembersSchema = z.object({
  guestIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "No guest IDs provided"),
});

// --- guest relations ---

export const relationKindSchema = z.enum([
  "AFFINITY",
  "FAMILY",
  "SOCIAL",
  "CONFLICT",
]);
export const relationSourceSchema = z.enum(["USER", "IMPORT", "AI_SUGGESTION"]);

export const createRelationSchema = z.object({
  guest_id_1: z.coerce.number().int().positive(),
  guest_id_2: z.coerce.number().int().positive(),
  kind: relationKindSchema,
  strength: z.coerce.number().int().min(1).max(5).optional(),
  source: relationSourceSchema.optional(),
  notes: z.string().optional().nullable(),
});

export const updateRelationSchema = z
  .object({
    strength: z.coerce.number().int().min(1).max(5).optional(),
    source: relationSourceSchema.optional(),
    notes: z.string().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update",
  });

// --- hosts ---

export const replaceHostsSchema = z.object({
  names: z.array(z.string()).default([]),
});

// --- tables ---

export const tableShapeSchema = z.enum(["redonda", "rectangular"]);

export const createTableSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  shape: tableShapeSchema,
  seats: z.coerce.number().int().positive("seats must be a positive number"),
  min_seats: z.coerce.number().int().positive().optional().nullable(),
  category: z.string().trim().min(1).optional().nullable(),
  pos_x: z.coerce.number().optional().nullable(),
  pos_y: z.coerce.number().optional().nullable(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
});

export const updateTableSchema = z.object({
  name: z.string().trim().min(1).optional(),
  shape: tableShapeSchema.optional(),
  seats: z.coerce.number().int().positive().optional(),
  min_seats: z.coerce.number().int().positive().optional().nullable(),
  category: z.string().trim().min(1).optional().nullable(),
  pos_x: z.coerce.number().optional().nullable(),
  pos_y: z.coerce.number().optional().nullable(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
});

export const assignGuestSchema = z.object({
  guest_id: z.coerce.number().int().positive(),
  seat_number: z.coerce.number().int().positive().optional().nullable(),
});

export const reassignSchema = z.object({
  guest_id: z.coerce.number().int().positive(),
  table_id: z.coerce.number().int().positive(),
  seat_number: z.coerce.number().int().positive().optional().nullable(),
});

export const setLockedSchema = z.object({
  locked: z.boolean(),
});

// --- seating ---

export const weightLevelSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const seatingWeightsSchema = z.object({
  host: z.object({
    mode: z.enum(["separate", "indifferent", "mixed"]),
    weight: weightLevelSchema,
  }),
  family: weightLevelSchema,
  affinity: weightLevelSchema,
  groups: weightLevelSchema,
  age: weightLevelSchema,
});

export const autoAssignSchema = z.object({
  weights: seatingWeightsSchema,
  seed: z.coerce.number().int().optional(),
});

// --- events ---

export const createEventSchema = z.object({
  name: z.string().trim().min(1).optional(),
});

export const updateEventSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    room_width_m: z.coerce.number().positive().optional(),
    room_height_m: z.coerce.number().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update",
  });
