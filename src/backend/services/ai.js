const tf = require('@tensorflow/tfjs');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Manipulation detection, arbitrage, forecasting, dampener, Zakat
function runAIWorker(data, cb) {
  const worker = new Worker(__filename, { workerData: data });
  worker.on('message', (result) => cb(result));
}

if (!isMainThread && workerData) {
  (async () => {
    const model = await tf.loadLayersModel('model.json');
    const prediction = model.predict(tf.tensor([workerData])).dataSync()[0];
    let zakat = 0;
    if (workerData.profit) zakat = workerData.profit * 0.025;
    parentPort.postMessage({ prediction, zakat });
  })();
}

module.exports = { runAIWorker };
