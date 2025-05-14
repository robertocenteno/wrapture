// test/convert.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { convert } from '../convert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixtureModelPath = path.resolve('test', 'fixtures', 'basic_model.pt');
const outputDir = path.join(tmpdir(), `wrapture-test-${randomUUID()}`);

test('convert() should reject if file does not exist', async () => {
  const nonExistentPath = 'some/missing/model.pt';
  const invalidOut = path.join(tmpdir(), `wrapture-test-${randomUUID()}`);

  await assert.rejects(
    () => convert(nonExistentPath, invalidOut, {}),
    /Input model file not found/i
  );
});

test('convert() resolves if subprocess exits cleanly', async (t) => {
  // Mock subprocess call by making convert.py short-circuit if needed
  const mockInput = fixtureModelPath;
  const output = outputDir;

  // Make sure the output dir exists
  fs.mkdirSync(output, { recursive: true });

  // You can only run this if the python script exists and is safe to test
  // Skip the test if script is missing or too slow
  const scriptPath = path.resolve(__dirname, '../../../python', 'convert.py');
  if (!fs.existsSync(scriptPath)) {
    t.skip('Python script does not exist, skipping subprocess test');
    return;
  }

  await assert.doesNotReject(async () => {
    await convert(mockInput, output, { format: 'onnx', quantize: false });
  });
});
