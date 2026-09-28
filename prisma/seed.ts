import {
  PrismaClient,
  Prisma,
  Role,
  AssetStatus,
  Criticality,
  LifecycleStage,
  WorkOrderPriority,
  WorkOrderStatus,
  MaintenanceType,
  RelationshipType,
  NotificationType,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ------------------------------------------------------------------
// Deterministic PRNG so re-running seed produces the same dataset.
// ------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260928);

function randInt(min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number, decimals = 2) {
  const v = rng() * (max - min) + min;
  return Number(v.toFixed(decimals));
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}
function pickWeighted<T>(entries: [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [value, weight] of entries) {
    r -= weight;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1][0];
}
function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}
function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ------------------------------------------------------------------
// Reference data: departments, categories, locations
// ------------------------------------------------------------------
const DEPARTMENTS = [
  { code: "RB", name: "Road & Building", description: "Roads, bridges and government buildings." },
  { code: "WTR", name: "Water", description: "Water pipelines, pumps and reservoirs." },
  { code: "DRN", name: "Drainage", description: "Drains and manholes." },
  { code: "SL", name: "Street Lighting", description: "Streetlights and transformers." },
  { code: "TRF", name: "Traffic", description: "Traffic signals and CCTV cameras." },
] as const;

const CATEGORIES = [
  { code: "ROAD", name: "Road", deptCode: "RB", prefix: "RD" },
  { code: "BRIDGE", name: "Bridge", deptCode: "RB", prefix: "BR" },
  { code: "BUILDING", name: "Government Building", deptCode: "RB", prefix: "BLD" },
  { code: "PIPELINE", name: "Pipeline", deptCode: "WTR", prefix: "WP" },
  { code: "PUMP", name: "Pump", deptCode: "WTR", prefix: "PMP" },
  { code: "RESERVOIR", name: "Reservoir", deptCode: "WTR", prefix: "RES" },
  { code: "DRAIN", name: "Drain", deptCode: "DRN", prefix: "DR" },
  { code: "MANHOLE", name: "Manhole", deptCode: "DRN", prefix: "MH" },
  { code: "STREETLIGHT", name: "Streetlight", deptCode: "SL", prefix: "SL" },
  { code: "TRANSFORMER", name: "Transformer", deptCode: "SL", prefix: "TFR" },
  { code: "TRAFFIC_SIGNAL", name: "Traffic Signal", deptCode: "TRF", prefix: "TS" },
  { code: "CCTV", name: "CCTV Camera", deptCode: "TRF", prefix: "CCTV" },
] as const;

// How many assets to generate per category (sums to 170).
const CATEGORY_COUNTS: Record<string, number> = {
  ROAD: 30,
  BRIDGE: 10,
  BUILDING: 10,
  PIPELINE: 20,
  PUMP: 10,
  RESERVOIR: 5,
  DRAIN: 15,
  MANHOLE: 10,
  STREETLIGHT: 22,
  TRANSFORMER: 8,
  TRAFFIC_SIGNAL: 16,
  CCTV: 14,
};

