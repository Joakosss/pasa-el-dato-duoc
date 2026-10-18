function getEnv(key: string, fallback = ""): string {
    return process.env[key] ?? fallback;
}

export const env = {
    apiUrl: getEnv("EXPO_PUBLIC_API_URL", "http://192.168.1.93:3001/api"),
    appName: getEnv("EXPO_PUBLIC_APP_NAME", "Pasa el Dato"),
} as const;
