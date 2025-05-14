import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { generateWrapper } from '../generate-wrapper.js';

const testOutputDir = './.test-output';

test('generateWrapper creates wrapper files', async (t) => {
  // Clean up previous run
  fs.rmSync(testOutputDir, { recursive: true, force: true });
  fs.mkdirSync(testOutputDir);

  await generateWrapper(testOutputDir, { backend: 'webgpu' });

  const files = fs.readdirSync(testOutputDir);
  assert.ok(files.includes('wrapped.ts'), 'wrapped.ts should be generated');
  assert.ok(files.includes('wrapped.d.ts'), 'wrapped.d.ts should be generated');

  const wrapperContent = fs.readFileSync(
    path.join(testOutputDir, 'wrapped.ts'),
    'utf-8'
  );
  assert.match(
    wrapperContent,
    /loadModel/,
    'Wrapper should contain loadModel function'
  );
});
