/* eslint-disable no-console */
/* global process */
import chalk from 'chalk';
import { Command } from 'commander';

import { existsSync } from 'node:fs';
import path from 'node:path';

import { convert } from './utils/convert.js';
import { generateWrapper } from './utils/generate-wrapper.js';

const program = new Command();

program
  .name('wrapture')
  .description('🌀 One-click model exporter: from PyTorch to Web-ready JS/TS')
  .version('0.1.0')
  .requiredOption('-i, --input <file>', 'Path to the PyTorch model (.pt)')
  .requiredOption(
    '-o, --output <dir>',
    'Output directory for the wrapped model'
  )
  .option('--quantize', 'Apply quantization to reduce model size')
  .option('--format <type>', 'Export format: onnx (default)', 'onnx')
  .option(
    '--backend <backend>',
    'Inference backend: webgpu | wasm | cpu',
    'webgpu'
  )
  .action(async (opts) => {
    const input = path.resolve(opts.input);
    const output = path.resolve(opts.output);

    if (!existsSync(input)) {
      console.error(chalk.red(`Input file not found: ${input}`));
      process.exit(1);
    }

    console.log(chalk.cyan('✨ Wrapture: Exporting model...'));

    try {
      await convert(input, output, opts);
      await generateWrapper(output, opts);
      console.log(chalk.green('✅ Done! Your model is wrapped and ready.'));
    } catch (err) {
      console.error(chalk.red('❌ Failed to export model:'), err);
      process.exit(1);
    }
  });

program.parse(process.argv);
