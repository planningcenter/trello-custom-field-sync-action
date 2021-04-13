const core = require('@actions/core');
const github = require("@actions/github");

async function run() {
  try {
    const currentSha = github.sha
    const githubToken = core.getInput("github_token")
    const octokit = github.getOctokit(githubToken)
    core.debug({ payload: github.context.payload })
    const result = await octokit.commits.commits(github.repository, { sha: currentSha })
    core.debug({ result: JSON.stringify(result, undefined, 2) })
    core.setOutput('time', result);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
