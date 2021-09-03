import { AxiosInstance } from "axios";
import { run } from "./runner";
import _ from "lodash";

const main = async () => {
  const scenario = async (client: AxiosInstance) => {
    await client({
      method: "get",
      url: "https://test.k6.io/",
    });
  };

  await run(scenario, {
    node: 10000,
    concurrency: 5000,
    interval: 1000,
  });
};

main();
