type LogLevel = "debug" | "info" | "warn" | "error";

const ORDERED_KEYS = [
  "method",
  "path",
  "status",
  "durationMs",
  "patientId",
  "deviceCode",
  "targetDevices",
  "reminderCount",
  "preferredDeviceId",
  "fallbackDeviceCode",
  "event",
  "tail",
  "socketId",
  "port",
  "broker",
  "topic",
  "error",
];
const ANSI = {
  reset: "\u001b[0m",
  gray: "\u001b[90m",
  cyan: "\u001b[36m",
  yellow: "\u001b[33m",
  red: "\u001b[31m",
};
const COLOR_ENABLED = process.env.NO_COLOR !== "1";

function colorize(text: string, color: string): string {
  return COLOR_ENABLED ? `${color}${text}${ANSI.reset}` : text;
}

function colorLevel(level: LogLevel): string {
  const label = level.toUpperCase().padEnd(5);
  if (level === "debug") return colorize(label, ANSI.gray);
  if (level === "info") return colorize(label, ANSI.cyan);
  if (level === "warn") return colorize(label, ANSI.yellow);
  return colorize(label, ANSI.red);
}

function toDisplayValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  try {
    const json = JSON.stringify(value);
    if (!json) return "[unserializable]";
    return json.length > 120 ? `${json.slice(0, 117)}...` : json;
  } catch {
    return "[unserializable]";
  }
}

function orderedEntries(meta: Record<string, unknown>): Array<[string, unknown]> {
  const seen = new Set<string>();
  const entries: Array<[string, unknown]> = [];

  for (const key of ORDERED_KEYS) {
    if (key in meta) {
      entries.push([key, meta[key]]);
      seen.add(key);
    }
  }

  for (const [key, value] of Object.entries(meta)) {
    if (!seen.has(key)) {
      entries.push([key, value]);
    }
  }

  return entries;
}

function formatMeta(meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return "";

  const parts = orderedEntries(meta).map(([key, value]) => `${key}=${toDisplayValue(value)}`);
  return ` | ${parts.join(" ")}`;
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const timestamp = colorize(`[${new Date().toISOString()}]`, ANSI.gray);
  const line = `${timestamp} ${colorLevel(level)} ${message}${formatMeta(meta)}`;
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const log = {
  debug: (message: string, meta?: Record<string, unknown>) => write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};