const ZONES = {
  AHM: [
    { zone: "Navrangpura", lat: 23.0339, lng: 72.5619 },
    { zone: "Maninagar", lat: 22.9962, lng: 72.6081 },
    { zone: "Vastrapur", lat: 23.0368, lng: 72.5289 },
    { zone: "Bopal", lat: 23.0327, lng: 72.4653 },
    { zone: "Satellite", lat: 23.0281, lng: 72.5158 },
    { zone: "Paldi", lat: 23.0136, lng: 72.5645 },
    { zone: "Naranpura", lat: 23.0508, lng: 72.5578 },
    { zone: "Chandkheda", lat: 23.1069, lng: 72.5931 },
    { zone: "Thaltej", lat: 23.0483, lng: 72.5058 },
    { zone: "Ghatlodia", lat: 23.0654, lng: 72.5389 },
    { zone: "Vastral", lat: 22.9944, lng: 72.6564 },
    { zone: "Nikol", lat: 23.0328, lng: 72.6478 },
    { zone: "Bapunagar", lat: 23.0356, lng: 72.6272 },
    { zone: "Ellisbridge", lat: 23.0225, lng: 72.5636 },
    { zone: "Sabarmati", lat: 23.0731, lng: 72.581 },
    { zone: "Ranip", lat: 23.0785, lng: 72.5735 },
    { zone: "Isanpur", lat: 22.9701, lng: 72.5926 },
    { zone: "Vejalpur", lat: 23.0016, lng: 72.5205 },
    { zone: "Odhav", lat: 23.0169, lng: 72.6631 },
  ],
  GNR: [
    { zone: "Sector 21", lat: 23.228, lng: 72.6455 },
    { zone: "Sector 16", lat: 23.2144, lng: 72.6417 },
    { zone: "Sector 11", lat: 23.2246, lng: 72.6394 },
    { zone: "Kudasan", lat: 23.1897, lng: 72.6183 },
    { zone: "Raysan", lat: 23.1755, lng: 72.6289 },
    { zone: "Pethapur", lat: 23.1789, lng: 72.6539 },
    { zone: "Adalaj", lat: 23.1667, lng: 72.5833 },
    { zone: "Sector 7", lat: 23.2296, lng: 72.6339 },
    { zone: "Sector 30", lat: 23.1917, lng: 72.6467 },
    { zone: "Kolvada", lat: 23.2064, lng: 72.6497 },
  ],
} as const;

function randomLocation() {
  const city = pickWeighted<"AHM" | "GNR">([
    ["AHM", 70],
    ["GNR", 30],
  ]);
  const base = pick([...ZONES[city]]);
  return {
    city,
    zone: base.zone,
    latitude: Number((base.lat + randFloat(-0.012, 0.012, 4)).toFixed(6)),
    longitude: Number((base.lng + randFloat(-0.012, 0.012, 4)).toFixed(6)),
    address: `${base.zone}, ${city === "AHM" ? "Ahmedabad" : "Gandhinagar"}, Gujarat`,
  };
}

const VENDOR_NAMES = [
  "Sardar Infra Projects",
  "Gujarat Roadlines Pvt Ltd",
  "Narmada Waterworks Co.",
  "Sabarmati Electricals",
  "Adani Civil Contractors",
  "Torrent Power Services",
  "Larsen Infra Solutions",
  "Gandhinagar Builders Co-op",
  "Shreeji Hydraulics",
  "Prakash Signal Systems",
  "Ahmedabad Municipal Contractors",
  "Vishwakarma Construction",
];

const VENDORS_BY_DEPT: Record<string, string[]> = {
  RB: ["Sardar Infra Projects", "Gujarat Roadlines Pvt Ltd", "Larsen Infra Solutions", "Vishwakarma Construction"],
  WTR: ["Narmada Waterworks Co.", "Shreeji Hydraulics"],
  DRN: ["Ahmedabad Municipal Contractors", "Shreeji Hydraulics"],
  SL: ["Sabarmati Electricals", "Torrent Power Services"],
  TRF: ["Prakash Signal Systems", "Adani Civil Contractors"],
};

