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
export function generateOutput(report: DiffReport, inputs: Inputs) {
  const tmplContent = loadFile(TMPL_FILE_PATH);
  const tmplVars = getTemplateVars(report, inputs);
  return template(tmplContent)(tmplVars);
}

/**
 * Create template variables
 */
export function getTemplateVars(
  report: DiffReport,
  inputs: Inputs
): TemplateVars {
  const hasDiffs = inputs.baseCoveragePath?.length > 0;
  const commitSha =
    inputs.context.payload.pull_request?.head?.sha || github.context.sha;
  const commitUrl = `${inputs.context.payload.repository?.html_url}/commits/${commitSha}`;

  const tmplVars: TemplateVars = {
    coverageFileFailurePercent: null,
    changed: [],
    unchanged: [],
    all: [],
    total: {
      lines: "0",
      diff: "0",
      percent: "0",
    },
    hasDiffs,
    title: inputs.title,
    customMessage: inputs.customMessage,
    commitSha,
    commitUrl,
    prIdentifier: PR_COMMENT_IDENTIFIER,

    renderFileSummary,
  };
  const { stripPathPrefix } = inputs;
  const failDelta =
    inputs.failDelta > 0 ? inputs.failDelta * -1 : inputs.failDelta;

  // Process all the file deltas
  let coverageFileFailurePercent = 0;
  Object.entries(report).forEach(([key, summary]) => {
    if (key === "total") {
      return;
    }

    // Strip path prefix and add to report
    let filepath = key;
    if (stripPathPrefix && filepath.indexOf(stripPathPrefix) === 0) {
      filepath = filepath.substring(stripPathPrefix.length);
    }

    let hasChange = false;
    const defaultNums: TemplateDiffSummaryValues = { percent: "0", diff: "0" };
    const tmplFileSummary: TemplateDiffSummary = {
      filepath,
      isNewFile: summary.isNewFile,
      lines: defaultNums,
      statements: defaultNums,
      functions: defaultNums,
      branches: defaultNums,
    };

    NUMBER_SUMMARY_KEYS.forEach((type) => {
      const value = summary[type].percent;
      const diff = summary[type].diff;
      tmplFileSummary[type].percent = decimalToString(value);
      tmplFileSummary[type].diff = decimalToString(diff);

      // Does this file coverage fall under the fail delta?
      if (diff < failDelta && diff < coverageFileFailurePercent) {
        coverageFileFailurePercent = diff;
      }

      // If the coverage changed by more than 0.1, add file to the changed bucket
      if (!hasChange && Math.abs(diff) >= MIN_CHANGE) {
        hasChange = true;
      }
    });

    // Add to file bucket
    const bucket = hasChange ? "changed" : "unchanged";
    tmplVars[bucket].push(tmplFileSummary);
    tmplVars.all.push(tmplFileSummary);
  });

  // Process totals
  if (report.total) {
    tmplVars.total = {
      lines: Number(report.total.lines.total).toLocaleString(),
      percent: decimalToString(report.total.lines.percent),
      diff: decimalToString(report.total.lines.diff),
    };
  }

  if (coverageFileFailurePercent !== 0) {
    tmplVars.coverageFileFailurePercent = decimalToString(
      Math.abs(coverageFileFailurePercent)
    );
  }

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
    name: "Test Coverage Report Summary",
    head_sha: head,
    status: "completed",
    conclusion: failed ? "failure" : "success",
    output: {
      summary: output,
    },
  });
}

/**
 * Create the markdown for a filepath row
 */
function renderFileSummary(file: TemplateDiffSummary) {
  const linePercent = Number(file.lines.percent);

  let status = ":red_circle:";
  if (linePercent > 80) {
    status = ":green_circle:";
  } else if (linePercent > 40) {
    status = ":yellow_circle:";
  }

  if (file.isNewFile) {
    status += ":new:";
  }

  const itemOutput = (item: TemplateDiffSummaryValues) => {
    let itemOut = `${item.percent}%`;
    if (item.diff !== "0") {
      itemOut += ` (${item.diff})`;
    }
    return itemOut;
  };

  return (
    `| ${status} ${file.filepath} ` +
    `| ${itemOutput(file.statements)} ` +
    `| ${itemOutput(file.branches)} ` +
    `| ${itemOutput(file.functions)} ` +
    `| ${itemOutput(file.lines)}`
  );
}
