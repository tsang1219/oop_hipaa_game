import { z } from "zod";

export const choiceSchema = z.object({
  text: z.string(),
  score: z.number(),
  feedback: z.string(),
  nextSceneId: z.string().optional(),
});

export const sceneSchema = z.object({
  id: z.string(),
  character: z.string(),
  dialogue: z.string(),
  choices: z.array(choiceSchema),
  isEnd: z.boolean().optional(),
});

export const gameDataSchema = z.object({
  scenes: z.array(sceneSchema),
});

export type Choice = z.infer<typeof choiceSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type GameData = z.infer<typeof gameDataSchema>;
