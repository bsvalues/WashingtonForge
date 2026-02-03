// TerraFusion Mock Fixtures
// Canonical mock dataset for demo mode, E2E tests, and contract validation
// Schema matches production PostGIS model for seamless backend integration

import type {
  User,
  County,
  Parcel,
  RatioStudy,
  AuditLogEntry,
  RollYearSnapshot,
  MapLayer,
  AggregateStats,
  ValidationResult,
  VEIFinding,
  CalibrationLever,
  CalibrationPatch,
  DatasetVersion,
  DatasetMetrics,
  CountyDataFreshness,
} from "@/lib/api/types";

// ============================================
// Demo Session (matches real auth shape)
// ============================================

export interface DemoSession {
  userId: string;
  countyId: string;
  roles: string[];
}

export const DEMO_SESSION: DemoSession = {
  userId: "demo_user",
  countyId: "benton",
  roles: ["assessor_admin"],
};

// ============================================
// Counties (39 WA counties - subset shown)
// ============================================

export const MOCK_COUNTIES: County[] = [
  { id: "benton", name: "Benton County", state: "WA", parcelCount: 87420 },
  { id: "franklin", name: "Franklin County", state: "WA", parcelCount: 42150 },
  { id: "yakima", name: "Yakima County", state: "WA", parcelCount: 124800 },
  { id: "spokane", name: "Spokane County", state: "WA", parcelCount: 198600 },
  { id: "king", name: "King County", state: "WA", parcelCount: 542000 },
  { id: "pierce", name: "Pierce County", state: "WA", parcelCount: 356200 },
  { id: "snohomish", name: "Snohomish County", state: "WA", parcelCount: 287400 },
  { id: "clark", name: "Clark County", state: "WA", parcelCount: 201300 },
  { id: "thurston", name: "Thurston County", state: "WA", parcelCount: 134500 },
  { id: "kitsap", name: "Kitsap County", state: "WA", parcelCount: 112800 },
];

// ============================================
// Users
// ============================================

export const MOCK_USER: User = {
  id: "demo_user",
  email: "demo@terrafusion.gov",
  name: "Demo Assessor",
  role: "assessor",
  countyId: "benton",
  countyName: "Benton County",
};

// ============================================
// Parcels (matches PostGIS model)
// ============================================

export const MOCK_PARCELS: Parcel[] = [
  {
    id: "p1",
    parcelId: "12-34-567-001",
    situs: "123 Main St, Richland, WA 99352",
    landValue: 85000,
    impValue: 215000,
    totalValue: 300000,
    salePrice: 310000,
    saleDate: "2024-01-15",
    equityStatus: "fair",
    ratio: 0.97,
    propertyClass: "Single Family",
    neighborhood: "Downtown",
    yearBuilt: 1985,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-119.28, 46.28],
          [-119.279, 46.28],
          [-119.279, 46.281],
          [-119.28, 46.281],
          [-119.28, 46.28],
        ],
      ],
    },
  },
  {
    id: "p2",
    parcelId: "12-34-567-002",
    situs: "456 Oak Ave, Kennewick, WA 99336",
    landValue: 92000,
    impValue: 258000,
    totalValue: 350000,
    salePrice: 380000,
    saleDate: "2024-02-20",
    equityStatus: "progressive",
    ratio: 0.92,
    propertyClass: "Single Family",
    neighborhood: "Westside",
    yearBuilt: 2001,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-119.3, 46.21],
          [-119.299, 46.21],
          [-119.299, 46.211],
          [-119.3, 46.211],
          [-119.3, 46.21],
        ],
      ],
    },
  },
  {
    id: "p3",
    parcelId: "12-34-567-003",
    situs: "789 Pine Rd, West Richland, WA 99353",
    landValue: 78000,
    impValue: 182000,
    totalValue: 260000,
    salePrice: 245000,
    saleDate: "2024-03-10",
    equityStatus: "regressive",
    ratio: 1.06,
    propertyClass: "Condo",
    neighborhood: "Eastgate",
    yearBuilt: 2015,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-119.35, 46.3],
          [-119.349, 46.3],
          [-119.349, 46.301],
          [-119.35, 46.301],
          [-119.35, 46.3],
        ],
      ],
    },
  },
  {
    id: "p4",
    parcelId: "12-34-567-004",
    situs: "321 Cedar Blvd, Richland, WA 99352",
    landValue: 125000,
    impValue: 375000,
    totalValue: 500000,
    salePrice: 515000,
    saleDate: "2024-04-05",
    equityStatus: "fair",
    ratio: 0.97,
    propertyClass: "Single Family",
    neighborhood: "Northgate",
    yearBuilt: 2018,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-119.27, 46.32],
          [-119.269, 46.32],
          [-119.269, 46.321],
          [-119.27, 46.321],
          [-119.27, 46.32],
        ],
      ],
    },
  },
  {
    id: "p5",
    parcelId: "12-34-567-005",
    situs: "555 Birch Lane, Kennewick, WA 99336",
    landValue: 68000,
    impValue: 132000,
    totalValue: 200000,
    salePrice: 218000,
    saleDate: "2024-05-12",
    equityStatus: "progressive",
    ratio: 0.92,
    propertyClass: "Multi-Family",
    neighborhood: "Southend",
    yearBuilt: 1972,
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-119.32, 46.19],
          [-119.319, 46.19],
          [-119.319, 46.191],
          [-119.32, 46.191],
          [-119.32, 46.19],
        ],
      ],
    },
  },
];

