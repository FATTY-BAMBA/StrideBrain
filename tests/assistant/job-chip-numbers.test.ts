import { expect, it } from "vitest";
import { nearestJobs } from "@/modules/assistant/domain/job-chips";
// Identity-only sample fixture: scoring sees exactly the names and references, no records.
const jobs = [
  { projectKey: "PRJ-XINYI-026", names: ["Xinyi Flagship Renovation", "信義旗艦店裝修"] },
  { projectKey: "PRJ-NEIHU-021", names: ["Neihu Tech Flagship", "內湖科技旗艦店"] },
  { projectKey: "PRJ-BANQIAO-015", names: ["Banqiao Concept Store", "板橋概念店"] },
  { projectKey: "PRJ-ZHONGSHAN-018", names: ["Zhongshan Lifestyle Store", "中山生活概念店"] },
  { projectKey: "J-2611-R7K3", names: ["Riverside Display Studio", "河岸展示工作室"] },
  { projectKey: "PRJ-NANJING-023", names: ["Nanjing Brand Experience Center", "南京品牌體驗中心"] },
  { projectKey: "PRJ-DAAN-016", names: ["Daan Premium Showroom", "大安精品展示中心"] },
  { projectKey: "PRJ-SONGSHAN-020", names: ["Songshan Retail Renewal", "松山門市改裝"] },
  ...Array.from({ length: 18 }, (_, i) => ({
    projectKey: `PRJ-HIST-${String(i + 1).padStart(3, "0")}`,
    names: [
      `Completed Workplace Project ${String(i + 1).padStart(2, "0")}`,
      `已完工辦公專案${String(i + 1).padStart(2, "0")}`,
    ],
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    projectKey: `PRJ-ACTIVE-${String(i + 1).padStart(3, "0")}`,
    names: [
      `Active Design Project ${String(i + 1).padStart(2, "0")}`,
      `進行中設計專案${String(i + 1).padStart(2, "0")}`,
    ],
  })),
  { projectKey: "J-2611-A67", names: ["Acceptance Test Project 67", "驗收測試專案67"] },
  { projectKey: "J-2611-A73", names: ["Acceptance Test Project 73", "驗收測試專案73"] },
];
const x = "PRJ-XINYI-026",
  n = "PRJ-NEIHU-021",
  b = "PRJ-BANQIAO-015",
  z = "PRJ-ZHONGSHAN-018",
  r = "J-2611-R7K3";
it.each([
  ["Xinyi store", [x]],
  ["Neihu store", [n]],
  ["flagship", [n, x]],
  ["旗艦店", [n, x]],
  ["概念店", [b, z]],
  ["中山概念店", [z]],
  ["內湖旗艦店", [n]],
  ["信義店", [x]],
  ["河岸工作室", [r]],
  ["辦公專案05", ["PRJ-HIST-005"]],
  ["辦公專案5", ["PRJ-HIST-005"]],
  ["Workplace Project 5", ["PRJ-HIST-005"]],
  ["設計專案03", ["PRJ-ACTIVE-003"]],
  ["專案3", ["PRJ-ACTIVE-003", "PRJ-HIST-003"]],
  ["設計專案9", ["PRJ-ACTIVE-001", "PRJ-ACTIVE-002", "PRJ-ACTIVE-003"]],
  ["3樓的工作室", [r]],
] as const)("reviewed sample query %s", (query, expected) => {
  expect(nearestJobs(query, jobs, "zh-TW").map((j) => j.projectKey)).toEqual(expected);
});
it("keeps narrow readers' candidates limited to their own two jobs", () => {
  const reader = jobs.filter((j) => [x, r].includes(j.projectKey));
  for (const query of ["設計專案01", "Banqiao store"])
    expect(nearestJobs(query, reader, "zh-TW")).toEqual([]);
});
it("normalizes full-width digits and zeros without creating candidates or using embedded Latin digits", () => {
  expect(nearestJobs("辦公專案００５", jobs, "zh-TW").map((j) => j.projectKey)).toEqual([
    "PRJ-HIST-005",
  ]);
  expect(nearestJobs("5", jobs, "en")).toEqual([]);
  const sample = [
    { projectKey: "J-R7K3", names: ["North studio"] },
    { projectKey: "J-R8K4", names: ["South studio"] },
  ];
  expect(nearestJobs("Studio 3", sample, "en").map((j) => j.projectKey)).toEqual([
    "J-R7K3",
    "J-R8K4",
  ]);
  expect(
    nearestJobs(
      "Studio a5",
      [
        { projectKey: "A", names: ["North studio 5"] },
        { projectKey: "B", names: ["South studio 6"] },
      ],
      "en",
    ).map((j) => j.projectKey),
  ).toEqual(["A", "B"]);
});
it("applies number narrowing before the score cutoff and limit without changing scores", () => {
  const sample = [
    { projectKey: "A", names: ["Xinyi store 01"] },
    { projectKey: "B", names: ["Xinyi workshop 05"] },
  ];
  const baseline = nearestJobs("Xinyi store", sample, "en", 10);
  const numbered = nearestJobs("Xinyi store 5", sample, "en", 10);
  expect(numbered.map((j) => j.projectKey)).toEqual(["B"]);
  expect(numbered[0]!.score).toBe(1);
  expect(baseline[0]!.projectKey).toBe("A");
});
