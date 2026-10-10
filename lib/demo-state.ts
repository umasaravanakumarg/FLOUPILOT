import { initialFinanceState } from "./demo-data";
import type { FinanceState } from "./types";

export function createInitialState(): FinanceState {
  return structuredClone(initialFinanceState);
}