// ------------------------------------------------------------------
// Category-specific custom attribute generators
// ------------------------------------------------------------------
function customAttributesFor(categoryCode: string): Prisma.InputJsonObject {
  switch (categoryCode) {
    case "ROAD":
      return {
        lengthKm: randFloat(0.5, 12, 1),
        widthMeters: randInt(6, 24),
        lanes: randInt(2, 6),
        surfaceType: pick(["Asphalt", "Concrete", "WBM"]),
      };
    case "BRIDGE":
      return {
        lengthMeters: randInt(30, 800),
        deckWidthMeters: randInt(7, 20),
        bridgeType: pick(["Beam", "Truss", "Arch", "Cable-stayed"]),
        loadCapacityTons: randInt(15, 70),
      };
    case "BUILDING":
      return {
        floorAreaSqm: randInt(200, 8000),
        floors: randInt(1, 6),
        buildingType: pick(["Office", "School", "Hospital", "Community Hall", "Warehouse"]),
        occupancy: randInt(10, 500),
      };
    case "PIPELINE":
      return {
        diameterMm: pick([100, 150, 200, 300, 400, 600]),
        material: pick(["DI (Ductile Iron)", "PVC", "HDPE", "Concrete"]),
        lengthKm: randFloat(0.3, 8, 1),
        pressureBar: randFloat(2, 10, 1),
      };
    case "PUMP":
      return {
        capacityLpm: randInt(500, 15000),
        motorPowerKw: randInt(5, 150),
        pumpType: pick(["Centrifugal", "Submersible", "Booster"]),
      };
    case "RESERVOIR":
      return {
        capacityMillionLiters: randFloat(0.5, 20, 2),
        reservoirType: pick(["Elevated Service Reservoir", "Ground Level Reservoir", "Sump"]),
      };
    case "DRAIN":
      return {
        lengthKm: randFloat(0.2, 5, 1),
        widthMeters: randFloat(0.5, 3, 1),
        drainType: pick(["Open", "Covered", "Box Culvert"]),
      };
    case "MANHOLE":
      return {
        depthMeters: randFloat(1, 4, 1),
        material: pick(["RCC", "Brick Masonry", "Precast Concrete"]),
      };
    case "STREETLIGHT":
      return {
        poleType: pick(["Octagonal Steel", "Tubular Steel", "Concrete"]),
        lampType: pick(["LED", "Sodium Vapour", "Metal Halide"]),
        wattage: pick([40, 70, 90, 120, 150]),
      };
    case "TRANSFORMER":
      return {
        capacityKva: pick([25, 63, 100, 160, 250, 400]),
        voltage: pick(["11kV/440V", "22kV/440V"]),
        transformerType: pick(["Distribution", "Pole-mounted", "Ground-mounted"]),
      };
    case "TRAFFIC_SIGNAL":
      return {
        intersectionName: `${pick(["Circle", "Char Rasta", "Junction"])} ${randInt(1, 40)}`,
        signalType: pick(["Fixed Timer", "Adaptive", "Vehicle Actuated"]),
        lanesControlled: randInt(2, 8),
      };
    case "CCTV":
      return {
        cameraType: pick(["PTZ", "Fixed Bullet", "Dome"]),
        resolution: pick(["1080p", "4MP", "4K"]),
        coverageArea: pick(["Intersection", "Corridor", "Public Building", "Market Area"]),
      };
    default:
      return {};
  }
}

// ------------------------------------------------------------------
// Condition / status / criticality / risk helpers
// ------------------------------------------------------------------
type Profile = {
  status: AssetStatus;
  lifecycleStage: LifecycleStage;
  conditionScore: number;
};

