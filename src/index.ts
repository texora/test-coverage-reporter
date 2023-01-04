import { execSync } from "child_process";
import * as core from "@actions/core";
import * as github from "@actions/github";

import { Inputs } from "./types";
import { loadCoverageFile } from "./fileLoader";
import { generateDiffReport } from "./diff";
import {
  generateOutput,
  createPRComment,
  createSummary,
  decimalToString,
} from "./output";

/**
 * Get the action inputs
 */
function loadInputs(): Inputs {
  const pwd = execSync("pwd").toString().trim();

  return {
    accessToken: core.getInput("access-token", { required: true }),
    coveragePath: core.getInput("coverage-file", { required: true }),
    baseCoveragePath: core.getInput("base-coverage-file"),
    failFileReduced: Number(core.getInput("fail-file-reduced")),
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

    // Check for PR failure
    const failed = Math.abs(diff.biggestDiff) >= inputs.failFileReduced;
    const biggestDiff = decimalToString(Math.abs(diff.biggestDiff));
    const failureMessage = failed
      ? `The coverage is reduced by at least ${biggestDiff}% for one or more files.`
      : null;

    // Generate template
    console.log("Generating summary");
    const output = generateOutput(diff, failureMessage, inputs);

    // Outputs
    console.log("Output summary");
    await createSummary(output, failed, inputs);
    await createPRComment(output, inputs);

    if (failureMessage) {
      core.setFailed(failureMessage);
    }
  } catch (error) {
    console.error(error);
    core.setFailed(error as Error);
  }
}

main();
