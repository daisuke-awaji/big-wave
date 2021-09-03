import cliProgress, { SingleBar } from 'cli-progress';
import { AxiosInstance } from 'axios';
import { BigWaveCore, TestResult } from './core';
import pThrottle from 'p-throttle';
import * as _ from 'lodash';

type Scenario = (client: AxiosInstance) => Promise<void>;
type RunOption = {
  concurrency?: number;
  interval?: number;
  node: number;
};

const MAX_CONCURRENCY_PER_WORKER = 100;

export const run = async (scenario: Scenario, opt?: RunOption) => {
  const concurrency = opt?.concurrency ?? 0; // 同時実行数
  const interval = opt?.interval ?? 0; // シナリオの実行間隔(ms)
  const node = opt?.node ?? 1; // シナリオ配列

  const progress = new cliProgress.SingleBar(
    {
      format: 'Progress {bar} | {percentage}% || {value}/{total} Scenarios || Duration {duration}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: false,
    },
    cliProgress.Presets.shades_classic,
  );

  const workerCount = Math.floor(concurrency / MAX_CONCURRENCY_PER_WORKER) + 1;
  const chunkedNodes = _.chunk(
    [...new Array(node)].map((_, i) => i),
    Math.floor(node / workerCount),
  );
  console.log(chunkedNodes);

  progress.start(chunkedNodes.length, 0);

  const runWorkerPromises = chunkedNodes.map(async (nodes) => {
    const result = await runWorker(scenario, {
      interval: interval,
      nodes: nodes,
    });
    progress.increment();
    return result;
  });

  const result = await Promise.allSettled(runWorkerPromises);
  let allValues = result
    .filter((c) => c.status === 'fulfilled')
    .map((c) => <PromiseFulfilledResult<TestResult[]>>c)
    .map((c) => c.value)
    .flat();
  // let failedResults = result
  //   .filter((c) => c.status === 'rejected')
  //   .map((c) => <PromiseRejectedResult>c)
  //   .map((c) => c.reason);

  progress.stop();
  console.table(allValues);
  // console.log(result.map((d) => d.status));

  // TODO: Distribute Computing on AWS Lambda
  // const bw = new BigWaveCore();
  // const throttle = pThrottle({ limit: concurrency, interval });
  // const throttled = throttle(async (index: number) => {
  //   progress.increment();
  //   return scenario(bw.create(index));
  // });
  // await Promise.allSettled([...new Array(node)].map((_, i) => throttled(i)));
  // progress.stop();
  // console.log('...json stringify...');

  // console.log(JSON.stringify(result, null, 2));

  // await bw.report();
};

type RunWorkerOption = {
  interval: number;
  nodes: number[];
};

const runWorker = async (scenario: Scenario, opt: Required<RunWorkerOption>) => {
  const bw = new BigWaveCore();
  const { interval, nodes } = opt;
  const throttle = pThrottle({ limit: MAX_CONCURRENCY_PER_WORKER, interval });
  const throttled = throttle(async (node: number) => {
    return scenario(bw.create(node));
  });
  await Promise.allSettled(nodes.map((n) => throttled(n)));

  return bw.summary;
};
