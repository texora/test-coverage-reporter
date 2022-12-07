import "jest";
import { CoverageSummary, CoverageTypeSummary } from "./types";
import { generateDiffReport } from "./diff";

describe("diff", () => {
  describe("generateDiffReport", () => {
    const createFileCoverage = ({
      file,
      total,
      percent,
    }: {
      file: string;
      total: number;
      percent: number;
    }): CoverageSummary => {
      const summary: CoverageTypeSummary = {
        total,
        pct: percent,
        covered: 0,
        skipped: 0,
      };
      return {
        [file]: {
          lines: summary,
          statements: summary,
          functions: summary,
          branches: summary,
          linesCovered: {},
        },
      };
    };

    test("is new file", () => {
      const targetCoverage = createFileCoverage({
        file: "file1",
        total: 10,
        percent: 100,
      });

      const diff = generateDiffReport(targetCoverage, {});
      expect(diff["file1"].isNewFile).toBe(true);
    });

    test("not new file", () => {
      const baseCoverage = createFileCoverage({
        file: "file1",
        total: 10,
        percent: 85,
      });
      const targetCoverage = createFileCoverage({
        file: "file1",
        total: 10,
        percent: 100,
      });
      const diff = generateDiffReport(targetCoverage, baseCoverage);
      expect(diff["file1"].isNewFile).toBe(false);
    });

    test("has more test coverage", () => {
      const baseCoverage = createFileCoverage({
        file: "file1",
        total: 10,
        percent: 85,
      });
      const targetCoverage = createFileCoverage({
        file: "file1",
        total: 10,
        percent: 100,
      });

      const diff = generateDiffReport(targetCoverage, baseCoverage);
      expect(diff["file1"].lines.percent).toBe(100);
      expect(diff["file1"].lines.diff).toBe(15);
    });

    test("has less test coverage", () => {
      const baseCoverage = createFileCoverage({
        file: "file1",
        total: 10,
        percent: 100,
      });
      const targetCoverage = createFileCoverage({
        file: "file1",
        total: 10,
        percent: 85,
      });

      const diff = generateDiffReport(targetCoverage, baseCoverage);
      expect(diff["file1"].lines.percent).toBe(85);
      expect(diff["file1"].lines.diff).toBe(-15);
    });
  });
});
