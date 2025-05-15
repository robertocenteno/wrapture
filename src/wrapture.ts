/* eslint-disable no-console */
/* global process */
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

import { existsSync } from 'node:fs';
import path from 'node:path';

import pkg from '../package.json';

import { checkPythonAvailable, checkPythonDeps } from './utils/check-deps.js';
import { convert } from './utils/convert.js';
import { generateWrapper } from './utils/generate-wrapper.js';
import { LogLevelType, setLogLevel } from './utils/log-level.js';

const program = new Command();

program
  .name('wrapture')
  .description(
    `🌀 ${chalk.blue('One-click model exporter: ')}from PyTorch to Web-ready JS/TS.

Wrapture lets you go from a Python-trained model to deployable JavaScript with a single command.
It generates TypeScript bindings and a Web/Node-compatible wrapper, using WebGPU/WASM-ready ONNX runtimes.

Report issues here: https://github.com/phun-ky/wrapture`
  )
  .version(pkg.version)
  .requiredOption('-i, --input <file>', 'path to the PyTorch model (.pt)')
  .requiredOption(
    '-o, --output <dir>',
    'output directory for the wrapped model'
  )
  .option('--quantize', 'apply quantization to reduce model size')
  .option('--format <type>', 'export format: onnx (default)', 'onnx')
  .option(
    '--backend <backend>',
    'inference backend: webgpu | wasm | cpu',
    'webgpu'
  )
  .option(
    '--logLevel <level>',
    'set log level: silent | error | warn | info | debug',
    'error'
  )
  .action(async (opts) => {
    checkPythonAvailable();
    checkPythonDeps();

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