// ============================================
// Aggregate Stats
// ============================================

export const MOCK_STATS: AggregateStats = {
  medianRatio: 0.965,
  cod: 12.4,
  prd: 1.02,
  prb: -0.008,
  meanValue: 322000,
  totalValue: 1610000,
};

// ============================================
// Map Layers
// ============================================

export const MOCK_LAYERS: MapLayer[] = [
  { id: "parcels", name: "Parcels", type: "parcels", visible: true },
  { id: "equity", name: "Equity Status", type: "equity", visible: true },
  { id: "sales", name: "Recent Sales", type: "sales", visible: false },
  { id: "neighborhoods", name: "Neighborhoods", type: "neighborhoods", visible: false },
  { id: "zoning", name: "Zoning", type: "zoning", visible: false },
];

// ============================================
// Ratio Studies (IAAO-compliant metrics)
// ============================================

export const MOCK_RATIO_STUDIES: RatioStudy[] = [
  {
    id: "rs-2024-01",
    name: "2024 Annual Ratio Study - Residential",
    status: "completed",
    rollYear: 2024,
    createdAt: "2024-03-15T10:30:00Z",
    completedAt: "2024-03-15T14:22:00Z",
    results: {
      medianRatio: 0.965,
      meanRatio: 0.982,
      cod: 12.4,
      prd: 1.02,
      prb: -0.008,
      sampleSize: 1842,
      outlierCount: 23,
      byNeighborhood: [
        { neighborhood: "Downtown", medianRatio: 0.94, cod: 11.2, sampleSize: 245 },
        { neighborhood: "Westside", medianRatio: 0.98, cod: 13.1, sampleSize: 412 },
        { neighborhood: "Eastgate", medianRatio: 0.97, cod: 10.8, sampleSize: 328 },
        { neighborhood: "Northgate", medianRatio: 0.96, cod: 12.5, sampleSize: 521 },
        { neighborhood: "Southend", medianRatio: 0.95, cod: 14.2, sampleSize: 336 },
      ],
      byPropertyClass: [
        { propertyClass: "Single Family", medianRatio: 0.96, cod: 11.8, sampleSize: 1245 },
        { propertyClass: "Condo", medianRatio: 0.98, cod: 14.2, sampleSize: 387 },
        { propertyClass: "Multi-Family", medianRatio: 0.94, cod: 15.6, sampleSize: 210 },
      ],
    },
  },
  {
    id: "rs-2024-02",
    name: "2024 Commercial Properties Study",
    status: "completed",
    rollYear: 2024,
    createdAt: "2024-04-01T09:00:00Z",
    completedAt: "2024-04-01T16:45:00Z",
    results: {
      medianRatio: 0.92,
      meanRatio: 0.94,
      cod: 18.2,
      prd: 1.04,
      prb: -0.015,
      sampleSize: 456,
      outlierCount: 12,
      byNeighborhood: [],
      byPropertyClass: [
        { propertyClass: "Commercial", medianRatio: 0.92, cod: 17.8, sampleSize: 312 },
        { propertyClass: "Industrial", medianRatio: 0.91, cod: 19.4, sampleSize: 144 },
      ],
    },
  },
  {
    id: "rs-2023-annual",
    name: "2023 Annual Comprehensive Study",
    status: "completed",
    rollYear: 2023,
    createdAt: "2023-03-10T08:00:00Z",
    completedAt: "2023-03-10T18:30:00Z",
    results: {
      medianRatio: 0.945,
      meanRatio: 0.962,
      cod: 13.8,
      prd: 1.03,
      prb: -0.012,
      sampleSize: 2156,
      outlierCount: 34,
      byNeighborhood: [],
      byPropertyClass: [],
    },
  },
];

