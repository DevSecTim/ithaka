import { config } from "dotenv";
import type { NextConfig } from "next";
import { resolve } from "node:path";

config({ path: resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@ithaka/api", "@ithaka/db", "@ithaka/shared"],
  serverExternalPackages: ["postgres", "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
};

export default nextConfig;
