const core = require('@actions/core');
const github = require("@actions/github");

async function run() {
  try {
    const currentSha = github.sha
    const githubToken = core.getInput("github_token")
    const octokit = github.getOctokit(githubToken)
    const result = await octokit.commits(github.repository, { sha: currentSha })
    core.info(JSON.stringify(result, undefined, 2))
    core.setOutput('time', result);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
