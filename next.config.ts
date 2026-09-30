import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  // Production deploys via the Docker image, which runs the standalone
  // server (server.js). `output: "standalone"` shrinks the runtime bundle.
  output: "standalone",
};

// next-intl v4: links ./i18n/request.ts so NextIntlClientProvider can
// resolve locale/messages on the server. No middleware / locale routing yet.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
