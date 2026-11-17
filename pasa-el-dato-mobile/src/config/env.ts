export const env = {
    apiUrl:
        process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3001/api",
    appName: process.env.EXPO_PUBLIC_APP_NAME ?? "Pasa el Dato",
    mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "",
} as const;
