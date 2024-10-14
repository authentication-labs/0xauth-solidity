const { simulateScript } = require('@chainlink/functions-toolkit');
const { randomBytes } = require('crypto');
const fs = require('fs');

simulateScript({
  source: fs.readFileSync('./function.js', 'utf-8'),
  maxExecutionTimeMs: 30_000,
  numAllowedQueries: 1000,
  maxMemoryUsageMb: 10000,
  maxQueryResponseBytes: 1000000,
  maxQueryDurationMs: 10_000,
  maxQueryRequestBytes: 1000000,
  maxQueryUrlLength: 100000,
  args: [
    `0x76c01dE889D46F9644A96C47E0a25C8e7Dc31A5c`,
    Buffer.from(randomBytes(8)).toString('base64url'),
  ],
})
  .then((r) => {
    console.log(r);
  })
  .catch((er) => {
    console.error(er);
  });
