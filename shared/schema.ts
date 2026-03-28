import { z } from "zod";

// Room configuration enums - SNES-style simplicity
export const pacingModeSchema = z.enum(['slow', 'normal', 'urgent', 'deceptive']);
export const layoutTypeSchema = z.enum(['linear', 'hub', 'circular']);
export const playerStanceSchema = z.enum(['learner', 'responder', 'investigator', 'advocate', 'defender', 'resister']);
export const gateTypeSchema = z.enum(['observation', 'social', 'choice']);

// Gate definition - simple triggers that feel discovered, not assigned
export const gateSchema = z.object({
  id: z.string(),
  type: gateTypeSchema,
  description: z.string(), // What the player notices or must navigate
  targetId: z.string(), // NPC or zone this gate unlocks
  prerequisiteId: z.string().optional(), // What must be done first (item collected, NPC talked to)
  observationHint: z.string().optional(), // For observation gates: what to spot
  choiceOptions: z.array(z.object({
    text: z.string(),
    unlocksId: z.string(),
  })).optional(), // For choice gates: which NPC to help first
});

// Room atmosphere configuration
export const roomConfigSchema = z.object({
  pacing: pacingModeSchema,
  layout: layoutTypeSchema,
  stance: playerStanceSchema,
  stanceDescription: z.string(), // "You are the learner. People teach you."
  introText: z.string().optional(), // Brief intro when entering room
  gates: z.array(gateSchema).optional(),
});

export const choiceSchema = z.object({
  text: z.string(),
  score: z.number(),
  feedback: z.string(),
  nextSceneId: z.string().optional(),
  flagKey: z.string().optional(),
  flagValue: z.union([z.string(), z.boolean()]).optional(),
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
  isFinalBoss: z.boolean().optional(),
});

export const interactionZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  sceneId: z.string(),
  spriteType: z.enum(['poster', 'manual', 'computer', 'whiteboard']).optional(),
});

export const educationalItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['poster', 'manual', 'computer', 'whiteboard']),
  x: z.number(),
  y: z.number(),
  fact: z.string(),
});

export const completionRequirementsSchema = z.object({
  requiredNpcs: z.array(z.string()),
  requiredZones: z.array(z.string()),
  requiredItems: z.array(z.string()),
});

export const patientStorySchema = z.object({
  title: z.string(),
  text: z.string(),
  icon: z.string(),
});

export const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  unlockRequirement: z.string().nullable().optional(),
  alwaysUnlocked: z.boolean().optional(),
  patientStory: patientStorySchema.optional(),
  completionRequirements: completionRequirementsSchema.optional(),
  width: z.number(),
  height: z.number(),
  backgroundImage: z.string(),
  obstacles: z.array(obstacleSchema),
  npcs: z.array(npcSchema),
  interactionZones: z.array(interactionZoneSchema),
  educationalItems: z.array(educationalItemSchema),
  spawnPoint: positionSchema,
  config: roomConfigSchema.optional(),
});

export const roomDataSchema = z.object({
  rooms: z.array(roomSchema),
});

export type PacingMode = z.infer<typeof pacingModeSchema>;
export type LayoutType = z.infer<typeof layoutTypeSchema>;
export type PlayerStance = z.infer<typeof playerStanceSchema>;
export type GateType = z.infer<typeof gateTypeSchema>;
export type Gate = z.infer<typeof gateSchema>;
export type RoomConfig = z.infer<typeof roomConfigSchema>;
export type Choice = z.infer<typeof choiceSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type GameData = z.infer<typeof gameDataSchema>;
export type Position = z.infer<typeof positionSchema>;
export type Obstacle = z.infer<typeof obstacleSchema>;
export type NPC = z.infer<typeof npcSchema>;
export type InteractionZone = z.infer<typeof interactionZoneSchema>;
export type EducationalItem = z.infer<typeof educationalItemSchema>;
export type CompletionRequirements = z.infer<typeof completionRequirementsSchema>;
export type PatientStory = z.infer<typeof patientStorySchema>;
export type Room = z.infer<typeof roomSchema>;
export type RoomData = z.infer<typeof roomDataSchema>;
