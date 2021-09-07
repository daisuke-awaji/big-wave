import { run } from './runner';
import _ from 'lodash';
import { Config } from './config';
import path from 'path';

const main = async () => {
  const scriptPath = path.resolve(__dirname, './config.examples/config.good.example.yml');
  const config = new Config({ path: scriptPath });
  await run(config);
};

main();
