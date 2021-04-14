const core = require("@actions/core")
const fetch = require("node-fetch")

exports.getCards = async function getCards() {
  return await trelloFetch(`boards/${core.getInput("trello_board_id")}/cards?attachments=true`)
}

exports.getCustomField = async function getCustomField() {
  const customFields = await trelloFetch(`boards/${core.getInput("trello_board_id")}/customFields`)
  return customFields.find(({ name }) => name === core.getInput("trello_custom_field_name"))
}

exports.getCardCustomItemFields = async function getCardCustomItemFields(card) {
  return await trelloFetch(`cards/${card.id}/customFieldItems`)
}

exports.updateCustomField = async function updateCustomField({ card, customFieldItem, body }) {
  return await trelloFetch(`cards/${card.id}/customField/${customFieldItem.idCustomField}/item`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function trelloFetch(path, options = {}) {
  const hasQuery = path.includes("?")
  const authQueryParamsConnector = hasQuery ? "&" : "?"
  const authQueryParams = `key=${core.getInput("trello_key")}&token=${core.getInput(
    "trello_token",
  )}`
  const url = `https://api.trello.com/1/${path}${authQueryParamsConnector}${authQueryParams}`
  const response = await fetch(url, options)
  return response.json()
}
