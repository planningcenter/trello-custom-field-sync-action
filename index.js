const core = require("@actions/core")
const github = require("@actions/github")
const { trelloFetch } = require("./trelloUtils")

async function run() {
  try {
    const stagingCustomFieldItem = await getStagingCustomFieldItem()
    const filteredCards = await getCardsWithPRAttachments()
    const { data: pullRequestsOnCurrentSha } = await getPullRequestsWithCurrentSha()

    filteredCards.forEach(async (card) => {
      setCardCustomFieldValue({
        card,
        prs: pullRequestsOnCurrentSha,
        customFieldItem: stagingCustomFieldItem,
      })
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

async function getCardsWithPRAttachments() {
  const response = await trelloFetch(
    `boards/${core.getInput("trello_board_id")}/cards?attachments=true`,
  )
  const cards = await response.json()
  return cards.filter((card) => card.attachments.some(isPullRequestAttachment))
}

async function getEnvironmentCustomField() {
  const response = await trelloFetch(`boards/${core.getInput("trello_board_id")}/customFields`)
  const customFields = await response.json()
  return customFields.find(({ name }) => name === core.getInput("trello_custom_field_name"))
}

async function getStagingCustomFieldItem() {
  const customField = await getEnvironmentCustomField()
  return customField.options.find(
    (option) => Object.values(option.value)[0] === core.getInput("trello_custom_field_value"),
  )
}

async function setCardCustomFieldValue({ card, prs, customFieldItem }) {
  const attachments = card.attachments.filter(isPullRequestAttachment)
  const attachmentIsAMatchedPR = attachments.some((attachment) => {
    const prId = parseInt(attachment.url.split("/").pop(), 10)
    return prs.some((pr) => pr.number === prId)
  })
  const body = attachmentIsAMatchedPR ? { idValue: customFieldItem.id } : { idValue: "", value: "" }

  return await updateCustomFieldToStaging({ card, customFieldItem, body })
}

async function updateCustomFieldToStaging({ card, customFieldItem, body }) {
  return await trelloFetch(`cards/${card.id}/customField/${customFieldItem.idCustomField}/item`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function getPullRequestsWithCurrentSha() {
  const owner = github.context.payload.repository.owner.name
  const repo = github.context.payload.repository.name
  const currentSha = github.context.sha
  const githubToken = core.getInput("github_token")
  const octokit = github.getOctokit(githubToken)
  return await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    commit_sha: currentSha,
  })
}

function isPullRequestAttachment(attachment) {
  const owner = github.context.payload.repository.owner.name
  const repo = github.context.payload.repository.name
  return attachment.url.includes(`github.com/${owner}/${repo}/pull`)
}
