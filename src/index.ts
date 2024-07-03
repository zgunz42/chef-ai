import { generate } from '@genkit-ai/ai';
import { configureGenkit } from '@genkit-ai/core';
import { defineFlow, startFlowsServer } from '@genkit-ai/flow';
import * as z from 'zod';
import googleAI, { geminiPro } from '@genkit-ai/googleai';
import { ollama } from 'genkitx-ollama';
import { defineDotprompt, dotprompt } from '@genkit-ai/dotprompt';


if (!process.env.GOOGLE_API_KEY) {
  console.error('GOOGLE_API_KEY is not set');
  process.exit(1);
}

configureGenkit({
  plugins: [
    // ollama({
    //   models: [{ name: 'gemma2' }],
    //   serverAddress: 'http://127.0.0.1:11434', // default ollama local address
    // }),
    googleAI({ apiKey: process.env.GOOGLE_API_KEY }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

const OutputSchema = z.object({
  name: z.string().describe('The name of the menu'),
  description: z.string().describe('The description of the menu'),
  ingredients: z.array(
    z.object({
      name: z.string().describe('The name of the ingredient'),
      quantity: z.string().describe('The quantity of the ingredient'),
    })
  ),
  steps: z.array(z.string().describe('The steps of the menu')),
})

const InputSchema = z.object({
  menuName: z.string().describe('The name of the menu'),
  language: z.string().describe('The language of the menu'),
})

const menuPrompt = defineDotprompt(
  {
    name: 'simpleGreeting',
    model: geminiPro,
    input: { 
      schema: InputSchema
    },
    output: {
      schema: OutputSchema,
    },
  },
  `
You're a chief that has explored the world and have knowledge of all recipes.
Someone want to know of recipe of {{ menuName }} and you will delivery a list of ingredients with their quantity and instructions.
You will answer in {{ language }} language.
`
);

export const menuRecipeFlow = defineFlow(
  {
    name: 'menuRecipeFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (subject) => {
    return (await menuPrompt.generate({ input: subject })).output();
  }
);

startFlowsServer();
