import type { NextConfig } from "next";

// TODO: workaround mientras el back emita la cookie `accessToken` con
// `Path=/api`. El navegador no la envía al handshake por defecto
// (`/socket.io`), así que el front pide el engine bajo `/api/socket.io`
// (mismo origen, la cookie viaja) y lo proxya al back. Fix definitivo:
// cookie con `Path=/` en auth.controller/cuenta.controller.
const origenBack =
  process.env.API_INTERNAL_URL ??
  `http://back:${process.env.API_PORT ?? "3001"}`;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // El engine.io vive en /socket.io/ (con barra final): se mantiene
      // explícita porque Next normaliza la barra final del source.
      {
        source: "/api/socket.io",
        destination: `${origenBack}/socket.io/`,
      },
      {
        source: "/api/socket.io/:path*",
        destination: `${origenBack}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
