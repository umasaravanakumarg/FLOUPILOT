import type {
  Approval,
  CrewMember,
  DepartmentBudget,
  Expense,
  FinanceState,
  Production,
  Vendor,
} from "./types";

const day = "2026-10-10";
const p = (rupees: number) => rupees * 100;

export const demoProductions: Production[] = [
  {
    id: "phoenix",
    name: "Project Phoenix",
    type: "Feature Film",
    industry: "South Indian Film",
    status: "At Risk",
    originalBudgetPaise: p(100_000_000),
    revisedBudgetPaise: p(100_000_000),
    baselineActualPaise: p(48_200_000),
    baselineCommittedPaise: p(18_700_000),
    baselineForecastPaise: p(108_400_000),
    burnRatePaise: p(1_850_000),
    baselinePendingApprovals: 17,
    createdAt: day,
  },
  {
    id: "alpha",
    name: "Project Alpha",
    type: "Feature Film",
    industry: "South Indian Film",
    status: "On Track",
    originalBudgetPaise: p(65_000_000),
    revisedBudgetPaise: p(67_000_000),
    baselineActualPaise: p(34_600_000),
    baselineCommittedPaise: p(12_500_000),
    baselineForecastPaise: p(64_800_000),
    burnRatePaise: p(980_000),
    baselinePendingApprovals: 6,
    createdAt: day,
  },
  {
    id: "serial-x",
    name: "Serial X",
    type: "Television Series",
    industry: "South Indian Television",
    status: "Watch",
    originalBudgetPaise: p(180_000_000),
    revisedBudgetPaise: p(188_000_000),
    baselineActualPaise: p(96_200_000),
    baselineCommittedPaise: p(42_500_000),
    baselineForecastPaise: p(194_000_000),
    burnRatePaise: p(2_140_000),
    baselinePendingApprovals: 11,
    createdAt: day,
  },
];

export const demoDepartments: DepartmentBudget[] = [
  { id: "art", productionId: "phoenix", name: "Art & Sets", originalPaise: p(10_000_000), revisedPaise: p(10_500_000), baselineActualPaise: p(8_200_000), baselineCommittedPaise: p(1_400_000), baselineForecastPaise: p(11_600_000) },
  { id: "camera", productionId: "phoenix", name: "Cinematography", originalPaise: p(18_500_000), revisedPaise: p(19_400_000), baselineActualPaise: p(11_700_000), baselineCommittedPaise: p(12_600_000), baselineForecastPaise: p(17_500_000) },
  { id: "post", productionId: "phoenix", name: "Post Production", originalPaise: p(22_000_000), revisedPaise: p(23_800_000), baselineActualPaise: p(17_200_000), baselineCommittedPaise: p(17_800_000), baselineForecastPaise: p(21_900_000) },
  { id: "locations", productionId: "phoenix", name: "Locations", originalPaise: p(11_000_000), revisedPaise: p(12_400_000), baselineActualPaise: p(7_900_000), baselineCommittedPaise: p(8_200_000), baselineForecastPaise: p(10_800_000) },
  { id: "sound", productionId: "phoenix", name: "Sound & Music", originalPaise: p(9_500_000), revisedPaise: p(9_800_000), baselineActualPaise: p(5_400_000), baselineCommittedPaise: p(5_800_000), baselineForecastPaise: p(8_800_000) },
  { id: "wardrobe", productionId: "phoenix", name: "Wardrobe", originalPaise: p(6_500_000), revisedPaise: p(6_800_000), baselineActualPaise: p(5_200_000), baselineCommittedPaise: p(2_200_000), baselineForecastPaise: p(6_400_000) },
  { id: "art-alpha", productionId: "alpha", name: "Art & Sets", originalPaise: p(8_200_000), revisedPaise: p(8_200_000), baselineActualPaise: p(4_000_000), baselineCommittedPaise: p(1_400_000), baselineForecastPaise: p(7_800_000) },
  { id: "camera-alpha", productionId: "alpha", name: "Cinematography", originalPaise: p(13_000_000), revisedPaise: p(13_400_000), baselineActualPaise: p(6_800_000), baselineCommittedPaise: p(2_600_000), baselineForecastPaise: p(12_500_000) },
  { id: "art-serial", productionId: "serial-x", name: "Art & Sets", originalPaise: p(24_000_000), revisedPaise: p(25_000_000), baselineActualPaise: p(11_400_000), baselineCommittedPaise: p(4_800_000), baselineForecastPaise: p(25_600_000) },
];

export const demoExpenses: Expense[] = [
  { id: "EXP-301", productionId: "phoenix", title: "Set dressing materials", vendor: "Studio Noir", departmentId: "art", date: "2026-10-08", amountPaise: p(3_200_000), status: "Pending", description: "Materials for the exterior set extension.", source: "demo" },
  { id: "EXP-302", productionId: "phoenix", title: "VFX render farm", vendor: "Redline Post", departmentId: "post", date: "2026-10-07", amountPaise: p(5_200_000), status: "Pending", description: "Render capacity for the current sequence.", source: "demo" },
  { id: "EXP-303", productionId: "phoenix", title: "Location security", vendor: "Rural Craft Logistics", departmentId: "locations", date: "2026-10-06", amountPaise: p(980_000), status: "Paid", description: "Location perimeter security.", source: "demo" },
  { id: "EXP-304", productionId: "phoenix", title: "Camera rental overtime", vendor: "Kailash Frames", departmentId: "camera", date: "2026-10-05", amountPaise: p(1_860_000), status: "Approved", description: "Overtime rental for the night shoot.", source: "demo" },
  { id: "EXP-401", productionId: "alpha", title: "Location permits", vendor: "Rural Craft Logistics", departmentId: "art-alpha", date: "2026-10-04", amountPaise: p(750_000), status: "Paid", description: "Permit fees for the unit.", source: "demo" },
  { id: "EXP-501", productionId: "serial-x", title: "Stage lighting package", vendor: "Kailash Frames", departmentId: "art-serial", date: "2026-10-03", amountPaise: p(2_100_000), status: "Pending", description: "Lighting package for studio scenes.", source: "demo" },
];