// ============================================
// Audit Log
// ============================================

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "log-001",
    userId: "demo_user",
    userName: "Demo Assessor",
    action: "AUTH_LOGIN",
    resourceType: "session",
    resourceId: "sess-123",
    countyId: "benton",
    timestamp: new Date().toISOString(),
    details: { ip: "192.168.1.1", userAgent: "TerraFusion/1.0" },
  },
  {
    id: "log-002",
    userId: "demo_user",
    userName: "Demo Assessor",
    action: "COCKPIT_VIEW",
    resourceType: "parcel",
    resourceId: "filter-downtown",
    countyId: "benton",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    details: { filter: { neighborhood: "Downtown" } },
  },
  {
    id: "log-003",
    userId: "admin_user",
    userName: "Admin User",
    action: "RATIO_RUN_CREATE",
    resourceType: "ratio_study",
    resourceId: "rs-2024-01",
    countyId: "benton",
    datasetVersionId: "dsv-2024-001",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    details: { studyName: "2024 Annual Ratio Study" },
  },
  {
    id: "log-004",
    userId: "demo_user",
    userName: "Demo Assessor",
    action: "RATIO_EXPORT",
    resourceType: "ratio_study",
    resourceId: "rs-2024-01",
    countyId: "benton",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    details: { format: "pdf" },
  },
  {
    id: "log-005",
    userId: "admin_user",
    userName: "Admin User",
    action: "INGEST_UPLOAD",
    resourceType: "dataset",
    resourceId: "ds-2024-parcels",
    countyId: "benton",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    details: { fileName: "parcels_2024.csv", rowCount: 87420 },
  },
  {
    id: "log-006",
    userId: "admin_user",
    userName: "Admin User",
    action: "INGEST_VALIDATE",
    resourceType: "dataset",
    resourceId: "ds-2024-parcels",
    countyId: "benton",
    timestamp: new Date(Date.now() - 172700000).toISOString(),
    details: { acceptedRows: 87400, rejectedRows: 20 },
  },
  {
    id: "log-007",
    userId: "admin_user",
    userName: "Admin User",
    action: "DATASET_PUBLISH",
    resourceType: "dataset_version",
    resourceId: "dsv-2024-001",
    countyId: "benton",
    timestamp: new Date(Date.now() - 172600000).toISOString(),
    details: { rollYear: 2024, version: 1 },
  },
  {
    id: "log-008",
    userId: "demo_user",
    userName: "Demo Assessor",
    action: "COCKPIT_SELECT",
    resourceType: "selection",
    resourceId: "sel-downtown-001",
    countyId: "benton",
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    details: { parcelCount: 245, method: "lasso" },
  },
  {
    id: "log-009",
    userId: "demo_user",
    userName: "Demo Assessor",
    action: "SNAPSHOT_CREATE",
    resourceType: "snapshot",
    resourceId: "snap-2024",
    countyId: "benton",
    timestamp: new Date(Date.now() - 345600000).toISOString(),
    details: { rollYear: 2024 },
  },
];

// ============================================
// Roll Year Snapshots
// ============================================

