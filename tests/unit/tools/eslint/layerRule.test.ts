import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, it } from 'vitest';
import { layerRule } from '../../../../tools/eslint/layer-rule.js';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ROOT = '/repo/src';
const OPTIONS = [
  {
    sourceRoot: ROOT,
    layers: {
      core: { layers: [], packages: [] },
      domain: { layers: ['core'], packages: [] },
      game: { layers: ['domain', 'core'], packages: [] },
      view: { layers: ['game/ports', 'domain', 'core'], packages: ['pixi.js'] },
      platform: { layers: ['game/ports', 'core'], packages: [], packagesBySubPath: { 'platform/assets': ['pixi.js'] } },
      app: { layers: ['*'], packages: ['*'] },
    },
  },
];

const tester = new RuleTester({ languageOptions: { parser: tseslint.parser, ecmaVersion: 2022, sourceType: 'module' } });

function file(relativePath: string): string {
  return `${ROOT}/${relativePath}`;
}

tester.run('dependency-direction', layerRule, {
  valid: [
    { filename: file('domain/board/MatchRule.ts'), code: "import { Vec2 } from '../../core/math/Vec2';", options: OPTIONS },
    { filename: file('domain/board/MatchRule.ts'), code: "import { GridCell } from './GridCell';", options: OPTIONS },
    { filename: file('game/flow/TurnFlow.ts'), code: "import { MatchRule } from '../../domain/board/MatchRule';", options: OPTIONS },
    { filename: file('view/bubble/BubbleView.ts'), code: "import { Sprite } from 'pixi.js';", options: OPTIONS },
    { filename: file('view/bubble/BubbleView.ts'), code: "import type { IBubbleView } from '../../game/ports/IBubbleView';", options: OPTIONS },
    { filename: file('platform/assets/AssetLoader.ts'), code: "import { Assets } from 'pixi.js';", options: OPTIONS },
    { filename: file('app/Bootstrap.ts'), code: "import { Application } from 'pixi.js'; import { X } from '../view/X';", options: OPTIONS },
    { filename: file('main.ts'), code: "import { Bootstrap } from './app/Bootstrap';", options: OPTIONS },
    { filename: '/repo/tools/assets/build.ts', code: "import sharp from 'sharp';", options: OPTIONS },
    { filename: file('game/flow/TurnFlow.ts'), code: "export { TurnState } from './TurnState';", options: OPTIONS },
  ],
  invalid: [
    {
      filename: file('core/math/Vec2.ts'),
      code: "import { GridCell } from '../../domain/board/GridCell';",
      options: OPTIONS,
      errors: [{ messageId: 'forbiddenLayer' }],
    },
    {
      filename: file('domain/board/MatchRule.ts'),
      code: "import { Sprite } from 'pixi.js';",
      options: OPTIONS,
      errors: [{ messageId: 'forbiddenPackage' }],
    },
    {
      filename: file('game/board/BoardSystem.ts'),
      code: "import { BubbleView } from '../../view/bubble/BubbleView';",
      options: OPTIONS,
      errors: [{ messageId: 'forbiddenLayer' }],
    },
    {
      filename: file('view/bubble/BubbleView.ts'),
      code: "import { BoardSystem } from '../../game/board/BoardSystem';",
      options: OPTIONS,
      errors: [{ messageId: 'forbiddenLayer' }],
    },
    {
      filename: file('platform/input/PointerInput.ts'),
      code: "import { Sprite } from 'pixi.js';",
      options: OPTIONS,
      errors: [{ messageId: 'forbiddenPackage' }],
    },
    {
      filename: file('game/flow/TurnFlow.ts'),
      code: "export * from '../../platform/ads/MraidAdNetwork';",
      options: OPTIONS,
      errors: [{ messageId: 'forbiddenLayer' }],
    },
    {
      filename: file('domain/level/LevelParser.ts'),
      code: "const fs = import('node:fs');",
      options: OPTIONS,
      errors: [{ messageId: 'forbiddenPackage' }],
    },
  ],
});

describe('directory imports', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'layers-'));
  const sourceRoot = path.join(root, 'src');
  for (const folder of ['game/ports', 'core', 'view', 'domain']) {
    mkdirSync(path.join(sourceRoot, folder), { recursive: true });
  }

  const options = [{ ...OPTIONS[0], sourceRoot }];
  const inSource = (relativePath: string) => path.join(sourceRoot, relativePath);

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  tester.run('dependency-direction (directories)', layerRule, {
    valid: [
      { filename: inSource('view/BubbleView.ts'), code: "import { IBubbleView } from '../game/ports';", options },
      { filename: inSource('domain/MatchRule.ts'), code: "import { Vec2 } from '../core';", options },
    ],
    invalid: [
      {
        filename: inSource('core/Vec2.ts'),
        code: "import { MatchRule } from '../domain';",
        options,
        errors: [{ messageId: 'forbiddenLayer', data: { from: 'core', to: 'domain', allowed: 'nothing' } }],
      },
    ],
  });
});
