const core = require('@actions/core');
const github = require("@actions/github");

async function run() {
  try {
    const currentSha = github.sha
    core.debug(currentSha)
    const githubToken = core.getInput("github_token")
    const octokit = github.getOctokit(githubToken)
    core.debug(JSON.stringify(github.context.payload, undefined, 2))
    const [owner, repo] = github.repository.split("/")
    const result = await octokit.rest.repos.listCommits({ owner, repo, sha: currentSha })
    core.debug(JSON.stringify(result, undefined, 2))
    core.setOutput('time', repo);
  } catch (error) {
    core.info({ error })
    core.setFailed(error.message);
  }
}

run();