export const MOCK_SNAPSHOTS: RollYearSnapshot[] = [
  {
    id: "snap-2024",
    rollYear: 2024,
    createdAt: "2024-01-15T00:00:00Z",
    parcelCount: 87420,
    totalAssessedValue: 12456000000,
    status: "draft",
  },
  {
    id: "snap-2023",
    rollYear: 2023,
    createdAt: "2023-01-15T00:00:00Z",
    parcelCount: 85200,
    totalAssessedValue: 11234000000,
    status: "published",
  },
  {
    id: "snap-2022",
    rollYear: 2022,
    createdAt: "2022-01-15T00:00:00Z",
    parcelCount: 83100,
    totalAssessedValue: 9876000000,
    status: "archived",
  },
];

// ============================================
// Validation (for Ingest flow) - With Rule Codes
// ============================================

export const MOCK_VALIDATION_RESULT: ValidationResult = {
  totalRows: 1500,
  acceptedRows: 1487,
  rejectedRows: 13,
  errors: [
    {
      row: 45,
      field: "parcel_id",
      value: "",
      message: "Parcel ID is required",
      code: "REQ_PARCEL_ID",
      category: "missing",
      blocking: true,
    },
    {
      row: 123,
      field: "sale_price",
      value: "-5000",
      message: "Sale price must be positive",
      code: "RNG_SALE_PRICE",
      category: "range",
      blocking: true,
    },
    {
      row: 456,
      field: "sale_date",
      value: "13/45/2024",
      message: "Invalid date format (expected YYYY-MM-DD)",
      code: "FMT_SALE_DATE",
      category: "format",
      blocking: true,
    },
    {
      row: 789,
      field: "land_value",
      value: "abc",
      message: "Land value must be numeric",
      code: "FMT_NUMERIC",
      category: "format",
      blocking: true,
    },
    {
      row: 892,
      field: "geometry",
      value: "INVALID WKT",
      message: "Invalid geometry format",
      code: "GEO_INVALID",
      category: "geometry",
      blocking: true,
    },
    {
      row: 901,
      field: "geometry",
      value: "POLYGON((...))",
      message: "Geometry outside county boundary",
      code: "GEO_OUTSIDE_COUNTY",
      category: "geometry",
      blocking: true,
    },
    {
      row: 234,
      field: "parcel_id",
      value: "12-34-567-001",
      message: "Duplicate parcel ID",
      code: "DUP_PARCEL_ID",
      category: "duplicate",
      blocking: false,
    },
    {
      row: 567,
      field: "situs",
      value: "",
      message: "Situs address is required",
      code: "REQ_SITUS",
      category: "missing",
      blocking: false,
    },
    {
      row: 678,
      field: "year_built",
      value: "1823",
      message: "Year built is outside valid range (1850-2026)",
      code: "RNG_YEAR_BUILT",
      category: "range",
      blocking: false,
    },
  ],
  byCategory: [
    { category: "missing", count: 2, blocking: true },
    { category: "format", count: 2, blocking: true },
    { category: "range", count: 2, blocking: true },
    { category: "geometry", count: 2, blocking: true },
    { category: "duplicate", count: 1, blocking: false },
  ],
};

export const MOCK_SOURCE_FIELDS: string[] = [
  "APN",
  "SITUS_ADDR",
  "LAND_VAL",
  "IMPR_VAL",
  "SALE_AMT",
  "SALE_DT",
  "PROP_CLASS",
  "NBHD_CODE",
  "YR_BUILT",
  "SQ_FT",
  "GEOM_WKT",
];

export const MOCK_NEIGHBORHOODS: string[] = [
  "Downtown",
  "Westside",
  "Eastgate",
  "Northgate",
  "Southend",
  "Riverside",
  "Columbia Point",
  "Horn Rapids",
];

export const MOCK_PROPERTY_CLASSES: string[] = [
  "Single Family",
  "Condo",
  "Multi-Family",
  "Commercial",
  "Industrial",
  "Vacant Land",
  "Agricultural",
];

// ============================================
// Dataset Versions
// ============================================

