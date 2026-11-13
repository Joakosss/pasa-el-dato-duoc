import { env } from "@/config/env";
import { HttpClient } from "./http-client";

export const apiClient = new HttpClient(env.apiUrl);

export { ApiError, HttpClient } from "./http-client";
