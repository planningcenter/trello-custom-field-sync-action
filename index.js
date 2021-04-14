const core = require('@actions/core');
const github = require("@actions/github");
const fetch = require('node-fetch');

async function run() {
  try {
    const stagingCustomFieldItem = await getStagingCustomFieldItem()
    const filteredCards = await getCardsWithPRAttachments()
    const { data: pullRequestsOnCurrentSha } = await getPullRequestsWithCurrentSha()

    filteredCards.forEach(async (card) => {
      const attachments = card.attachments.filter(isPullRequestAttachment)
      if (attachments.some(attachment => {
        const prId = attachment.url.split("/").pop()
        return pullRequestsOnCurrentSha.some(pr => pr.number === parseInt(prId, 10))
      })) {
        await updateCustomFieldToStaging({ card, customFieldItem: stagingCustomFieldItem })
      }
    })
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

async function getEnvironmentCustomField() {
  const response = await fetch(`https://api.trello.com/1/boards/AY19B6gE/customFields?key=${core.getInput("trello_key")}&token=${core.getInput("trello_token")}`)
  const customFields = await response.json()
  return customFields.find(({ name}) => name === "Environment")
}

async function getStagingCustomFieldItem() {
  const customField = await getEnvironmentCustomField()
  return customField.options.find(option => option.value.text === "Staging")
}

async function updateCustomFieldToStaging({ card, customFieldItem,  }) {
  return await fetch(
    `https://api.trello.com/1/cards/${card.id}/customField/${customFieldItem.idCustomField}/item?key=${core.getInput("trello_key")}&token=${core.getInput("trello_token")}`,
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: `{ "idValue": "${customFieldItem.id}" }` })
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
