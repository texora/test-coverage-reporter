import fs from "fs";
import { execSync } from "child_process";
import { CoverageSummary } from "./types";

/**
 * Return the contents of a file
 */
export function loadFile(filepath: string) {
  return fs.readFileSync(filepath).toString();
}

/**
 * Load JSON from a file
 */
function loadJSONFile(filepath: string): Promise<any> {
  try {
    return JSON.parse(loadFile(filepath));
  } catch (error) {
    throw new Error(
      `Could not load coverage file ${filepath}: ${String(error)}`
    );
  }
}

/**
 * Load the test coverage JSON.
 * If the JSON is not in summary format, convert it.
 */
export async function loadCoverageFile(filepath: string) {
  let coverage = (await loadJSONFile(filepath)) as CoverageSummary;

  // Coverage is not a summary report
  if (typeof coverage.total === "undefined") {
    coverage = await makeCoverageSummary(filepath);
  }

  // Still not a valid summary report
  if (typeof coverage.total === "undefined") {
    throw new Error("Cannot generate a summary report from the coverage file.");
  }

  return coverage;
}

/**
 * Convert coverage report from traditional istanbul format to summary
 */
async function makeCoverageSummary(
  fromFilepath: string
): Promise<CoverageSummary> {
  console.log("Converting coverage file to json-summary");

  const command = `npx istanbul report --include="${fromFilepath}" json-summary`;
  console.log(command);
  const stdout = execSync(command);
  console.log(stdout.toString());

  const json = await loadJSONFile("./coverage/coverage-summary.json");
  return json as CoverageSummary;
}
