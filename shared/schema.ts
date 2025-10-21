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

export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const obstacleSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const npcSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  sceneId: z.string(),
});

export const interactionZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  sceneId: z.string(),
});

export const educationalItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['poster', 'manual', 'computer', 'whiteboard']),
  x: z.number(),
  y: z.number(),
  fact: z.string(),
});

export const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  backgroundImage: z.string(),
  obstacles: z.array(obstacleSchema),
  npcs: z.array(npcSchema),
  interactionZones: z.array(interactionZoneSchema),
  educationalItems: z.array(educationalItemSchema),
  spawnPoint: positionSchema,
});

export const roomDataSchema = z.object({
  rooms: z.array(roomSchema),
});

export type Choice = z.infer<typeof choiceSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type GameData = z.infer<typeof gameDataSchema>;
export type Position = z.infer<typeof positionSchema>;
export type Obstacle = z.infer<typeof obstacleSchema>;
export type NPC = z.infer<typeof npcSchema>;
export type InteractionZone = z.infer<typeof interactionZoneSchema>;
export type EducationalItem = z.infer<typeof educationalItemSchema>;
export type Room = z.infer<typeof roomSchema>;
export type RoomData = z.infer<typeof roomDataSchema>;