function assignProfile(): Profile {
  const bucket = pickWeighted<"HEALTHY" | "FAIR" | "POOR" | "FAILED" | "RETIRED" | "PLANNED">([
    ["HEALTHY", 52],
    ["FAIR", 22],
    ["POOR", 10],
    ["FAILED", 5],
    ["RETIRED", 5],
    ["PLANNED", 6],
  ]);
  switch (bucket) {
    case "HEALTHY":
      return { status: AssetStatus.OPERATIONAL, lifecycleStage: LifecycleStage.OPERATIONAL, conditionScore: randInt(70, 98) };
    case "FAIR":
      return {
        status: pickWeighted([[AssetStatus.OPERATIONAL, 70], [AssetStatus.MAINTENANCE, 30]]),
        lifecycleStage: pickWeighted([[LifecycleStage.OPERATIONAL, 60], [LifecycleStage.MAINTENANCE, 40]]),
        conditionScore: randInt(45, 70),
      };
    case "POOR":
      return {
        status: pickWeighted([[AssetStatus.MAINTENANCE, 60], [AssetStatus.DAMAGED, 40]]),
        lifecycleStage: pickWeighted([[LifecycleStage.MAINTENANCE, 50], [LifecycleStage.REPAIR, 50]]),
        conditionScore: randInt(20, 44),
      };
    case "FAILED":
      return { status: AssetStatus.FAILED, lifecycleStage: LifecycleStage.REPAIR, conditionScore: randInt(0, 19) };
    case "RETIRED":
      return { status: AssetStatus.RETIRED, lifecycleStage: LifecycleStage.RETIRED, conditionScore: randInt(0, 30) };
    case "PLANNED":
      return {
        status: pickWeighted([[AssetStatus.PLANNED, 40], [AssetStatus.PROCURED, 30], [AssetStatus.UNDER_CONSTRUCTION, 30]]),
        lifecycleStage: pickWeighted([[LifecycleStage.PLANNED, 40], [LifecycleStage.PROCURED, 30], [LifecycleStage.CONSTRUCTED, 30]]),
        conditionScore: 100,
      };
  }
}

function assignCriticality(): Criticality {
  return pickWeighted([
    [Criticality.LOW, 25],
    [Criticality.MEDIUM, 35],
    [Criticality.HIGH, 25],
    [Criticality.CRITICAL, 15],
  ]);
}

const CRITICALITY_SCORE: Record<Criticality, number> = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 100,
};

function computeRiskScore(conditionScore: number, criticality: Criticality, failureHistoryScore: number) {
  const conditionRisk = 100 - conditionScore;
  const criticalityScore = CRITICALITY_SCORE[criticality];
  const raw = conditionRisk * 0.5 + criticalityScore * 0.3 + failureHistoryScore * 0.2;
  return Number(Math.min(100, Math.max(0, raw)).toFixed(1));
}

