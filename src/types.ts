import type { Context } from "@actions/github/lib/context";

export type Inputs = {
  coveragePath: string;
  baseCoveragePath: string;
  accessToken: string;
  failFileReduced: number;
  title: string;
  customMessage: string;
  stripPathPrefix: string;
  context: Context;
};

export type CoverageSummary = Record<string, CoverageSection>;

export type CoverageSection = {
  lines: CoverageTypeSummary;
  statements: CoverageTypeSummary;
  functions: CoverageTypeSummary;
  branches: CoverageTypeSummary;
  linesCovered?: Record<string, number>;
};

export type CoverageTypeSummary = {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
};

export type DiffReport = {
  biggestDiff: number;
  sections: Record<string, DiffSummary>;
};

export type DiffSummary = {
  lines: CoverageDiff;
  statements: CoverageDiff;
  functions: CoverageDiff;
  branches: CoverageDiff;
  isNewFile?: boolean;
};

export type CoverageDiff = {
  total: number;
  percent: number;
  diff: number;
};

export type TemplateVars = {
  title: string;
  customMessage: string;
  prIdentifier: string;
  commitSha: number;
  commitUrl: string;
  hasDiffs: boolean;

  failed: boolean;
  failureMessage: string | null;
  total: TemplateDiffSummary;
  changed: TemplateDiffSummary[];
  unchanged: TemplateDiffSummary[];
  all: TemplateDiffSummary[];

  renderFileSummaryTableHeader: Function;
  renderFileSummaryTableRow: Function;
};

export type TemplateDiffTotals = {
  lines: string;
  diff: string;
  percent: string;
};

export type TemplateDiffSummary = {
  name: string;
  lines: TemplateDiffSummaryValues;
  statements: TemplateDiffSummaryValues;
  functions: TemplateDiffSummaryValues;
  branches: TemplateDiffSummaryValues;
  isNewFile?: boolean;
};

export type TemplateDiffSummaryValues = {
  percent: string;
  diff: string;
};
