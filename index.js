const core = require("@actions/core")
const github = require("@actions/github")
const { trelloFetch } = require("./trelloUtils")

async function run() {
  try {
    const commits = await findCommitsFromShaToMaster()
    const stagingCustomFieldItem = await getStagingCustomFieldItem()
    const filteredCards = await getCardsWithPRAttachments()
    filteredCards.forEach(async (card) => {
      setCardCustomFieldValue({
        card,
        commits,
        customFieldItem: stagingCustomFieldItem,
      })
    })
  } catch (error) {
    log("FAILED: " + error.message)
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

async function setCardCustomFieldValue({ card, commits, customFieldItem }) {
  const attachments = card.attachments.filter(isPullRequestAttachment)
  const attachment = attachments[0] // TODO: support multiple PR attachments
  const prId = attachment.url.split("/").pop()
  const headCommitSha = await getHeadCommitForPR(prId)
  const attachmentIsAMatchedPR = commits.some((commit) => commit.sha === headCommitSha)
  const body = attachmentIsAMatchedPR ? { idValue: customFieldItem.id } : { idValue: "", value: "" }

  if (!attachmentIsAMatchedPR && core.getInput("add_only")) return
  log(`syncing card: ${card.name}`)

  const customFieldItemsResponse = await trelloFetch(`cards/${card.id}/customFieldItems`)
  const customFieldItems = await customFieldItemsResponse.json()
  const alreadyHasEnvironmentSet = customFieldItems.some(
    ({ idCustomField }) => customFieldItem.idCustomField === idCustomField,
  )
  if (alreadyHasEnvironmentSet) {
    log("already set")
    return
  }
  log(attachmentIsAMatchedPR ? "adding" : "removing")
  return await updateCustomFieldToStaging({ card, customFieldItem, body })
}

async function updateCustomFieldToStaging({ card, customFieldItem, body }) {
  return await trelloFetch(`cards/${card.id}/customField/${customFieldItem.idCustomField}/item`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function findCommitsFromShaToMaster() {
  const owner = github.context.payload.repository.owner.name
  const repo = github.context.payload.repository.name
  const currentSha = github.context.sha
  const basehead = `master...${currentSha}`
  const {
    data: { commits, total_commits },
  } = await getOctokit().request(`GET /repos/${owner}/${repo}/compare/${basehead}`)
  let allCommits = commits
  const extraPagesCount = Math.min(Math.floor(total_commits / 250), 5) // let's cap at 1500 commits
  for (let index = 0; index < extraPagesCount; index++) {
    const page = index + 2 // we already loaded page 1
    const {
      data: { commits: pageCommits },
    } = await getOctokit().request(`GET /repos/${owner}/${repo}/compare/${basehead}`, { page })

    allCommits = [...allCommits, ...pageCommits]
  }

  return allCommits
}

// async function getPullRequestsWithCurrentSha() {
//   const owner = github.context.payload.repository.owner.name
//   const repo = github.context.payload.repository.name
//   const currentSha = github.context.sha
//   return await getOctokit().rest.repos.listPullRequestsAssociatedWithCommit({
//     owner,
//     repo,
//     commit_sha: currentSha,
//   })
// }

async function getHeadCommitForPR(id) {
  const owner = github.context.payload.repository.owner.name
  const repo = github.context.payload.repository.name
  const {
    data: {
      head: { sha },
    },
  } = await getOctokit().request(`GET /repos/${owner}/${repo}/pulls/${id}`)
  return sha
}

function getOctokit() {
  const githubToken = core.getInput("github_token")
  return github.getOctokit(githubToken)
}

function isPullRequestAttachment(attachment) {
  const owner = github.context.payload.repository.owner.name
  const repo = github.context.payload.repository.name
  return attachment.url.includes(`github.com/${owner}/${repo}/pull`)
}

function log(toLog) {
  if (typeof toLog === "object") {
    core.info(JSON.stringify(toLog, undefined, 2))
  } else {
    core.info(toLog)
  }
}
