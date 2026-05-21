const { runLiveSystemWatch } = require('./live-system-watch-runner');

runLiveSystemWatch()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    console.log('live system watch verified');
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
