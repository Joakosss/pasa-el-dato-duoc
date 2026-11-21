import { validarApiUrl } from './validar-api-url';

export const env = {
    apiUrl: validarApiUrl(process.env.EXPO_PUBLIC_API_URL, __DEV__),
    appName: process.env.EXPO_PUBLIC_APP_NAME ?? "Pasa el Dato",
    mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "",
} as const;
