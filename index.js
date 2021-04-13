const core = require('@actions/core');
const github = require("@actions/github");

// most @actions toolkit packages have async methods
async function run() {
  try {
    core.info(JSON.stringify(github.context.payload, undefined, 2))
    core.setOutput('time', new Date().toTimeString());
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
