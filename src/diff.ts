import {
  Inputs,
  DiffReport,
  CoverageSummary,
  CoverageSection,
  CoverageDiff,
} from "./types";

/**
 * Generate a diff summary of two coverage files.
 */
export function generateDiffReport(
  coverage: CoverageSummary,
  baseCoverage: CoverageSummary,
  inputs: Inputs
): DiffReport {
  const diffReport: DiffReport = {};
  const hasBaseCoverage = inputs.baseCoveragePath?.length > 0;

  // Generate diff for each file
  Object.keys(coverage).map((key) => {
    const target = coverage[key] || {};
    const base = baseCoverage[key] || {};
    const isNewFile =
      hasBaseCoverage &&
      key !== "total" &&
      typeof target.lines !== "undefined" &&
      typeof base.lines === "undefined";

    // Generate delta
    diffReport[key] = {
      isNewFile,
      lines: generateDiff("lines", target, base),
      statements: generateDiff("statements", target, base),
      functions: generateDiff("functions", target, base),
      branches: generateDiff("branches", target, base),
    };
  });

  return diffReport;
}

/**
 * Generate the diff object for a summary item type
 */
function generateDiff(
  type: keyof CoverageSection,
  target: CoverageSection,
  base: CoverageSection
): CoverageDiff {
  const targetVal = getVal(target, type);
  const baseVal = getVal(base, type);

  return {
    percent: targetVal,
    diff: targetVal - baseVal,
    total: target[type]?.total || 0,
  };
}

/**
 * Return the percent value from a summary section type
 */
function getVal(section: CoverageSection, type: keyof CoverageSection): number {
  const summary = section[type];
  if (typeof summary === "object" && typeof summary.pct === "number") {
    return summary.pct;
  }
  return 0;
}
