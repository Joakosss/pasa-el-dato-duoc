export function encodeCursor<T extends Record<string, unknown>>(value: T): string {
  const json = JSON.stringify(value);
  return Buffer.from(json, 'utf8').toString('base64url');
}

export function decodeCursor<T>(cursor: string): T {
  const json = Buffer.from(cursor, 'base64url').toString('utf8');
  return JSON.parse(json) as T;
}
