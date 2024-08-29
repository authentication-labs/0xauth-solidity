const { simulateScript } = require('@chainlink/functions-toolkit');
const { randomBytes } = require('crypto');
const fs = require('fs');

simulateScript({
  source: fs.readFileSync('./function.js', 'utf-8'),
  maxExecutionTimeMs: 20_000,
  numAllowedQueries: 1000,
  maxMemoryUsageMb: 10000,
  maxQueryResponseBytes: 1000000,
  args: [Buffer.from(randomBytes(8)).toString('base64url')],
})
  .then((r) => {
    console.log(r);
  })
  .catch((er) => {
    console.error(er);
  });
