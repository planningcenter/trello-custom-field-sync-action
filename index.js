const core = require('@actions/core');
const github = require("@actions/github");
const fetch = require('node-fetch');

async function run() {
  try {
    const customFieldId = await getEnvironmentCustomFieldId()
    core.info(JSON.stringify(customFieldId, undefined, 2))
    const filteredCards = await getCardsWithPRAttachments()
    // core.info(JSON.stringify(filteredCards, undefined, 2))
    const { data: pullRequestsOnCurrentSha } = await getPullRequestsWithCurrentSha()

    filteredCards.forEach(async (card) => {
      const attachments = card.attachments.filter(isPullRequestAttachment)
      if (attachments.some(attachment => {
        const prId = attachment.url.split("/").pop()
        return pullRequestsOnCurrentSha.some(pr => pr.number === parseInt(prId, 10))
      })) {
        const result = await updateCustomFieldToStaging({ card, customFieldId })
        const json = await result.text()
        core.info(json)
      }
    })
    // core.info(JSON.stringify(result, undefined, 2))
    core.setOutput('time', filteredCards);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

async function getCardsWithPRAttachments() {
  const response = await fetch(`https://api.trello.com/1/boards/AY19B6gE/cards?key=${core.getInput("trello_key")}&token=${core.getInput("trello_token")}&attachments=true`)
  const cards = await response.json()
  return cards.filter(card => card.attachments.some(isPullRequestAttachment))
}

async function getEnvironmentCustomFieldId() {
  const response = await fetch(`https://api.trello.com/1/boards/AY19B6gE/customFields?key=${core.getInput("trello_key")}&token=${core.getInput("trello_token")}`)
  const customFields = await response.json()
  const environmentCustomField = customFields.find(({ name}) => name === "Environment")
  return environmentCustomField.id
}

async function updateCustomFieldToStaging({ card, customFieldId }) {
  core.info(`Putting: ${card.id}, ${customFieldId}`)
  return await fetch(`https://api.trello.com/1/cards/${card.id}/customField/${customFieldId}/item?key=${core.getInput("trello_key")}&token=${core.getInput("trello_token")}`, { method: "PUT", body: JSON.stringify({ value: { text: "Staging" }}) })
}

async function getPullRequestsWithCurrentSha() {
  const owner = github.context.payload.repository.owner.name
  const repo = github.context.payload.repository.name
  const currentSha = github.context.sha
  const githubToken = core.getInput("github_token")
  const octokit = github.getOctokit(githubToken)
  return await octokit.rest.repos.listPullRequestsAssociatedWithCommit({ owner, repo, commit_sha: currentSha })
}

// async function getCommitsOnCurrentSha() {
//   const owner = github.context.payload.repository.owner.name
//   const repo = github.context.payload.repository.name
//   const currentSha = github.context.sha
//   const githubToken = core.getInput("github_token")
//   const octokit = github.getOctokit(githubToken)
//   return await octokit.rest.repos.listCommits({ owner, repo, sha: currentSha })
// }

// async function getPullRequestForId(id) {
//   const owner = github.context.payload.repository.owner.name
//   const repo = github.context.payload.repository.name
//   const currentSha = github.context.sha
//   const githubToken = core.getInput("github_token")
//   const octokit = github.getOctokit(githubToken)
//   return await octokit.rest.repos.listCommits({ owner, repo, sha: currentSha })
// }

function isPullRequestAttachment(attachment) {
  const owner = github.context.payload.repository.owner.name
  const repo = github.context.payload.repository.name
  return attachment.url.includes(`github.com/${owner}/${repo}/pull`)
}
