/* eslint-disable import/no-unused-modules */
/* global process */
import chalk from 'chalk';
import ora from 'ora';

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { log } from './log-level.js';

/**
 * Options for the {@link convert} function.
 */
export interface ConvertOptionsInterface {
  /**
   * The output format for the converted model (e.g., 'onnx').
   * Defaults to 'onnx' if not provided.
   */
  format?: string;

  /**
   * Whether to apply quantization to the model.
   */
  quantize?: boolean;
}

/**
 * Converts a machine learning model to ONNX or another supported format
 * by delegating to a Python script (`convert.py`).
 *
 * This function spawns a subprocess using `python3` and monitors stdout/stderr.
 * It supports additional options such as format selection and quantization.
 *
 * @function convert
 * @param {string} inputPath - Path to the input model file
 * @param {string} outputDir - Directory where the converted model should be saved
 * @param {ConvertOptionsInterface} opts - Conversion options
 * @returns A promise that resolves on success or rejects if conversion fails
 *
 * @throws {Error} If the Python process exits with a non-zero code
 *
 * @example
 * ```ts
 * await convert('models/model.pt', 'out/', { format: 'onnx', quantize: true });
 * ```
 *
 * @see https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
 * @see https://github.com/sindresorhus/ora - Ora spinner for CLI feedback
 * @see https://github.com/chalk/chalk - Chalk for terminal coloring
 */
export const convert = async (
  inputPath: string,
  outputDir: string,
  opts: ConvertOptionsInterface
): Promise<void> => {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input model file not found: ${inputPath}`);
  }

  log.info('Converting model to ONNX...');

  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), 'python/convert.py');

    log.debug('Script path for `convert.py`:', scriptPath);

    const args = [
      scriptPath,
      '--input',
      inputPath,
      '--output',
      outputDir,
      '--format',
      opts.format || 'onnx'
    ];

    if (opts.quantize) args.push('--quantize');

    const python = spawn('python3', args);

    python.stdout.on('data', (data) => {
      log.debug('[python stdout]', data.toString());
    });

    python.stderr.on('data', (data) => {
      log.error('[python stderr]', data.toString());
    });

    python.on('close', (code) => {
      if (code === 0) {
        log.info('Model converted successfully');

        resolve();
      } else {
        log.error('Model conversion failed');

        reject(new Error(`convert.py exited with code ${code}`));
      }
    });
  });
};
