// Ambient declarations for the `gamepatch-*` specifiers aliased in
// vite.config.mts to sources inside the private `gamepatch` submodule.
//
// The JavaScript CI jobs check out the repository without that submodule
// (see .github/actions/setup-javascript), so tsc and the eslint TypeScript
// import resolver cannot see the real files. These declarations describe the
// surface the host actually consumes; Vite resolves the real modules at build
// time.

declare module 'gamepatch-card-runtime' {
  // Registers the <gamepatch-card> custom element. Calling it also pins the
  // module against tree-shaking.
  export function ensureGamepatchCard(): void;
}

declare module 'gamepatch-card-styles';

declare module 'gamepatch-widget-slot' {
  export const GamepatchSlot: React.FC<{ name: string }>;
}

declare module 'gamepatch-widget-styles';

declare module 'gamepatch-research-listener' {
  export const GamepatchResearchListener: React.FC;
}
