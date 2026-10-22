/**
 * Barrel re-export of domain-split API hooks (backward compatible).
 *
 * Implementation lives in `src/hooks/api/*`. Original export names are
 * preserved so existing imports from `@/hooks/use-api` keep working.
 */
"use client";

export * from "./api/shared";
export * from "./api/items";
export * from "./api/stock";
export * from "./api/reports";
export * from "./api/dashboard";
export * from "./api/users";

// Opname: original exported `useOpname` (list), `UseOpnameParams`, `OpnameResponse`
export { useOpnameList as useOpname } from "./api/opname";
export type {
  UseOpnameListParams as UseOpnameParams,
  OpnameListResponse as OpnameResponse,
} from "./api/opname";
export {
  useOpnameDetail,
  useCreateOpname,
  useReconcileOpname,
  useCancelOpname,
} from "./api/opname";
