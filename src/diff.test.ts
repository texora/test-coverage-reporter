import "jest";
import type { Context } from "@actions/github/lib/context";

import { Inputs, CoverageSummary, CoverageTypeSummary } from "./types";
import { generateDiffReport } from "./diff";
import PRFiles from "./PRFiles";

describe("diff", () => {
  let inputs: Inputs;
  let prFiles: PRFiles;

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
      } as Context,
    };

    prFiles = new PRFiles(inputs);
    jest.spyOn(prFiles, "inPR").mockReturnValue(true);
  });

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

      const diff = generateDiffReport(targetCoverage, {}, prFiles, inputs);
      expect(diff.sections["file1"].isNewFile).toBe(true);
      expect(diff.sections["file1"].lines.diff).toBe(0);
      expect(diff.sections["file1"].statements.diff).toBe(0);
      expect(diff.sections["file1"].functions.diff).toBe(0);
      expect(diff.sections["file1"].branches.diff).toBe(0);
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
      const diff = generateDiffReport(
        targetCoverage,
        baseCoverage,
        prFiles,
        inputs
      );
      expect(diff.sections["file1"].isNewFile).toBe(false);
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

      const diff = generateDiffReport(
        targetCoverage,
        baseCoverage,
        prFiles,
        inputs
      );
      expect(diff.sections["file1"].lines.percent).toBe(100);
      expect(diff.sections["file1"].lines.diff).toBe(15);
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

      const diff = generateDiffReport(
        targetCoverage,
        baseCoverage,
        prFiles,
        inputs
      );
      expect(diff.sections["file1"].lines.percent).toBe(85);
      expect(diff.sections["file1"].lines.diff).toBe(-15);
    });

    test("filter out non-PR files", () => {
      jest
        .spyOn(prFiles, "inPR")
        .mockImplementation((path: string) => path === "file1");

      const baseCoverage = createFileCoverage({
        file: "file1",
        total: 10,
        percent: 100,
      });
      const targetCoverage = {
        ...createFileCoverage({
          file: "file1",
          total: 10,
          percent: 85,
        }),
        ...createFileCoverage({
          file: "file2",
          total: 10,
          percent: 85,
        }),
      };

      const diff = generateDiffReport(
        targetCoverage,
        baseCoverage,
        prFiles,
        inputs
      );
      expect(diff.sections["file1"]).toBeDefined();
      expect(diff.sections["file2"]).not.toBeDefined();
    });
  });
});
