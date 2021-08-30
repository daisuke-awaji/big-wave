import axios, { AxiosInstance } from 'axios';
import pThrottle from 'p-throttle';
import _ from 'lodash';

declare module 'axios' {
  export interface AxiosRequestConfig {
    requestId?: string;
    timestamp?: number;
    node?: number;
  }
  export interface AxiosResponse {
    responseTime?: number;
  }
  export interface AxiosInstance {
    summary: TestResult[];
  }
}

type TestResult = {
  status?: number;
  url?: string;
  method?: string;
  sentAt?: number;
  responseTime?: number;
  node: number;
  error?: any;
};

export class BigWaveCore {
  public summary: TestResult[] = [];
  public create = (node: number) => {
    const client = axios.create({ node });
    client.summary = [];

    // timestamp
    client.interceptors.request.use((config) => {
      config.timestamp = Date.now();
      return config;
    });
    // response time
    client.interceptors.response.use((response) => {
      response.responseTime = Date.now() - response.config.timestamp!;
      return response;
    });

    // test summary
    client.interceptors.response.use(
      (response) => {
        this.summary.push({
          status: response.status,
          url: response.config.url,
          method: response.config.method,
          sentAt: response.config.timestamp!,
          responseTime: response.responseTime!,
          node: response.config.node!,
        } as any);
        return response;
      },
      (error) => {
        console.log(error);
        if (axios.isAxiosError(error)) {
          this.summary.push({
            status: error?.response?.status,
            url: error?.response?.config.url,
            method: error?.response?.config.method,
            sentAt: error.config.timestamp!,
            responseTime: error?.response?.responseTime!,
            node: error.config.node!,
            error: error,
          });
        }
      },
    );

    return client;
  };
}

export const wait = (sec: number) => new Promise((resolve) => setTimeout(resolve, sec));

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

  const bw = new BigWaveCore();
  const throttle = pThrottle({ limit: concurrency, interval });
  const throttled = throttle((index: number) => scenario(bw.create(index)));
  await Promise.allSettled([...new Array(node)].map((_, i) => throttled(i)));

  return bw.summary;
};

const main = async () => {
  const scenario = async (client: AxiosInstance) => {
    await client({
      method: 'get',
      url: 'https://test.k6.io/',
    });
    await client({
      method: 'get',
      url: 'https://test.k6.io/',
    });
    await client({
      method: 'get',
      url: 'https://test.k6.io/',
    });
  };

  const result = await run(scenario, { node: 1000, concurrency: 100, interval: 1000 });
  // const result = await run(scenario);
  console.log(JSON.stringify(_.sortBy(result, ['responseTime']), null, 2));
};

main();