const phoenixApprovals: Approval[] = [
  { id: "APR-154", productionId: "phoenix", expenseId: "EXP-301", title: "Set dressing materials", owner: "Production Design", amountPaise: p(3_200_000), priority: "High", status: "Pending", rationale: "Pending approval for an Art & Sets expense." },
  { id: "APR-163", productionId: "phoenix", expenseId: "EXP-302", title: "VFX render farm", owner: "Post Production", amountPaise: p(5_200_000), priority: "Medium", status: "Pending", rationale: "Render capacity commitment for current shots." },
  { id: "APR-178", productionId: "phoenix", title: "Lead unit travel", owner: "Production", amountPaise: p(4_200_000), priority: "High", status: "Pending", rationale: "Advance required before the next location block." },
  { id: "APR-184", productionId: "phoenix", title: "Drone coverage invoice", owner: "Locations", amountPaise: p(1_500_000), priority: "Low", status: "Pending", rationale: "Awaiting line producer review." },
  ...Array.from({ length: 13 }, (_, index): Approval => ({
    id: `APR-${190 + index}`,
    productionId: "phoenix",
    title: ["Transport advance", "Set safety equipment", "Additional lighting", "Sound mix milestone"][index % 4],
    owner: ["Production", "Art & Sets", "Cinematography", "Sound"][index % 4],
    amountPaise: p([800_000, 1_200_000, 950_000, 620_000][index % 4]),
    priority: index % 3 === 0 ? "High" : index % 3 === 1 ? "Medium" : "Low",
    status: "Pending",
    rationale: "Demo queue item; summary queue count is illustrative.",
  })),
];

export const demoApprovals: Approval[] = [
  ...phoenixApprovals,
  { id: "APR-A-01", productionId: "alpha", title: "Second unit location", owner: "Locations", amountPaise: p(1_200_000), priority: "Low", status: "Pending", rationale: "Permit and location advance." },
  ...Array.from({ length: 5 }, (_, index): Approval => ({
    id: `APR-A-${index + 2}`,
    productionId: "alpha",
    title: ["Art transport", "Unit catering", "Second camera package", "Permit extension", "Wardrobe fittings"][index],
    owner: ["Production", "Production", "Cinematography", "Locations", "Wardrobe"][index],
    amountPaise: p(650_000 + index * 100_000),
    priority: index % 2 ? "Medium" : "Low",
    status: "Pending",
    rationale: "Demo queue item.",
  })),
  ...Array.from({ length: 11 }, (_, index): Approval => ({
    id: `APR-S-${index + 1}`,
    productionId: "serial-x",
    title: ["Stage turnaround", "Costume replenishment", "Unit transport"][index % 3],
    owner: ["Production", "Wardrobe", "Transport"][index % 3],
    amountPaise: p(750_000 + index * 50_000),
    priority: index % 2 ? "Medium" : "Low",
    status: "Pending",
    rationale: "Demo queue item.",
  })),
];

export const demoVendors: Vendor[] = [
  { id: "vendor-studio-noir", productionId: "phoenix", name: "Studio Noir", category: "Set Construction", contact: "accounts@studionoir.example", risk: "Low" },
  { id: "vendor-redline", productionId: "phoenix", name: "Redline Post", category: "Post Production", contact: "billing@redlinepost.example", risk: "High" },
  { id: "vendor-kailash", productionId: "phoenix", name: "Kailash Frames", category: "Equipment Rental", contact: "finance@kailashframes.example", risk: "Medium" },
  { id: "vendor-rural", productionId: "phoenix", name: "Rural Craft Logistics", category: "Transport & Locations", contact: "ops@ruralcraft.example", risk: "Low" },
];

export const demoCrew: CrewMember[] = [
  { id: "crew-anu", productionId: "phoenix", name: "Anu Nair", role: "Production Manager", departmentId: "art", duePaise: p(420_000), paidPaise: p(240_000), nextPaymentDate: "2026-10-18" },
  { id: "crew-karan", productionId: "phoenix", name: "Karan Veer", role: "Associate Director", departmentId: "camera", duePaise: p(325_000), paidPaise: 0, nextPaymentDate: "2026-10-14" },
  { id: "crew-nisha", productionId: "phoenix", name: "Nisha Reddy", role: "Costume Designer", departmentId: "wardrobe", duePaise: p(280_000), paidPaise: p(100_000), nextPaymentDate: "2026-10-20" },
  { id: "crew-vijay", productionId: "phoenix", name: "Vijay Prakash", role: "Camera Operator", departmentId: "camera", duePaise: p(510_000), paidPaise: p(510_000), nextPaymentDate: "2026-10-11" },
];

export const initialFinanceState: FinanceState = {
  selectedProductionId: "phoenix",
  productions: demoProductions,
  departments: demoDepartments,
  expenses: demoExpenses,
  approvals: demoApprovals,
  vendors: demoVendors,
  crew: demoCrew,
  payments: [],
  activity: [
    { id: "activity-1", message: "Project Phoenix financial snapshot opened", at: day, productionId: "phoenix" },
  ],
  budgetRevisionDeltaPaise: {},
  revision: 0,
};
