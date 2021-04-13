const core = require('@actions/core');
const github = require("@actions/github");
const fetch = require('node-fetch');

async function run() {
  try {
    const response = await fetch(`https://api.trello.com/1/boards/AY19B6gE/cards?key=${core.getInput("trello_key")}&token=${core.getInput("trello_token")}&attachments=true`)
    const cards = await response.json()
    const filteredCards = cards.filter(card => card.attachments.some(attachment => attachment.url.includes("github.com")))
    core.info("filtering cards")
    core.info(JSON.stringify(filteredCards, undefined, 2))
    core.info(filteredCards.length)
    const currentSha = github.context.sha
    const githubToken = core.getInput("github_token")
    const octokit = github.getOctokit(githubToken)
    const owner = github.context.payload.repository.owner.name
    const repo = github.context.payload.repository.name
    const result = await octokit.rest.repos.listCommits({ owner, repo, sha: currentSha })
    core.info(JSON.stringify(result, undefined, 2))
    core.setOutput('time', result);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
