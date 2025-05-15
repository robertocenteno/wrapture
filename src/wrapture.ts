/* eslint-disable no-console */
/* global process */
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import { existsSync } from 'node:fs';
import path from 'node:path';

import { convert } from './utils/convert.js';
import { generateWrapper } from './utils/generate-wrapper.js';
import { LogLevelType, setLogLevel } from './utils/log-level.js';

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
  .option(
    '--logLevel <level>',
    'set log level: silent | error | warn | info | debug',
    'error'
  )
  .action(async (opts) => {
    const input = path.resolve(opts.input);
    const output = path.resolve(opts.output);

    setLogLevel(
      (process.env.LOGLEVEL as LogLevelType) || opts.logLevel || 'error'
    );

    if (!existsSync(input)) {
      console.error(
        `${chalk.red.bold('✘ Input file not found:')} ${chalk.white(input)}`
      );
      process.exit(1);
    }

    const spinner = ora('Wrapture: Exporting model...').start();

    try {
      await convert(input, output, opts);
      await generateWrapper(output, opts);
      spinner.succeed('Done! Your model is wrapped and ready.');
    } catch (err) {
      spinner.fail('Failed to export model:');
      console.error(err);

      process.exit(1);
    }
  });

program.parse(process.argv);
