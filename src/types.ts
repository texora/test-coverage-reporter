import type { Context } from "@actions/github/lib/context";

export type Inputs = {
  coveragePath: string;
  baseCoveragePath: string;
  accessToken: string;
  failDelta: number;
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

export type DiffReport = Record<string, DiffSummary>;

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
  prNumber: number;

  coverageFileFailurePercent: string | null;
  total: TemplateDiffTotals;
  changed: TemplateDiffSummary[];
  unchanged: TemplateDiffSummary[];

  renderFileSummary: Function;
};

export type TemplateDiffTotals = {
  lines: string;
  diff: string;
  percent: string;
};

export type TemplateDiffSummary = {
  filepath: string;
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
