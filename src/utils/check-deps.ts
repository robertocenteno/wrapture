/* global process */
import chalk from 'chalk';

import { spawnSync } from 'node:child_process';

const printError = (title: string, body: string) => {
  console.error(`\n${chalk.red.bold('✘')} ${chalk.red.bold(title)}`);
  console.error(chalk.white(body));
};

export const checkPythonAvailable = (): void => {
  const result = spawnSync('python3', ['--version'], { encoding: 'utf-8' });

  if (result.error || result.status !== 0) {
    printError(
      'Python 3 is not available.',
      'Please install it from https://www.python.org/downloads/ and ensure it is added to your PATH.'
    );
    process.exit(1);
  }
};

export const checkPythonDeps = (): void => {
  const check = spawnSync(
    'python3',
    [
      '-c',
      `
import sys
missing = []
for module in ['torch', 'onnx', 'onnxsim', 'onnxruntime']:
    try:
        __import__(module)
    except ImportError:
        missing.append(module)
if missing:
    print(', '.join(missing))
    sys.exit(1)
  `
    ],
    { encoding: 'utf-8' }
  );

  if (check.status !== 0) {
    const missing = check.stdout.trim().split(',').filter(Boolean);

    printError(
      'Missing Python dependencies.',
      `Please install the following packages:\n\n  ${chalk.yellow(
        `python3 -m pip install ${missing.join(' ')}`
      )}`
    );
    process.exit(1);
  }
};
