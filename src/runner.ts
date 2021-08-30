import cliProgress from 'cli-progress';
import { AxiosInstance } from 'axios';
import { BigWaveCore } from './core';
import pThrottle from 'p-throttle';

type Scenario = (client: AxiosInstance) => Promise<void>;
type RunOption = {
  concurrency?: number;
  interval?: number;
  node?: number;
};

export const run = async (scenario: Scenario, opt?: RunOption) => {
  const concurrency = opt?.concurrency ?? 0; // 同時実行数
  const interval = opt?.interval ?? 0; // シナリオの実行間隔(ms)
  const node = opt?.node ?? 1; // シナリオ数

  // create a new progress bar instance and use shades_classic theme
  const progress = new cliProgress.SingleBar(
    {
      format: 'Progress {bar} | {percentage}% || {value}/{total} Scenarios || Duration {duration}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: false,
    },
    cliProgress.Presets.shades_classic,
  );
  // start the progress bar with a total value of node and start value of 0
  progress.start(node, 0);

  // TODO: Distribute Computing on AWS Lambda
  const bw = new BigWaveCore();
  const throttle = pThrottle({ limit: concurrency, interval });
  const throttled = throttle(async (index: number) => {
    progress.increment();
    return scenario(bw.create(index));
  });
  await Promise.allSettled([...new Array(node)].map((_, i) => throttled(i)));
  progress.stop();

  await bw.report();
};
