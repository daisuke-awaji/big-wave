import cliProgress, { SingleBar } from "cli-progress";
import { AxiosInstance } from "axios";
import { BigWaveCore, TestResult } from "./core";
import pThrottle from "p-throttle";
import * as _ from "lodash";
import { v4 as uuidv4 } from "uuid";

type Scenario = (client: AxiosInstance) => Promise<void>;
type RunOption = {
  concurrency?: number;
  interval?: number;
  node: number;
};

const MAX_CONCURRENCY_PER_WORKER = 100;

export const run = async (scenario: Scenario, opt?: RunOption) => {
  const concurrency = opt?.concurrency ?? 0; // run scenario concurrency
  const interval = opt?.interval ?? 0; // run scenario interval (ms)
  const node = opt?.node ?? 1; // scenario count

  const progress = new cliProgress.SingleBar(
    {
      format: "Progress {bar} | {percentage}% || {value}/{total} Workers || Duration {duration}s",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: false,
    },
    cliProgress.Presets.shades_classic
  );

  const workerCount = Math.floor(concurrency / MAX_CONCURRENCY_PER_WORKER) + 1;
  const chunkedNodes = _.chunk(
    [...new Array(node)].map((_, i) => i),
    Math.floor(node / workerCount)
  );

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
  const allValues = result
    .filter((c) => c.status === "fulfilled")
    .map((c) => <PromiseFulfilledResult<TestResult[]>>c)
    .map((c) => c.value)
    .flat();
  // let failedResults = result
  //   .filter((c) => c.status === 'rejected')
  //   .map((c) => <PromiseRejectedResult>c)
  //   .map((c) => c.reason);

  progress.stop();
  console.table(_.sortBy(allValues, "node"));
};

type RunWorkerOption = {
  interval: number;
  nodes: number[];
};

// TODO: Distribute Computing on AWS Lambda
const runWorker = async (scenario: Scenario, opt: Required<RunWorkerOption>) => {
  const id = uuidv4();
  const bw = new BigWaveCore(id);
  const { interval, nodes } = opt;
  const throttle = pThrottle({ limit: MAX_CONCURRENCY_PER_WORKER, interval });
  const throttled = throttle(async (node: number) => {
    return scenario(bw.create(node));
  });
  await Promise.allSettled(nodes.map((n) => throttled(n)));

  return bw.summary;
};
