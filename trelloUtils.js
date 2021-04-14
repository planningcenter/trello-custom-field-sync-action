
const core = require('@actions/core');
const fetch = require('node-fetch');

exports.trelloFetch = async function trelloFetch(path, options = {}) {
  const hasQuery = path.includes("?")
  const authQueryParamsConnector = hasQuery ? "&" : "?"
  const authQueryParams = `key=${core.getInput("trello_key")}&token=${core.getInput("trello_token")}`
  const url = `https://api.trello.com/1/${path}${authQueryParamsConnector}${authQueryParams}`
  return await fetch(url, options)
}
