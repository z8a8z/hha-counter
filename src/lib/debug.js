/**
 * Debug / Logging System
 *
 * Provides categorized, timestamped logs to help identify where an issue is
 * and what it is. In production builds, debug and info logs are silenced.
 *
 * Usage:
 *   import { debug } from '../lib/debug.js';
 *   debug.log('Counter', 'Incrementing value', { from: 5, to: 6 });
 *   debug.error('Counter', 'Failed to update DB', errorObject);
 */

const isProduction = import.meta.env.PROD;

const COLORS = {
  log: '#2563eb',   // blue
  warn: '#d97706',  // amber
  error: '#dc2626', // red
  info: '#059669',  // emerald
  db: '#7c3aed',    // violet
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function format(level, area, message, data) {
  const ts = timestamp();
  const prefix = `[${ts}] [${level.toUpperCase()}] [${area}]`;

  if (data !== undefined) {
    console.groupCollapsed(
      `%c${prefix}%c ${message}`,
      `color:${COLORS[level] || '#000'};font-weight:bold`,
      'color:inherit;font-weight:normal'
    );
    console.log('Data:', data);
    console.groupEnd();
  } else {
    console.log(
      `%c${prefix}%c ${message}`,
      `color:${COLORS[level] || '#000'};font-weight:bold`,
      'color:inherit;font-weight:normal'
    );
  }
}

export const debug = {
  /** General debug info – hidden in production */
  log(area, message, data) {
    if (!isProduction) format('log', area, message, data);
  },

  /** Important info shown in all environments */
  info(area, message, data) {
    format('info', area, message, data);
  },

  /** Warning – shown in all environments */
  warn(area, message, data) {
    format('warn', area, message, data);
  },

  /** Error – always shown, use for caught exceptions */
  error(area, message, data) {
    format('error', area, message, data);
  },

  /** Database-specific log – hidden in production */
  db(area, message, data) {
    if (!isProduction) format('db', area, message, data);
  },
};
