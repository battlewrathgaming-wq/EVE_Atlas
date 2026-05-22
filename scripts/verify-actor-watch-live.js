const { runLiveActorWatch } = require('./live-actor-watch-runner');

runLiveActorWatch()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    console.log('live actor watch verified');
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
