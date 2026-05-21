const { runLiveSystemWatch } = require('./live-system-watch-runner');

runLiveSystemWatch({ twice: true })
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    console.log('live system watch idempotency verified');
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
