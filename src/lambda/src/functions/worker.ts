import { Handler } from 'aws-lambda';

export type LambdaResponse = {
  nodes: number[];
};

type Scenario = { url: string; method: string };

type Event = {
  phase: {
    interval: number;
    nodes: number[];
  };
  scenarios: Scenario[];
};

export const main: Handler<Event, LambdaResponse> = async (event) => {
  console.log(event);
  // TODO: implement worker

  return { nodes: event.phase.nodes };
};
