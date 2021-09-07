import yaml from 'js-yaml';
import { Validator, ValidatorResult } from 'jsonschema';
import fs from 'fs';
import { schema } from './schema';
import { AxiosInstance, Method } from 'axios';

const readScript = (scriptPath: string): string => {
  const data = fs.readFileSync(scriptPath, 'utf-8');
  return data;
};
const parseScript = (data: string): any => {
  return yaml.load(data) as any;
};
const validator = new Validator();
const validate = (script: Object): ValidatorResult => {
  return validator.validate(script, schema);
};

type Phase = {
  concurrency: number;
  interval: number;
  node: number;
};

type Scenario = {
  url: string;
  method: Method;
};

type ConfigParam = {
  phases: Array<Phase>;
  scenarios: Array<Scenario>;
};

export type TestScript = (client: AxiosInstance) => Promise<void>;

export class Config {
  public phases: Phase[];
  public scenarios: Scenario[];

  constructor(c: { path?: string; param?: ConfigParam }) {
    const { path, param } = c;

    if (path) {
      const scriptStr = readScript(path);
      const script = parseScript(scriptStr);
      const validation = validate(script);
      if (!validation.valid) {
        console.error(validation.errors);
        throw new Error('config validation failed');
      }
      this.phases = script['phase'];
      this.scenarios = script['scenarios'];
      return;
    }

    if (param) {
      this.phases = param.phases;
      this.scenarios = param.scenarios;
      return;
    }

    throw new Error('failed to read config');
  }

  public toTestScript(): TestScript {
    const runScript = async (client: AxiosInstance) => {
      for (const s of this.scenarios) {
        await client({
          method: s.method,
          url: s.url,
        });
      }
    };
    return runScript;
  }
}
