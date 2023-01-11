import "jest";
import type { Context } from "@actions/github/lib/context";

import { CoverageSummary } from "./types";
import PRFiles from "./PRFiles";
import * as github from "@actions/github";

type OctoKit = ReturnType<typeof github.getOctokit>;

describe("PRFiles", () => {
  let prFiles: PRFiles;

  beforeEach(() => {
    const inputs = {
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
        repo: {
          repo: "",
          owner: "",
        },
        payload: {
          pull_request: {
            number: 5,
          },
          repository: {
            html_url: "https://github.com/jgillick/test-coverage-reporter",
          },
        },
      } as unknown as Context,
    };
    prFiles = new PRFiles(inputs);
  });

  describe("fetchPRFiles", () => {
    beforeEach(() => {
      jest.spyOn(github, "getOctokit").mockReturnValue({
        paginate: jest.fn(() =>
          Promise.resolve([
            { filename: "/z" },
            { filename: "/a/b/c" },
            { filename: "/abcdefg/hijklmn" },
            { filename: "/c/d/e/f/g" },
            { filename: "/x/y" },
          ])
        ) as unknown as OctoKit,
      } as unknown as OctoKit);
    });

    test("sort files list by path depth", async () => {
      await prFiles.fetchPRFiles();
      expect(prFiles.files).toEqual([
        "/z",
        "/abcdefg/hijklmn",
        "/x/y",
        "/a/b/c",
        "/c/d/e/f/g",
      ]);
    });
  });

  describe("loadCoverage", () => {
    test("find common prefix", async () => {
      const prefix = "/x/y/z";
      const coverage = {
        total: {},
        [`${prefix}/a`]: {},
        [`${prefix}/b/c/d`]: {},
        [`${prefix}/b/c/d/e/f`]: {},
        [`${prefix}/m/n/o/p/q/r`]: {},
      } as unknown as CoverageSummary;

      prFiles.files = ["/a", "/b/c/d", "/b/c/d/e/f"];

      await prFiles.loadCoverage(coverage);
      expect(prFiles.pathPrefix).toBe("/x/y/z");
    });

    test("is in PR", async () => {
      prFiles.pathPrefix = "/x/y/z";
      prFiles.files = ["/a", "/b/c/d", "/b/c/d/e/f"];

      expect(prFiles.inPR("/x/y/z/b/c/d")).toBe(true);
      expect(prFiles.inPR("/x/y/z/b")).toBe(false);
    });
  });

  describe("fileUrl", () => {
    beforeEach(async () => {
      jest.spyOn(github, "getOctokit").mockReturnValue({
        paginate: jest.fn(() =>
          Promise.resolve([
            { filename: "/z" },
            { filename: "/a/b/c" },
            { filename: "/abcdefg/hijklmn" },
            { filename: "/c/d/e/f/g" },
            { filename: "/x/y" },
          ])
        ) as unknown as OctoKit,
      } as unknown as OctoKit);

      await prFiles.fetchPRFiles();
    });

    test("get file URL", async () => {
      prFiles.pathPrefix = "/x";
      const url = prFiles.fileUrl("/x/a/b/c");
      expect(url).toBe(
        "https://github.com/jgillick/test-coverage-reporter/pull/5/files#diff-42146b29e39fde22717ef69b5b3d8205802517fa2f0c55ea1d6730861b908578"
      );
    });
  });
});
