import { env } from "@/config/env";
import { HttpClient } from "./http-client";

export const apiClient = new HttpClient(env.apiUrl);

export { HttpClient, ApiError } from "./http-client";
