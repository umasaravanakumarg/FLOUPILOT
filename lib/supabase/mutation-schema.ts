import { z } from "zod";

const money = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const id = z.uuid();
const name = (max: number) => z.string().trim().min(1).max(max);
const isoDate = z.iso.date();
const status = z.enum(["On Track", "Watch", "At Risk"]);

export const mutationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("production/update"),
    productionId: id,
    changes: z.object({
      name: name(160),
      type: name(100),
      industry: name(100),
      status,
    }).strict(),
  }).strict(),
  z.object({
    type: z.literal("production/create"),
    production: z.object({
      name: name(160),
      type: name(100),
      industry: name(100),
      originalBudgetPaise: money,
    }).strict(),
    department: z.object({ name: name(120) }).strict(),
  }).strict(),
  z.object({
    type: z.literal("expense/create"),
    expense: z.object({
      productionId: id,
      departmentId: id,
      title: name(200),
      vendor: name(160),
      date: isoDate,
      amountPaise: money,
      description: z.string().max(4000),
    }).strict(),
  }).strict(),
  z.object({ type: z.literal("expense/submit"), expenseId: id }).strict(),
  z.object({
    type: z.literal("approval/decide"),
    approvalId: id,
    decision: z.enum(["Approved", "Rejected"]),
  }).strict(),
  z.object({ type: z.literal("approval/pay"), approvalId: id }).strict(),
  z.object({ type: z.literal("expense/pay"), expenseId: id }).strict(),
  z.object({
    type: z.literal("budget/revise"),
    departmentId: id,
    revisedPaise: money,
  }).strict(),
  z.object({
    type: z.literal("crew/pay"),
    crewId: id,
    amountPaise: money,
    date: isoDate,
  }).strict(),
]);
