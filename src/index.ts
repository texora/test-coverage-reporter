import { execSync } from "child_process";
import * as core from "@actions/core";
import * as github from "@actions/github";

import { Inputs } from "./types";
import { loadCoverageFile } from "./fileLoader";
import { generateDiffReport } from "./diff";
import { generateOutput, createPRComment, createSummary } from "./output";

/**
 * Get the action inputs
 */
function loadInputs(): Inputs {
  const pwd = execSync("pwd").toString().trim();

  return {
    accessToken: core.getInput("access-token"),
    coveragePath: core.getInput("coverage-file"),
    baseCoveragePath: core.getInput("base-coverage-file"),
    failDelta: Number(core.getInput("fail-delta")),
    title: core.getInput("title"),
    customMessage: core.getInput("custom-message"),
    stripPathPrefix: core.getInput("strip-path-prefix") || pwd,
  };
}

/**
 * The entrypoint for the program
 */
export async function main() {
  try {
    const inputs = loadInputs();

    console.log(github.context);

    // Get coverage
    const [coverage, baseCoverage] = await Promise.all([
      loadCoverageFile(inputs.coveragePath),
      loadCoverageFile(inputs.baseCoveragePath),
    ]);

    // Generate diff report
    const diff = generateDiffReport(coverage, baseCoverage, inputs);
    const failed = diff.coverageFileFailurePercent !== null;

    // Generate template
    const output = generateOutput(diff, inputs);

    // Outputs
    await createSummary(output, failed, inputs);
    await createPRComment(output, inputs);

    if (failed) {
      core.setFailed(
        `The coverage is reduced by at least ${diff.coverageFileFailurePercent}% for one or more files.`
      );
    }
  } catch (error) {
    console.error(error);
    core.setFailed(error as Error);
  }
}

main();
