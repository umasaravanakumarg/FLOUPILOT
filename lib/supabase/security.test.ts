import { describe, expect, it } from "vitest";
import { createInitialState } from "../demo-state";
import { buildAiContext } from "./ai-context";
import { mutationSchema } from "./mutation-schema";

const uuid = "00000000-0000-4000-8000-000000000001";

describe("persistent mutation input boundary", () => {
  it("rejects client-supplied role and status fields instead of silently accepting them", () => {
    expect(mutationSchema.safeParse({
      type: "expense/pay",
      expenseId: uuid,
      role: "owner",
      status: "Paid",
    }).success).toBe(false);
    expect(mutationSchema.safeParse({
      type: "approval/decide",
      approvalId: uuid,
      decision: "Approved",
      status: "Paid",
    }).success).toBe(false);
    expect(mutationSchema.safeParse({
      type: "production/create",
      production: {
        name: "Untrusted",
        type: "Film",
        industry: "Film",
        originalBudgetPaise: 100,
        tenantId: uuid,
        role: "owner",
      },
      department: { name: "Production" },
    }).success).toBe(false);
  });

  it("accepts only an explicit approval decision and a positive safe-integer amount", () => {
    expect(mutationSchema.safeParse({
      type: "approval/decide",
      approvalId: uuid,
      decision: "Approved",
    }).success).toBe(true);
    expect(mutationSchema.safeParse({
      type: "approval/decide",
      approvalId: uuid,
      decision: "Paid",
    }).success).toBe(false);

    const expense = {
      type: "expense/create",
      expense: {
        productionId: uuid,
        departmentId: uuid,
        title: "Valid expense",
        vendor: "Valid vendor",
        date: "2026-10-10",
        amountPaise: Number.MAX_SAFE_INTEGER + 1,
        description: "",
      },
    };
    expect(mutationSchema.safeParse(expense).success).toBe(false);
  });
});

describe("server AI context scope", () => {
  it("contains only the selected production's records and rejects an unavailable production", () => {
    const state = createInitialState();
    const serialized = JSON.stringify(buildAiContext(state, "phoenix"));
    expect(serialized).toContain("Project Phoenix");
    expect(serialized).not.toContain("Project Alpha");
    expect(serialized).not.toContain("EXP-401");
    expect(() => buildAiContext(state, "not-authorized")).toThrow("Production is not available.");
  });
});
