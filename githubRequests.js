const core = require("@actions/core")
const github = require("@actions/github")

exports.getHeadCommitShaForPR = async function getHeadCommitShaForPR(id) {
  const owner = github.context.repo.owner
  const repo = github.context.repo.repo
  const {
    data: {
      head: { sha },
    },
  } = await getOctokit().request(`GET /repos/${owner}/${repo}/pulls/${id}`)
  return sha
}

exports.getCommitsFromMaster = async function (options = {}) {
  const owner = github.context.repo.owner
  const repo = github.context.repo.repo
  const currentSha = github.context.sha
  const basehead = `master...${currentSha}`
  const { data } = await getOctokit().request(
    `GET /repos/${owner}/${repo}/compare/${basehead}`,
    options,
  )
  return data
}

function getOctokit() {
  const githubToken = core.getInput("github_token")
  return github.getOctokit(githubToken)
}