export const MOCK_DATASET_VERSIONS: DatasetVersion[] = [
  {
    id: "dsv-2024-001",
    datasetId: "ds-2024",
    countyId: "benton",
    rollYear: 2024,
    version: 1,
    status: "published",
    rowCount: 87420,
    createdAt: "2024-01-15T08:00:00Z",
    publishedAt: "2024-01-20T14:30:00Z",
    metrics: {
      totalParcels: 87420,
      totalAssessedValue: 12456000000,
      totalSales: 2345,
      medianRatio: 0.965,
      cod: 12.4,
      prd: 1.02,
      prb: -0.008,
    },
  },
  {
    id: "dsv-2024-002",
    datasetId: "ds-2024",
    countyId: "benton",
    rollYear: 2024,
    version: 2,
    status: "draft",
    rowCount: 87420,
    createdAt: "2024-02-10T10:00:00Z",
    metrics: {
      totalParcels: 87420,
      totalAssessedValue: 12580000000,
      totalSales: 2412,
      medianRatio: 0.978,
      cod: 11.2,
      prd: 1.01,
      prb: -0.004,
    },
  },
];

// ============================================
// VEI Findings (Vertical Equity Intelligence)
// ============================================

export const MOCK_VEI_FINDINGS: VEIFinding[] = [
  {
    id: "vei-001",
    scope: "strata",
    scopeId: "Downtown",
    issue: "vertical_equity",
    severity: "fail",
    metric: "PRD",
    currentValue: 1.08,
    threshold: 1.03,
    direction: "above",
    description:
      "Downtown strata shows regressive bias - high-value properties under-assessed relative to low-value",
    recommendedLevers: ["schedule_factor", "depreciation_curve_shift"],
  },
  {
    id: "vei-002",
    scope: "class",
    scopeId: "Multi-Family",
    issue: "uniformity",
    severity: "warn",
    metric: "COD",
    currentValue: 15.6,
    threshold: 15.0,
    direction: "above",
    description:
      "Multi-Family class COD slightly exceeds IAAO threshold - consider quality/condition normalization",
    recommendedLevers: ["quality_mapping_adjust", "location_factor_adjust"],
  },
  {
    id: "vei-003",
    scope: "tier",
    scopeId: "High Value (>$500K)",
    issue: "level",
    severity: "warn",
    metric: "median_ratio",
    currentValue: 0.88,
    threshold: 0.9,
    direction: "below",
    description: "High-value tier median ratio below target range - potential under-assessment",
    recommendedLevers: ["schedule_factor", "land_allocation_adjust"],
  },
  {
    id: "vei-004",
    scope: "overall",
    issue: "vertical_equity",
    severity: "info",
    metric: "PRB",
    currentValue: -0.008,
    threshold: -0.05,
    direction: "above",
    description: "Overall PRB within acceptable range - no immediate action required",
    recommendedLevers: [],
  },
];

// ============================================
// Calibration Levers (Benton Method)
// ============================================

export const MOCK_CALIBRATION_LEVERS: CalibrationLever[] = [
  {
    type: "schedule_factor",
    label: "Schedule Factor",
    description: "Global or per-strata multiplier applied to base cost schedules",
    currentValue: 1.0,
    minValue: 0.8,
    maxValue: 1.2,
    step: 0.01,
    unit: "x",
  },
  {
    type: "depreciation_curve_shift",
    label: "Depreciation Curve Shift",
    description: "Adjust effective age bands to account for market obsolescence patterns",
    currentValue: 0,
    minValue: -10,
    maxValue: 10,
    step: 1,
    unit: "years",
  },
  {
    type: "quality_mapping_adjust",
    label: "Quality Mapping Adjust",
    description: "Re-bin or factor quality grades to align with market premiums",
    currentValue: 1.0,
    minValue: 0.9,
    maxValue: 1.1,
    step: 0.02,
    unit: "x",
  },
  {
    type: "location_factor_adjust",
    label: "Location Factor Adjust",
    description: "Spatial multiplier for neighborhood/market area premium or discount",
    currentValue: 1.0,
    minValue: 0.7,
    maxValue: 1.3,
    step: 0.02,
    unit: "x",
  },
  {
    type: "land_allocation_adjust",
    label: "Land Allocation Adjust",
    description: "Tune land/improvement split to reflect market absorption patterns",
    currentValue: 0.3,
    minValue: 0.15,
    maxValue: 0.5,
    step: 0.01,
    unit: "ratio",
  },
];

