import axios from 'axios';
import _ from 'lodash';
import { promises as fs } from 'fs';
import { genRandomStr } from './util';
import path from 'path';

declare module 'axios' {
  export interface AxiosRequestConfig {
    requestId?: string;
    timestamp?: number;
    node?: number;
    responseTime?: number;
  }
}

export type TestResult = {
  clientId?: string;
  status?: number;
  url?: string;
  method?: string;
  sentAt?: number;
  responseTime?: number;
  node: number;
  error?: any;
};

export class BigWaveCore {
  constructor(private clientId?: string) {}
  public summary: TestResult[] = [];

  public create = (node: number) => {
    const client = axios.create({ node });

    // timestamp
    client.interceptors.request.use((config) => {
      config.timestamp = Date.now();
      return config;
    });

    // response time, and test summary
    client.interceptors.response.use(
      (response) => {
        this.summary.push({
          clientId: this.clientId,
          status: response.status,
          url: response.config.url,
          method: response.config.method,
          sentAt: new Date(response.config.timestamp!),
          responseTime: Date.now() - response.config.timestamp!,
          node: response.config.node!,
        } as any);
        return response;
      },
      (error) => {
        if (axios.isAxiosError(error)) {
          this.summary.push({
            clientId: this.clientId,
            status: error?.response?.status,
            url: error?.config.url,
            method: error?.config.method,
            sentAt: error.config.timestamp!,
            responseTime: Date.now() - error.config.timestamp!,
            node: error.config.node!,
            error: error.message,
          });
        }
      },
    );

    return client;
  };

  public report = async () => {
    const runId = genRandomStr();
    const now = new Date().toISOString();
    const data = JSON.stringify(_.sortBy(this.summary, ['responseTime']), null, 2);
    const filename = `result-${now}-${runId}.json`;
    const filepath = path.resolve(__dirname, '../');
    console.log(`Writing report on file: ${filepath}/${filename}`);
    // TODO: use json-stream-stringify or alternative
    // see https://github.com/Faleij/json-stream-stringify
    // or https://stackoverflow.com/questions/65385002/create-big-json-object-js
    await fs.writeFile(filename, data, { encoding: 'utf8' });
  };
}
