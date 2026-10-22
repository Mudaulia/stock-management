/**
 * Shared application constants.
 *
 * UNIT_OPTIONS is the single source of truth for item units,
 * used by both the server-side validation (Zod enum) and the
 * frontend form (items page). Keep in sync with
 * .trae/rules/product/erd.md (Item.unit).
 */
export const UNIT_OPTIONS = [
  "PCS",
  "SET",
  "LITER",
  "UNIT",
  "METER",
  "KG",
  "BOX",
  "PACK",
] as const;

export type UnitOption = (typeof UNIT_OPTIONS)[number];
