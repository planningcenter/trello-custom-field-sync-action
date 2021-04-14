const process = require('process');
const cp = require('child_process');
const path = require('path');

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_GITHUB_TOKEN'] = 'notreal';
  process.env['INPUT_TRELLO_KEY'] = 'updateme';
  process.env['INPUT_TRELLO_TOKEN'] = 'reallydontwantthistobereal';
  process.env['GITHUB_SHA'] = 'abcd'
  const ip = path.join(__dirname, 'index.js');
  console.log(cp.execSync(`node ${ip}`, {env: process.env}).toString());
})
