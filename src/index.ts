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
    accessToken: core.getInput("access-token", { required: true }),
    coveragePath: core.getInput("coverage-file", { required: true }),
    baseCoveragePath: core.getInput("base-coverage-file"),
    failDelta: Number(core.getInput("fail-delta")),
    title: core.getInput("title"),
    customMessage: core.getInput("custom-message"),
    stripPathPrefix: core.getInput("strip-path-prefix") || pwd,
    context: github.context,
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
    console.log("Loading coverage files");
    const coverage = await loadCoverageFile(inputs.coveragePath);
    let baseCoverage = {};
    if (inputs.baseCoveragePath?.length) {
      baseCoverage = await loadCoverageFile(inputs.baseCoveragePath);
    }

    // Generate diff report
    console.log("Generating diff report");
    const diff = generateDiffReport(coverage, baseCoverage, inputs);
    const failed = diff.coverageFileFailurePercent !== null;

    // Generate template
    console.log("Generating summary");
    const output = generateOutput(diff, inputs);

    // Outputs
    console.log("Output");
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
