import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  env: {
    // Satu-satunya sumber nomor versi app adalah package.json — jangan
    // hardcode versi di tempat lain (lihat components/shared/AppVersion.tsx).
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
};

export default nextConfig;
