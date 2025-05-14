/* eslint-disable import/no-unused-modules */
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/wrapture.ts'],
  format: ['esm'],
  target: 'node16',
  outDir: 'bin',
  clean: true,
  tsconfig: './tsconfig.json',
  banner: {
    js: '#!/usr/bin/env node'
  }
});