// ------------------------------------------------------------------
// Main seed
// ------------------------------------------------------------------
async function main() {
  console.log("Seeding Infra360 database...");

  // 1. Departments
  const departmentByCode: Record<string, { id: string }> = {};
  for (const dept of DEPARTMENTS) {
    const d = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description },
      create: dept,
    });
    departmentByCode[dept.code] = d;
  }
  console.log(`Departments: ${DEPARTMENTS.length}`);

  // 2. Categories
  const categoryByCode: Record<string, { id: string; code: string }> = {};
  for (const cat of CATEGORIES) {
    const c = await prisma.assetCategory.upsert({
      where: { code: cat.code },
      update: { name: cat.name, departmentId: departmentByCode[cat.deptCode].id },
      create: {
        code: cat.code,
        name: cat.name,
        departmentId: departmentByCode[cat.deptCode].id,
        description: `${cat.name} assets managed by the ${DEPARTMENTS.find((d) => d.code === cat.deptCode)!.name} department.`,
      },
    });
    categoryByCode[cat.code] = c;
  }
  console.log(`Asset categories: ${CATEGORIES.length}`);

  // 3. Vendors
  const vendorByName: Record<string, { id: string }> = {};
  for (const name of VENDOR_NAMES) {
    const v = await prisma.vendor.upsert({
      where: { name },
      update: {},
      create: {
        name,
        contactPerson: pick(["R. Patel", "S. Shah", "M. Trivedi", "K. Joshi", "A. Mehta"]),
        phone: `+91-9${randInt(100000000, 999999999)}`,
        email: `${name.split(" ")[0].toLowerCase()}@vendor.infra360.demo`,
      },
    });
    vendorByName[name] = v;
  }
  console.log(`Vendors: ${VENDOR_NAMES.length}`);

  // 4. Users
  const demoPasswordHash = await bcrypt.hash("demo1234", 10);
  const userSeeds = [
    { email: "admin@infra360.demo", name: "System Administrator", role: Role.GOVERNMENT_ADMIN, deptCode: null as string | null },
    { email: "roads@infra360.demo", name: "Road & Building Manager", role: Role.DEPARTMENT_MANAGER, deptCode: "RB" },
    { email: "water@infra360.demo", name: "Water Department Manager", role: Role.DEPARTMENT_MANAGER, deptCode: "WTR" },
    { email: "inspector@infra360.demo", name: "Field Inspector", role: Role.INSPECTOR, deptCode: null },
    { email: "maintenance@infra360.demo", name: "Maintenance Officer", role: Role.MAINTENANCE_OFFICER, deptCode: null },
  ];
  const userByEmail: Record<string, { id: string }> = {};
  for (const u of userSeeds) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, departmentId: u.deptCode ? departmentByCode[u.deptCode].id : null },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: demoPasswordHash,
        departmentId: u.deptCode ? departmentByCode[u.deptCode].id : null,
      },
    });
    userByEmail[u.email] = created;
  }
  console.log(`Users: ${userSeeds.length} (demo password for all: "demo1234")`);

  // 5. Assets
  const assetCounters: Record<string, number> = {};
  function nextAssetCode(prefix: string, city: string) {
    const key = `${prefix}-${city}`;
    assetCounters[key] = (assetCounters[key] ?? 0) + 1;
    return `${key}-${String(assetCounters[key]).padStart(3, "0")}`;
  }

  type AssetPlan = {
    assetCode: string;
    categoryCode: string;
    deptCode: string;
  };

  const plans: AssetPlan[] = [];
  for (const cat of CATEGORIES) {
    const count = CATEGORY_COUNTS[cat.code];
    for (let i = 0; i < count; i++) {
      const location = randomLocation();
      plans.push({
        assetCode: nextAssetCode(cat.prefix, location.city),
        categoryCode: cat.code,
        deptCode: cat.deptCode,
      });
    }
  }

  const createdAssets: { id: string; assetCode: string; deptCode: string; categoryCode: string }[] = [];

  let idx = 0;
  for (const plan of plans) {
    idx++;
    const cat = CATEGORIES.find((c) => c.code === plan.categoryCode)!;
    const location = randomLocation();
    const profile = assignProfile();
    const criticality = assignCriticality();

    // Guarantee minimum coverage for key operational scenarios.
    const forceFailed = idx <= 6;
    const forceRetired = idx > 6 && idx <= 12;
    const forceHighRisk = idx > 12 && idx <= 24;
    const forceOverdueInspection = idx > 24 && idx <= 38;
    const forceMaintenanceDue = idx > 38 && idx <= 55;

    let status = profile.status;
    let lifecycleStage = profile.lifecycleStage;
    let conditionScore = profile.conditionScore;
    let finalCriticality = criticality;

    if (forceFailed) {
      status = AssetStatus.FAILED;
      lifecycleStage = LifecycleStage.REPAIR;
      conditionScore = randInt(0, 15);
      finalCriticality = pick([Criticality.HIGH, Criticality.CRITICAL]);
    } else if (forceRetired) {
      status = AssetStatus.RETIRED;
      lifecycleStage = LifecycleStage.RETIRED;
      conditionScore = randInt(0, 20);
    } else if (forceHighRisk) {
      finalCriticality = Criticality.CRITICAL;
      conditionScore = randInt(15, 35);
      status = pickWeighted([[AssetStatus.MAINTENANCE, 60], [AssetStatus.DAMAGED, 40]]);
      lifecycleStage = LifecycleStage.MAINTENANCE;
    }

    const installationDate = daysAgo(randInt(180, 365 * 18));
    const expectedLifeYears = randInt(8, 40);
    const acquisitionDate = new Date(installationDate.getTime() - randInt(0, 90) * 86400000);
    const warrantyEndDate = new Date(installationDate.getTime() + randInt(1, 5) * 365 * 86400000);

    let lastInspectionDate: Date | null = daysAgo(randInt(10, 400));
    let nextInspectionDate: Date | null = daysFromNow(randInt(-60, 180));
    if (forceOverdueInspection) {
      lastInspectionDate = daysAgo(randInt(200, 500));
      nextInspectionDate = daysAgo(randInt(1, 90));
    }
    if (status === AssetStatus.RETIRED || status === AssetStatus.DISPOSED) {
      nextInspectionDate = null;
    }
    if (status === AssetStatus.PLANNED || status === AssetStatus.PROCURED) {
      lastInspectionDate = null;
      nextInspectionDate = null;
    }

    const failureHistoryScore = forceFailed
      ? randInt(70, 100)
      : forceHighRisk
        ? randInt(50, 80)
        : status === AssetStatus.MAINTENANCE || status === AssetStatus.DAMAGED
          ? randInt(30, 60)
          : randInt(0, 25);

    const riskScore = computeRiskScore(conditionScore, finalCriticality, failureHistoryScore);

    const vendorPool = VENDORS_BY_DEPT[plan.deptCode] ?? VENDOR_NAMES;
    const vendorName = pick(vendorPool);

    const asset = await prisma.asset.upsert({
      where: { assetCode: plan.assetCode },
      update: {},
      create: {
        assetCode: plan.assetCode,
        name: `${cat.name} - ${location.zone}${cat.code === "TRAFFIC_SIGNAL" || cat.code === "CCTV" ? "" : ` #${idx}`}`,
        description: `${cat.name} asset located in ${location.zone}, managed by ${DEPARTMENTS.find((d) => d.code === plan.deptCode)!.name} department.`,
        departmentId: departmentByCode[plan.deptCode].id,
        categoryId: categoryByCode[plan.categoryCode].id,
        status,
        conditionScore,
        criticality: finalCriticality,
        riskScore,
        lifecycleStage,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        zone: location.zone,
        installationDate,
        acquisitionDate,
        expectedLifeYears,
        acquisitionCost: randFloat(50000, 9500000, 0),
        warrantyEndDate,
        owner: DEPARTMENTS.find((d) => d.code === plan.deptCode)!.name,
        vendorId: vendorByName[vendorName].id,
        lastInspectionDate,
        nextInspectionDate,
        customAttributes: customAttributesFor(plan.categoryCode),
      },
    });

    createdAssets.push({ id: asset.id, assetCode: asset.assetCode, deptCode: plan.deptCode, categoryCode: plan.categoryCode });

    if (forceMaintenanceDue) {
      // Marked via an open work order created in the next section.
    }
  }
  console.log(`Assets: ${createdAssets.length}`);

  // ----------------------------------------------------------------
  // 6. Child records — cleared and regenerated on every run so seeding
  //    stays idempotent without needing synthetic natural keys.
  // ----------------------------------------------------------------
  await prisma.assetRelationship.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.maintenanceRecord.deleteMany({});
  await prisma.workOrder.deleteMany({});
  await prisma.inspection.deleteMany({});
  await prisma.lifecycleEvent.deleteMany({});

  const inspectorId = userByEmail["inspector@infra360.demo"].id;
  const adminId = userByEmail["admin@infra360.demo"].id;
  const maintenanceOfficerName = "Maintenance Officer";

  // Inspections (30+)
  const inspectionTargets = pickN(createdAssets, 34);
  for (const asset of inspectionTargets) {
    const conditionScore = randInt(10, 98);
    await prisma.inspection.create({
      data: {
        assetId: asset.id,
        inspectorId,
        inspectionDate: daysAgo(randInt(5, 300)),
        conditionScore,
        safetyScore: randInt(10, 100),
        structuralScore: randInt(10, 100),
        operationalScore: randInt(10, 100),
        comments: pick([
          "Routine check-up completed, no major concerns.",
          "Minor wear observed, recommend monitoring.",
          "Visible deterioration, needs follow-up.",
          "Asset in good working condition.",
          "Signs of damage from recent weather, needs repair.",
        ]),
        recommendations: conditionScore < 40 ? "Schedule corrective maintenance within 30 days." : "No immediate action required.",
      },
    });
  }
  console.log(`Inspections: ${inspectionTargets.length}`);

  // Work orders (20+, at least 15 open/maintenance-due)
  const workOrderTargets = pickN(createdAssets, 26);
  const workOrders: { id: string; assetId: string }[] = [];
  for (let i = 0; i < workOrderTargets.length; i++) {
    const asset = workOrderTargets[i];
    const isOpen = i < 16; // guarantees 15+ maintenance-due assets
    const status = isOpen
      ? pickWeighted<WorkOrderStatus>([
          [WorkOrderStatus.REQUESTED, 30],
          [WorkOrderStatus.ASSIGNED, 35],
          [WorkOrderStatus.IN_PROGRESS, 35],
        ])
      : pickWeighted<WorkOrderStatus>([
          [WorkOrderStatus.COMPLETED, 80],
          [WorkOrderStatus.CANCELLED, 20],
        ]);
    const createdAt = daysAgo(randInt(3, 200));
    const dueDate = new Date(createdAt.getTime() + randInt(5, 45) * 86400000);
    const completedAt = status === WorkOrderStatus.COMPLETED ? new Date(dueDate.getTime() - randInt(0, 5) * 86400000) : null;

    const wo = await prisma.workOrder.create({
      data: {
        assetId: asset.id,
        title: pick([
          "Routine preventive maintenance",
          "Repair reported damage",
          "Emergency safety inspection follow-up",
          "Replace worn components",
          "Structural repair works",
        ]),
        description: "Auto-generated demo work order for Infra360.",
        priority: pickWeighted<WorkOrderPriority>([
          [WorkOrderPriority.LOW, 20],
          [WorkOrderPriority.MEDIUM, 35],
          [WorkOrderPriority.HIGH, 30],
          [WorkOrderPriority.CRITICAL, 15],
        ]),
        status,
        assignedTo: maintenanceOfficerName,
        createdBy: "System Administrator",
        createdAt,
        dueDate,
        completedAt,
        estimatedCost: randFloat(2000, 250000, 0),
        actualCost: status === WorkOrderStatus.COMPLETED ? randFloat(2000, 260000, 0) : null,
        resolution: status === WorkOrderStatus.COMPLETED ? "Work completed and verified on site." : null,
      },
    });
    workOrders.push({ id: wo.id, assetId: asset.id });
  }
  console.log(`Work orders: ${workOrders.length}`);

  // Maintenance records (20+)
  const maintenanceCount = 24;
  for (let i = 0; i < maintenanceCount; i++) {
    const linkToWorkOrder = i < workOrders.length && rng() < 0.6;
    const asset = linkToWorkOrder ? undefined : pick(createdAssets);
    const workOrder = linkToWorkOrder ? workOrders[i] : undefined;
    await prisma.maintenanceRecord.create({
      data: {
        assetId: linkToWorkOrder ? workOrder!.assetId : asset!.id,
        workOrderId: linkToWorkOrder ? workOrder!.id : null,
        maintenanceType: pickWeighted<MaintenanceType>([
          [MaintenanceType.PREVENTIVE, 45],
          [MaintenanceType.CORRECTIVE, 30],
          [MaintenanceType.EMERGENCY, 10],
          [MaintenanceType.INSPECTION_RELATED, 15],
        ]),
        performedDate: daysAgo(randInt(1, 250)),
        description: "Auto-generated demo maintenance activity.",
        cost: randFloat(1500, 180000, 0),
        performedBy: maintenanceOfficerName,
        result: pick(["Resolved successfully", "Partially resolved, follow-up scheduled", "Resolved, monitoring recommended"]),
      },
    });
  }
  console.log(`Maintenance records: ${maintenanceCount}`);

  // Lifecycle events (20+, ~2 per asset for a subset)
  const lifecycleTargets = pickN(createdAssets, 22);
  let lifecycleCount = 0;
  for (const asset of lifecycleTargets) {
    const eventType = pick([
      "INSTALLED",
      "COMMISSIONED",
      "INSPECTION",
      "MAINTENANCE",
      "REPAIR",
      "UPGRADE",
    ]);
    await prisma.lifecycleEvent.create({
      data: {
        assetId: asset.id,
        eventType,
        eventDate: daysAgo(randInt(30, 1500)),
        description: `${eventType.replaceAll("_", " ")} event recorded for ${asset.assetCode}.`,
        performedBy: pick(["Field Team A", "Field Team B", "Contractor Crew", "Department Staff"]),
        cost: rng() < 0.6 ? randFloat(5000, 300000, 0) : null,
        metadata: { source: "seed" },
      },
    });
    lifecycleCount++;
  }
  console.log(`Lifecycle events: ${lifecycleCount}`);

  // Asset relationships (15+)
  const relationshipTypes: RelationshipType[] = [
    RelationshipType.CONTAINS,
    RelationshipType.CONNECTED_TO,
    RelationshipType.DEPENDS_ON,
    RelationshipType.LOCATED_ON,
    RelationshipType.SERVES,
    RelationshipType.RELATED_TO,
  ];
  const relationshipPairs = new Set<string>();
  let relationshipCount = 0;
  let attempts = 0;
  while (relationshipCount < 18 && attempts < 200) {
    attempts++;
    const source = pick(createdAssets);
    const target = pick(createdAssets);
    if (source.id === target.id) continue;
    const type = pick(relationshipTypes);
    const key = `${source.id}:${target.id}:${type}`;
    if (relationshipPairs.has(key)) continue;
    relationshipPairs.add(key);
    await prisma.assetRelationship.create({
      data: { sourceAssetId: source.id, targetAssetId: target.id, relationshipType: type },
    });
    relationshipCount++;
  }
  console.log(`Asset relationships: ${relationshipCount}`);

  // Notifications (10+)
  const notificationUsers = Object.values(userByEmail);
  const notificationTargets = pickN(createdAssets, 12);
  let notificationCount = 0;
  for (const asset of notificationTargets) {
    const type = pick<NotificationType>([
      NotificationType.WARNING,
      NotificationType.CRITICAL,
      NotificationType.INSPECTION_DUE,
      NotificationType.MAINTENANCE_DUE,
      NotificationType.INFO,
    ]);
    await prisma.notification.create({
      data: {
        userId: pick(notificationUsers).id,
        assetId: asset.id,
        title: `${type.replaceAll("_", " ")} — ${asset.assetCode}`,
        message: `Automated notification for asset ${asset.assetCode} requiring attention.`,
        type,
        isRead: rng() < 0.4,
        createdAt: daysAgo(randInt(0, 30)),
      },
    });
    notificationCount++;
  }
  console.log(`Notifications: ${notificationCount}`);

  // Audit logs
  const auditTargets = pickN(createdAssets, 30);
  let auditCount = 0;
  for (const asset of auditTargets) {
    await prisma.auditLog.create({
      data: {
        userId: pick([adminId, inspectorId]),
        assetId: asset.id,
        action: pick(["UPDATE", "CREATE", "STATUS_CHANGE", "INSPECTION_LOGGED"]),
        fieldChanged: pick(["status", "conditionScore", "criticality", null]),
        oldValue: pick(["OPERATIONAL", "60", "MEDIUM", null]),
        newValue: pick(["MAINTENANCE", "45", "HIGH", null]),
        timestamp: daysAgo(randInt(0, 200)),
      },
    });
    auditCount++;
  }
  console.log(`Audit logs: ${auditCount}`);

  console.log("Seed complete.");
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  const count = Math.min(n, copy.length);
  for (let i = 0; i < count; i++) {
    const index = randInt(0, copy.length - 1);
    result.push(copy[index]);
    copy.splice(index, 1);
  }
  return result;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
