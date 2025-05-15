/* eslint-disable no-console */
export type LogLevelType = 'silent' | 'error' | 'warn' | 'info' | 'debug';

let currentLevel: LogLevelType = 'info';

const levels: Record<LogLevelType, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
};

export const setLogLevel = (level: LogLevelType) => {
  currentLevel = level;
};

const shouldLog = (level: LogLevelType): boolean => {
  return levels[level] <= levels[currentLevel];
};

export const log = {
  debug: (...args: unknown[]) =>
    shouldLog('debug') && console.debug('[debug]', ...args),
  info: (...args: unknown[]) =>
    shouldLog('info') && console.info('[info]', ...args),
  warn: (...args: unknown[]) =>
    shouldLog('warn') && console.warn('[warn]', ...args),
  error: (...args: unknown[]) =>
    shouldLog('error') && console.error('[error]', ...args)
};
