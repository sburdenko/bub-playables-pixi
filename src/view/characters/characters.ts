import type { CharacterDefinition } from './CharacterView';

export const HERO: CharacterDefinition = {
  idleFrames: ['smash2', 'smash3', 'smash4', 'smash5', 'smash6', 'smash7'],
  hitFrames: [],
  frameDuration: 0.15,
  scale: 0.15,
};

export const ENEMY: CharacterDefinition = {
  idleFrames: ['gizmo1', 'gizmo2', 'gizmo3', 'gizmo4', 'gizmo5'],
  hitFrames: ['gizmo8-1', 'gizmo9', 'gizmo10', 'gizmo11', 'gizmo12'],
  frameDuration: 0.2,
  scale: 0.16,
};
