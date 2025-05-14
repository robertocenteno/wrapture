import ora from 'ora';

import fs from 'node:fs';
import path from 'node:path';

/**
 * Options for generating ONNX wrapper files.
 */
export interface GenerateWrapperOptionsInterface {
  /**
   * The backend to use for inference. This affects the model file used.
   * If set to `'wasm'`, the generated wrapper will load `model_quant.onnx`,
   * otherwise it will load `model.onnx`.
   */
  backend: 'wasm' | 'webgl' | string;
}

/**
 * Generates a TypeScript wrapper and type definition file (`wrapped.ts` and `wrapped.d.ts`)
 * for use with `onnxruntime-web`, including utility functions like `softmax`, `argmax`,
 * and a typed `predict()` function.
 *
 * The generated code loads the correct ONNX model based on the provided backend.
 *
 * @param {string} outputDir - The directory where the wrapper files will be written.
 * @param {GenerateWrapperOptionsInterface} opts - Wrapper generation options, including backend type.
 * @returns A Promise that resolves when the wrapper files are successfully written.
 *
 * @throws Will throw an error if file writing fails.
 *
 * @example
 * ```ts
 * await generateWrapper('./dist', { backend: 'wasm' });
 * // Creates `wrapped.ts` and `wrapped.d.ts` in ./dist
 * ```
 *
 * @see https://www.npmjs.com/package/onnxruntime-web
 */
export const generateWrapper = async (
  outputDir: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opts: GenerateWrapperOptionsInterface
): Promise<void> => {
  const spinner = ora('🛠 Generating wrapper files...').start();
  const wrapper = `import { InferenceSession, Tensor } from 'onnxruntime-web';

const softmax = (logits) => {
  const exps = logits.map(Math.exp);
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

const argmax = (arr) => {
  return arr.reduce((maxIdx, val, idx, src) => val > src[maxIdx] ? idx : maxIdx, 0);
}

export const loadModel = async () => {
   const session = await InferenceSession.create(
    new URL('./${opts.backend === 'wasm' ? 'model_quant.onnx' : 'model.onnx'}', import.meta.url).href
  );
  return {
    predict: async (input) => {
      const feeds = { input: new Tensor('float32', input.data, input.dims) };
      const results = await session.run(feeds);
      const raw = results.output.data;

      if (!(raw instanceof Float32Array)) {
        throw new Error('Expected Float32Array logits but got something else');
      }

      const logits = raw;
      const probabilities = softmax(Array.from(logits));
      const predictedClass = argmax(probabilities);
      return { logits, probabilities, predictedClass };
    }
  };
};
`;
  const typings = `export interface ModelInput {
  data: Float32Array;
  dims: number[];
}

export interface ModelOutput {
  logits: Float32Array;
  probabilities: number[];
  predictedClass: number;
}

export interface LoadedModel {
  predict(input: ModelInput): Promise<ModelOutput>;
}

/**
 * Load the ONNX model and return a wrapper with \`predict()\` function.
 */
export function loadModel(): Promise<LoadedModel>;`;

  try {
    fs.writeFileSync(path.join(outputDir, 'wrapped.ts'), wrapper);
    fs.writeFileSync(path.join(outputDir, 'wrapped.d.ts'), typings);
    spinner.succeed('✅ Wrapper files generated.');
  } catch (error) {
    spinner.fail('❌ Failed to generate wrapper files.');
    throw error;
  }
};
