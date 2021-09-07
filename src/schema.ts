export const schema = {
  $id: 'https://example.com/arrays.schema.json',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Schema for BigWave test scripts',
  type: 'object',
  required: ['phase', 'scenarios'],
  properties: {
    phase: {
      type: 'array',
      items: { $ref: '#/$defs/phase' },
    },
    scenarios: {
      type: 'array',
      items: { $ref: '#/$defs/scenario' },
    },
  },

  $defs: {
    scenario: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'full path of url',
        },
        method: {
          type: 'string',
          description: 'options, get, put, post, delete..',
        },
        // headers: {
        //   type: 'object',
        // },
      },
    },
    phase: {
      type: 'object',
      required: ['concurrency', 'interval', 'node'],
      properties: {
        concurrency: {
          type: 'number',
        },
        interval: {
          type: 'number',
        },
        node: {
          type: 'number',
        },
      },
    },
  },
};
