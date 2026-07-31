import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: false,
    esbuild: {
      jsx: 'automatic',
    },
  },
  externals: ['react', 'react-dom', 'react/jsx-runtime', '@enfyra/sdk-core', 'zustand', 'zustand/vanilla'],
});
