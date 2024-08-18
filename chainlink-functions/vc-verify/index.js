const { simulateScript } = require('@chainlink/functions-toolkit');
const fs = require('fs');

console.log('Starting simulation');
simulateScript({
  source: fs.readFileSync('./function.js', 'utf-8'),
  maxExecutionTimeMs: 10_000,
  numAllowedQueries: 1000,
})
  .then((r) => {
    console.log(r);
  })
  .catch((er) => {
    console.error(er);
  });
