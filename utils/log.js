const core = require("@actions/core")

exports.log = function log(toLog) {
  if (typeof toLog === "object") {
    core.info(JSON.stringify(toLog, undefined, 2))
  } else {
    core.info(toLog)
  }
}