// ============================================
// Calibration Patches (History)
// ============================================

export const MOCK_CALIBRATION_PATCHES: CalibrationPatch[] = [
  {
    id: "cal-001",
    fromVersionId: "dsv-2024-001",
    toVersionId: "dsv-2024-002",
    scope: "strata",
    scopeId: "Downtown",
    levers: [
      { type: "schedule_factor", value: 1.03, delta: 0.03 },
      { type: "depreciation_curve_shift", value: -2, delta: -2 },
    ],
    createdBy: "demo_user",
    createdAt: "2024-02-10T10:00:00Z",
    beforeMetrics: {
      totalParcels: 87420,
      totalAssessedValue: 12456000000,
      totalSales: 2345,
      medianRatio: 0.965,
      cod: 12.4,
      prd: 1.02,
      prb: -0.008,
    },
    afterMetrics: {
      totalParcels: 87420,
      totalAssessedValue: 12580000000,
      totalSales: 2412,
      medianRatio: 0.978,
      cod: 11.2,
      prd: 1.01,
      prb: -0.004,
    },
  },
];

// ============================================
// Drift Hotspots (for Dashboard + Cockpit)
// ============================================

export interface DriftHotspot {
  id: string;
  name: string;
  type: "neighborhood" | "class" | "tier";
  metric: string;
  value: number;
  threshold: number;
  severity: "warn" | "fail";
  parcelCount: number;
}

export const MOCK_DRIFT_HOTSPOTS: DriftHotspot[] = [
  {
    id: "dh-1",
    name: "Downtown",
    type: "neighborhood",
    metric: "PRD",
    value: 1.08,
    threshold: 1.03,
    severity: "fail",
    parcelCount: 245,
  },
  {
    id: "dh-2",
    name: "Multi-Family",
    type: "class",
    metric: "COD",
    value: 15.6,
    threshold: 15.0,
    severity: "warn",
    parcelCount: 210,
  },
  {
    id: "dh-3",
    name: "High Value (>$500K)",
    type: "tier",
    metric: "median_ratio",
    value: 0.88,
    threshold: 0.9,
    severity: "warn",
    parcelCount: 412,
  },
  {
    id: "dh-4",
    name: "Southend",
    type: "neighborhood",
    metric: "COD",
    value: 14.2,
    threshold: 15.0,
    severity: "warn",
    parcelCount: 336,
  },
  {
    id: "dh-5",
    name: "Commercial",
    type: "class",
    metric: "PRD",
    value: 1.04,
    threshold: 1.03,
    severity: "warn",
    parcelCount: 312,
  },
];

// ============================================
// County Data Sources & Freshness
// ============================================

