import path from 'path';
import { Config } from './config';

it('read config (good)', async () => {
  const scriptPath = path.resolve(__dirname, './config.examples/config.good.example.yml');
  const config = new Config({ path: scriptPath });
  console.log(config);
});

it('read config (bad)', async () => {
  const scriptPath = path.resolve(__dirname, './config.examples/config.bad.example.yml');
  expect(() => new Config({ path: scriptPath })).toThrow();
});
