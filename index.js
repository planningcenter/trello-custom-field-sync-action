const core = require('@actions/core');
const github = require("@actions/github");
const fetch = require('node-fetch');

async function run() {
  try {
    const currentSha = github.context.sha
    const githubToken = core.getInput("github_token")
    const octokit = github.getOctokit(githubToken)
    const response = await fetch(`https://api.trello.com/1/boards/AY19B6gE/cards?key=${core.getInput("trello_key")}&token=${core.getInput("trello_token")}&attachments=true`)
    const cards = await response.json().filter(card => card.attachments.some(attachment => attachment.url.include("github.com")))
    core.info(JSON.stringify(cards, undefined, 2))
    const owner = github.context.payload.repository.owner.name
    const repo = github.context.payload.repository.name
    const result = await octokit.rest.repos.listCommits({ owner, repo, sha: currentSha })
    core.info(JSON.stringify(result, undefined, 2))
    core.setOutput('time', JSON.stringify(result, undefined, 2));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
