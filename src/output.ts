import { template } from "lodash";
import path from "path";
import * as github from "@actions/github";

import { loadFile } from "./fileLoader";
import {
  Inputs,
  DiffReport,
  DiffSummary,
  TemplateDiffSummary,
  TemplateDiffSummaryValues,
  TemplateVars,
} from "./types";

type SummaryNumericKeys = Extract<
  keyof DiffSummary,
  "lines" | "statements" | "functions" | "branches"
>;

const NUMBER_SUMMARY_KEYS: SummaryNumericKeys[] = [
  "lines",
  "statements",
  "functions",
  "branches",
];

// The path to the template file
const TMPL_FILE_PATH = path.join(__dirname, "summary.md");

// The minimum coverage change for a file to be added to the changed group
const MIN_CHANGE = 0.1;

// A comment that identifies this comment to update later
const PR_COMMENT_IDENTIFIER = "<!-- test-coverage-reporter-output -->";

/**
 * Generate the coverage summary output
 */
export function generateOutput(
  report: DiffReport,
  failureMessage: string | null,
  inputs: Inputs
) {
  try {
    const tmplContent = loadFile(TMPL_FILE_PATH);
    const tmplVars = getTemplateVars(report, failureMessage, inputs);
    return template(tmplContent)(tmplVars);
  } catch (error) {
    throw new Error(`Template error: ${(error as Error).message}`);
  }
}

/**
 * Create template variables
 */
export function getTemplateVars(
  report: DiffReport,
  failureMessage: string | null,
  inputs: Inputs
): TemplateVars {
  const hasDiffs = inputs.baseCoveragePath?.length > 0;
  const commitSha =
    inputs.context.payload.pull_request?.head?.sha || github.context.sha;
  const commitUrl = `${inputs.context.payload.repository?.html_url}/commit/${commitSha}`;

  const tmplVars: TemplateVars = {
    failureMessage,
    failed: failureMessage !== null,
    changed: [],
    unchanged: [],
    all: [],
    total: {
      name: "total",
      lines: { percent: "0", diff: "0" },
      statements: { percent: "0", diff: "0" },
      functions: { percent: "0", diff: "0" },
      branches: { percent: "0", diff: "0" },
    },
    hasDiffs,
    title: inputs.title,
    customMessage: inputs.customMessage,
    commitSha,
    commitUrl,
    prIdentifier: PR_COMMENT_IDENTIFIER,

    renderFileSummary: renderFileSummaryFactory(inputs),
  };
  const { stripPathPrefix } = inputs;
  const failFileReduced =
    inputs.failFileReduced > 0
      ? inputs.failFileReduced * -1
      : inputs.failFileReduced;

  // Process all the file deltas
  let coverageFileFailurePercent = 0;
  Object.entries(report.sections).forEach(([key, summary]) => {
    // Strip path prefix and add to report
    let name = key;
    if (stripPathPrefix && name.indexOf(stripPathPrefix) === 0) {
      name = name.substring(stripPathPrefix.length);
    }

    let hasChange = false;
    const tmplFileSummary: TemplateDiffSummary = {
      name,
      isNewFile: summary.isNewFile,
      lines: { percent: "0", diff: "0" },
      statements: { percent: "0", diff: "0" },
      functions: { percent: "0", diff: "0" },
      branches: { percent: "0", diff: "0" },
    };

    NUMBER_SUMMARY_KEYS.forEach((type) => {
      const percent = summary[type].percent;
      const diff = summary[type].diff;
      tmplFileSummary[type].percent = decimalToString(percent);
      tmplFileSummary[type].diff = decimalToString(diff);

      // Does this file coverage fall under the fail delta?
      if (diff < failFileReduced && diff < coverageFileFailurePercent) {
        coverageFileFailurePercent = diff;
      }

      // If this is a new file or the coverage changed by more than 0.1, add file to the changed bucket
      const absDiff = Math.abs(diff);
      if (!hasChange && (summary.isNewFile || absDiff >= MIN_CHANGE)) {
        hasChange = true;
      }
    });

    // Add to file bucket
    if (key === "total") {
      tmplFileSummary.name = "Total";
      tmplVars.total = tmplFileSummary;
    } else {
      const bucket = hasChange ? "changed" : "unchanged";
      tmplVars[bucket].push(tmplFileSummary);
      tmplVars.all.push(tmplFileSummary);
    }
  });

  return tmplVars as TemplateVars;
}

/**
 * Format a decimal percent number to a string percent
 */
export function decimalToString(val: number): string {
  const multiplier = val < 0 ? -1 : 1;

  // Round to 1 decimal place
  // Convert to a positive number first so that rounding goes from 1.5 -> 2 (even if negative)
  val = Math.round(Math.abs(val) * 10) / 10;
  val *= multiplier;
  let valStr = val.toFixed(1);

  // Remove tailing zero
  valStr = valStr.replace(/\.0$/, "");

  return valStr;
}

/**
 * Add the output as a PR comment
 */
export async function createPRComment(output: string, inputs: Inputs) {
  const client = github.getOctokit(inputs.accessToken);
  const prNumber = github.context.issue.number;
  const commentPayload = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    body: output,
  };

  // Find the existing comment
  const existingCommentId = await findComment(inputs);
  if (existingCommentId) {
    await client.rest.issues.updateComment({
      ...commentPayload,
      comment_id: existingCommentId,
    });
  } else {
    await client.rest.issues.createComment({
      ...commentPayload,
      issue_number: prNumber,
    });
  }
}

/**
 * Find the output summary PR comment
 */
async function findComment(inputs: Inputs): Promise<number | null> {
  const client = github.getOctokit(inputs.accessToken);
  const prNumber = github.context.issue.number;

  const comments = await client.rest.issues.listComments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
  });

  for (const comment of comments.data) {
    if (comment.body && comment.body.startsWith(PR_COMMENT_IDENTIFIER)) {
      return comment.id;
    }
  }
  return null;
}

/**
 * Output the coverage report as a check summary
 */
export function createSummary(output: string, failed: boolean, inputs: Inputs) {
  const client = github.getOctokit(inputs.accessToken);
  const head =
    github.context.payload.pull_request?.head?.sha || github.context.sha;

  return client.rest.checks.create({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    name: "test-coverage",
    head_sha: head,
    status: "completed",
    conclusion: failed ? "failure" : "success",
    output: {
      title: "Test Coverage Report Summary",
      summary: output,
    },
  });
}

/**
 * Create the markdown for a filepath row
 */
function renderFileSummaryFactory(inputs: Inputs) {
  const hasDiffs = inputs.baseCoveragePath?.length > 0;
  return function renderFileSummary(summary: TemplateDiffSummary) {
    const linePercent = Number(summary.lines.percent);

    let status = ":red_circle:";
    if (linePercent > 80) {
      status = ":green_circle:";
    } else if (linePercent > 40) {
      status = ":yellow_circle:";
    }

    const formatText = (text: string) => {
      if (summary.name === "Total") {
        return `**${text}**`;
      }
      return text;
    };

    const itemOutput = (item: TemplateDiffSummaryValues) => {
      let itemOut = `${item.percent}%`;
      if (hasDiffs && item.diff !== "0") {
        itemOut += ` (${item.diff})`;
      }
      return formatText(itemOut);
    };

    return (
      `| ${status} ${formatText(summary.name)} ` +
      `| ${itemOutput(summary.statements)} ` +
      `| ${itemOutput(summary.branches)} ` +
      `| ${itemOutput(summary.functions)} ` +
      `| ${itemOutput(summary.lines)}`
    );
  };
}
