function getEnv(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const env = {
  apiUrl: getEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001/api"),
  appName: getEnv("NEXT_PUBLIC_APP_NAME", "Pasa el Dato"),
} as const;
