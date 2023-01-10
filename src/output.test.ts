import "jest";
import type { Context } from "@actions/github/lib/context";

import { Inputs, CoverageDiff, DiffReport, DiffSummary } from "./types";
import { getTemplateVars, decimalToString } from "./output";

describe("output", () => {
  describe("getTemplateVars", () => {
    let inputs: Inputs;

    beforeEach(() => {
      inputs = {
        title: "test",
        accessToken: "",
        coveragePath: "coverage/report-final.json",
        baseCoveragePath: "base/coverage/report-final.json",
        customMessage: "",
        failFileReduced: 0.2,
        stripPathPrefix: "",
        context: {
          issue: {
            number: 123,
          },
          payload: {
            pull_request: {
              head: {
                sha: "1234567890",
              },
            },
            repository: {
              html_url: "https://github.com/jgillick/test-coverage-reporter",
            },
          },
        } as unknown as Context,
      };
    });

    const generateFileSummary = ({
      total,
      percent,
      diff,
      isPrFile,
      isNewFile = false,
    }: {
      total: number;
      percent: number;
      diff: number;
      isPrFile: boolean;
      isNewFile?: boolean;
    }): DiffSummary => {
      return {
        lines: { total, percent, diff },
        statements: { total: 1, percent: 2, diff: 0 },
        functions: { total: 3, percent: 4, diff: 0 },
        branches: { total: 5, percent: 6, diff: 0 },
        isNewFile,
        isPrFile,
      };
    };

    const generateReport = ({
      total = 0,
      percent = 0,
      diff = 0,
    }: {
      total?: number;
      percent?: number;
      diff?: number;
    } = {}): DiffReport => {
      const summary: CoverageDiff = {
        total,
        percent,
        diff,
      };
      return {
        biggestDiff: 0,
        sections: {
          total: {
            lines: {
              total: 1234,
              diff: -12.15,
              percent: 82.123,
            },
            statements: summary,
            functions: summary,
            branches: summary,
          },
        },
      };
    };

    test("get vars", () => {
      const report = generateReport({
        total: 100,
        percent: 85,
        diff: 2.34,
      });
      report.sections.file1 = generateFileSummary({
        total: 1000,
        percent: 82.1,
        diff: 3.45,
        isNewFile: false,
        isPrFile: true,
      });

      const vars = getTemplateVars(report, null, inputs);
      expect(vars).toEqual({
        changed: [
          {
            name: "file1",
            isNewFile: false,
            lines: { percent: "82.1", diff: "3.5" },
            statements: { percent: "2", diff: "0" },
            functions: { percent: "4", diff: "0" },
            branches: { percent: "6", diff: "0" },
          },
        ],
        all: [
          {
            name: "file1",
            isNewFile: false,
            lines: { percent: "82.1", diff: "3.5" },
            statements: { percent: "2", diff: "0" },
            functions: { percent: "4", diff: "0" },
            branches: { percent: "6", diff: "0" },
          },
        ],
        unchanged: [],
        total: {
          name: "Total",
          lines: { diff: "-12.2", percent: "82.1" },
          branches: { diff: "2.3", percent: "85" },
          functions: { diff: "2.3", percent: "85" },
          statements: { diff: "2.3", percent: "85" },
          isNewFile: undefined,
        },
        failed: false,
        hasDiffs: true,
        failureMessage: null,
        title: "test",
        customMessage: "",
        commitSha: "1234567890",
        commitUrl:
          "https://github.com/jgillick/test-coverage-reporter/commit/1234567890",
        prIdentifier: "<!-- test-coverage-reporter-output -->",
        renderFileSummaryTableHeader: expect.anything(),
        renderFileSummaryTableRow: expect.anything(),
      });
    });

    test("unchanged file and PR file", () => {
      const report = generateReport();
      report.sections.file1 = generateFileSummary({
        total: 100,
        percent: 85,
        diff: 0,
        isPrFile: true,
      });

      const vars = getTemplateVars(report, null, inputs);
      expect(vars.changed.length).toBe(0);
      expect(vars.unchanged.length).toBe(1);
    });

    test("changed file and PR file", () => {
      const report = generateReport();
      report.sections.file1 = generateFileSummary({
        total: 100,
        percent: 85,
        diff: 1,
        isPrFile: true,
      });

      const vars = getTemplateVars(report, null, inputs);
      expect(vars.changed.length).toBe(1);
      expect(vars.unchanged.length).toBe(0);
    });

    test("PR file with changed coverage", () => {
      const report = generateReport();
      report.sections.file1 = generateFileSummary({
        total: 100,
        percent: 85,
        diff: 1,
        isPrFile: false,
      });

      const vars = getTemplateVars(report, null, inputs);
      expect(vars.changed.length).toBe(0);
      expect(vars.unchanged.length).toBe(1);
    });

    test("new file", () => {
      const report = generateReport();
      report.sections.file1 = generateFileSummary({
        total: 100,
        percent: 85,
        diff: 0,
        isNewFile: true,
        isPrFile: true,
      });

      const vars = getTemplateVars(report, null, inputs);
      expect(vars.changed.length).toBe(1);
      expect(vars.unchanged.length).toBe(0);
    });

    test("file is not changed if diff is too low", () => {
      const report = generateReport();
      report.sections.file1 = generateFileSummary({
        total: 100,
        percent: 85,
        diff: 0.01,
        isPrFile: true,
      });

      const vars = getTemplateVars(report, null, inputs);
      expect(vars.changed.length).toBe(0);
      expect(vars.unchanged.length).toBe(1);
    });

    test("file is change even if diff is negative", () => {
      const report = generateReport();
      report.sections.file1 = generateFileSummary({
        total: 100,
        percent: 85,
        diff: -1,
        isPrFile: true,
      });

      const vars = getTemplateVars(report, null, inputs);
      expect(vars.changed.length).toBe(1);
      expect(vars.unchanged.length).toBe(0);
    });

    test("files also added to the all section", () => {
      const report = generateReport();
      report.sections.file1 = generateFileSummary({
        total: 100,
        percent: 85,
        diff: -1,
        isPrFile: true,
      });
      report.sections.file2 = generateFileSummary({
        total: 100,
        percent: 85,
        diff: 0,
        isPrFile: true,
      });

      const vars = getTemplateVars(report, null, inputs);
      expect(vars.changed.length).toBe(1);
      expect(vars.unchanged.length).toBe(1);
      expect(vars.all.length).toBe(2);
    });

    test("fail delta", () => {
      const report = generateReport();

      const vars = getTemplateVars(report, "Failure message", inputs);
      expect(vars.failed).toBe(true);
      expect(vars.failureMessage).toBe("Failure message");
    });
  });

  describe("decimalToString", () => {
    test("round to a single decimal place", () => {
      const val = decimalToString(1.151);
      expect(val).toBe("1.2");
    });

    test("strip trailing zero", () => {
      const val = decimalToString(1);
      expect(val).toBe("1");
    });

    test("include leading zero", () => {
      const val = decimalToString(0.1);
      expect(val).toBe("0.1");
    });

    test("rounding negative numbers", () => {
      const val = decimalToString(-1.15);
      expect(val).toBe("-1.2");
    });
  });
});
