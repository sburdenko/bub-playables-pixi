import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * ESLint rule enforcing the layer dependency table from docs/SPEC.md §4.1.
 *
 * Options: `{ sourceRoot, layers }`, where each layer lists the layers (optionally narrowed to a
 * sub-path such as `game/ports`) and npm packages it may import. `*` allows everything.
 */
export const layerRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Enforce the direction of dependencies between architecture layers' },
    schema: [
      {
        type: 'object',
        properties: {
          sourceRoot: { type: 'string' },
          layers: { type: 'object' },
        },
        required: ['sourceRoot', 'layers'],
        additionalProperties: false,
      },
    ],
    messages: {
      forbiddenLayer: "Layer '{{from}}' must not import from '{{to}}'. Allowed: {{allowed}}.",
      forbiddenPackage: "Layer '{{from}}' must not import package '{{name}}'. Allowed: {{allowed}}.",
    },
  },
  create(context) {
    const { sourceRoot, layers } = context.options[0];
    const fileName = context.filename;
    const sourceLayer = findLayer(sourceRoot, fileName);
    if (sourceLayer === null || layers[sourceLayer.name] === undefined) {
      return {};
    }

    const policy = layers[sourceLayer.name];

    function check(node, specifier) {
      if (typeof specifier !== 'string') {
        return;
      }

      if (specifier.startsWith('.')) {
        checkLayerImport(node, path.resolve(path.dirname(fileName), specifier));
      } else {
        checkPackageImport(node, specifier);
      }
    }

    function checkLayerImport(node, targetFile) {
      const target = findLayer(sourceRoot, targetFile);
      if (target === null || target.name === sourceLayer.name) {
        return;
      }

      const allowed = policy.layers ?? [];
      if (!allowed.some((entry) => matchesLayer(entry, target))) {
        context.report({
          node,
          messageId: 'forbiddenLayer',
          data: { from: sourceLayer.name, to: target.subPath, allowed: describe(allowed) },
        });
      }
    }

    function checkPackageImport(node, specifier) {
      const name = packageName(specifier);
      const allowed = [...(policy.packages ?? []), ...packagesForSubPath(policy, sourceLayer.subPath)];
      if (!allowed.includes('*') && !allowed.includes(name)) {
        context.report({
          node,
          messageId: 'forbiddenPackage',
          data: { from: sourceLayer.name, name, allowed: describe(allowed) },
        });
      }
    }

    return {
      ImportDeclaration: (node) => check(node, node.source.value),
      ExportAllDeclaration: (node) => check(node, node.source.value),
      ExportNamedDeclaration: (node) => node.source && check(node, node.source.value),
      ImportExpression: (node) => node.source.type === 'Literal' && check(node, node.source.value),
    };
  },
};

/** Layer of a file or, for a directory import such as `../game/ports`, of that directory. */
function findLayer(sourceRoot, target) {
  const relative = path.relative(path.resolve(sourceRoot), path.resolve(target));
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }

  const segments = relative.split(path.sep);
  const folders = isDirectory(target) ? segments : segments.slice(0, -1);
  const name = folders[0] ?? 'app';

  return { name, subPath: folders.join('/') || name };
}

function isDirectory(target) {
  return existsSync(target) && statSync(target).isDirectory();
}

function matchesLayer(entry, target) {
  return entry === '*' || target.subPath === entry || target.subPath.startsWith(`${entry}/`);
}

function packagesForSubPath(policy, subPath) {
  const bySubPath = policy.packagesBySubPath ?? {};

  return Object.entries(bySubPath)
    .filter(([prefix]) => subPath === prefix || subPath.startsWith(`${prefix}/`))
    .flatMap(([, names]) => names);
}

function packageName(specifier) {
  const parts = specifier.split('/');

  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function describe(list) {
  return list.length === 0 ? 'nothing' : list.join(', ');
}
