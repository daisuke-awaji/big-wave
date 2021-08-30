import _ from 'lodash';
import { run } from './index';

// const callForWait = (func, sec) => {
//   setInterval(func, sec * 1000);
// };

it('call api', async () => {
  const summary = await run();
  console.log(_.sortBy(summary, ['node', 'sentAt']));
  // console.log(result.headers);
});
