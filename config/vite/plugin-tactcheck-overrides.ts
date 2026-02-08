/**
 * Vite plugin that redirects two specific glitch component module IDs
 * to tactcheck versions that include GamepatchCard support.
 *
 * This works globally across all flavours, which is intentional -
 * the card only renders when status.gamepatch_card data is present.
 */

import path from 'node:path';

import type { Plugin } from 'vite';

export function TactcheckOverrides(): Plugin {
  let jsRoot = '';

  return {
    name: 'tactcheck-overrides',
    enforce: 'pre',

    configResolved(config) {
      jsRoot = config.root;
    },

    resolveId(source, importer) {
      if (!importer || !jsRoot) return null;

      // Don't redirect imports FROM our override files (prevents circular)
      if (importer.includes('flavours/tactcheck/')) return null;

      // Handle absolute imports
      if (source === 'flavours/glitch/components/status') {
        return path.resolve(jsRoot, 'flavours/tactcheck/components/status.jsx');
      }

      if (
        source === 'flavours/glitch/features/status/components/detailed_status'
      ) {
        return path.resolve(
          jsRoot,
          'flavours/tactcheck/features/status/components/detailed_status.tsx',
        );
      }

      // Handle relative imports that resolve to the overridden modules
      if (source.startsWith('.') && importer) {
        const importerDir = path.dirname(importer);
        const resolved = path.resolve(importerDir, source);
        const relToRoot = path
          .relative(jsRoot, resolved)
          .split(path.sep)
          .join('/');

        if (
          relToRoot === 'flavours/glitch/components/status' ||
          (/^flavours\/glitch\/components\/status\.[jt]sx?$/.exec(relToRoot))
        ) {
          return path.resolve(
            jsRoot,
            'flavours/tactcheck/components/status.jsx',
          );
        }

        if (
          relToRoot ===
            'flavours/glitch/features/status/components/detailed_status' ||
          (/^flavours\/glitch\/features\/status\/components\/detailed_status\.[jt]sx?$/.exec(relToRoot))
        ) {
          return path.resolve(
            jsRoot,
            'flavours/tactcheck/features/status/components/detailed_status.tsx',
          );
        }
      }

      return null;
    },
  };
}