export const MOCK_COUNTY_DATA_FRESHNESS: CountyDataFreshness[] = [
  {
    countyId: "king",
    countyName: "King County",
    baselineCoveragePct: 100,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "current",
    overlaySourceLabel: "County Overlay (Lane A)",
    lastOverlayUpdateAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updateLane: "A_live_sync",
    updateLaneDetail: "Delta sync (6h cadence)",
  },
  {
    countyId: "pierce",
    countyName: "Pierce County",
    baselineCoveragePct: 100,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "current",
    overlaySourceLabel: "County Overlay (Lane A)",
    lastOverlayUpdateAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updateLane: "A_live_sync",
    updateLaneDetail: "Delta sync (12h cadence)",
  },
  {
    countyId: "snohomish",
    countyName: "Snohomish County",
    baselineCoveragePct: 99,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "current",
    overlaySourceLabel: "County Overlay (Lane B)",
    lastOverlayUpdateAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updateLane: "B_scheduled_snapshot",
    updateLaneDetail: "Weekly snapshot pull",
  },
  {
    countyId: "spokane",
    countyName: "Spokane County",
    baselineCoveragePct: 98,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "stale",
    overlaySourceLabel: "County Overlay (Lane B)",
    lastOverlayUpdateAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updateLane: "B_scheduled_snapshot",
    updateLaneDetail: "Monthly snapshot pull",
    stalenessNote: "Last update > 14 days. Recommend refresh.",
  },
  {
    countyId: "clark",
    countyName: "Clark County",
    baselineCoveragePct: 100,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "current",
    overlaySourceLabel: "County Overlay (Lane B)",
    lastOverlayUpdateAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updateLane: "B_scheduled_snapshot",
    updateLaneDetail: "Weekly export pull",
  },
  {
    countyId: "yakima",
    countyName: "Yakima County",
    baselineCoveragePct: 99,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "stale",
    overlaySourceLabel: "County Overlay (Lane B)",
    lastOverlayUpdateAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    updateLane: "B_scheduled_snapshot",
    updateLaneDetail: "Weekly export pull",
    stalenessNote: "Last update > 14 days. Recommend refresh.",
  },
  {
    countyId: "benton",
    countyName: "Benton County",
    baselineCoveragePct: 100,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "current",
    overlaySourceLabel: "County Overlay (Lane C)",
    lastOverlayUpdateAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updateLane: "C_zero_it_upload",
    updateLaneDetail: "Manual upload (as needed)",
  },
  {
    countyId: "franklin",
    countyName: "Franklin County",
    baselineCoveragePct: 98,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "current",
    overlaySourceLabel: "County Overlay (Lane C)",
    lastOverlayUpdateAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updateLane: "C_zero_it_upload",
    updateLaneDetail: "Manual upload (quarterly)",
  },
  {
    countyId: "whatcom",
    countyName: "Whatcom County",
    baselineCoveragePct: 97,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "none",
    overlaySourceLabel: null,
    lastOverlayUpdateAt: null,
    updateLane: "C_zero_it_upload",
    updateLaneDetail: "Manual upload (as needed)",
  },
  {
    countyId: "thurston",
    countyName: "Thurston County",
    baselineCoveragePct: 99,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "error",
    overlaySourceLabel: "County Overlay (Lane A)",
    lastOverlayUpdateAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updateLane: "A_live_sync",
    updateLaneDetail: "Delta sync (daily)",
    stalenessNote: "Sync endpoint returning 503. Investigating.",
  },
  {
    countyId: "kitsap",
    countyName: "Kitsap County",
    baselineCoveragePct: 100,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "current",
    overlaySourceLabel: "County Overlay (Lane B)",
    lastOverlayUpdateAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updateLane: "B_scheduled_snapshot",
    updateLaneDetail: "Daily snapshot pull",
  },
  {
    countyId: "cowlitz",
    countyName: "Cowlitz County",
    baselineCoveragePct: 96,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "none",
    overlaySourceLabel: null,
    lastOverlayUpdateAt: null,
    updateLane: "C_zero_it_upload",
    updateLaneDetail: "Manual upload (as needed)",
  },
  {
    countyId: "skagit",
    countyName: "Skagit County",
    baselineCoveragePct: 98,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "current",
    overlaySourceLabel: "County Overlay (Lane C)",
    lastOverlayUpdateAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updateLane: "C_zero_it_upload",
    updateLaneDetail: "Manual upload (monthly)",
  },
  {
    countyId: "grant",
    countyName: "Grant County",
    baselineCoveragePct: 95,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "none",
    overlaySourceLabel: null,
    lastOverlayUpdateAt: null,
    updateLane: "C_zero_it_upload",
    updateLaneDetail: "Manual upload (as needed)",
  },
  {
    countyId: "ferry",
    countyName: "Ferry County",
    baselineCoveragePct: 97,
    baselineSourceLabel: "Public Baseline (WA GeoPortal Parcels)",
    overlayStatus: "none",
    overlaySourceLabel: null,
    lastOverlayUpdateAt: null,
    updateLane: "C_zero_it_upload",
    updateLaneDetail: "Manual upload (as needed)",
  },
];
