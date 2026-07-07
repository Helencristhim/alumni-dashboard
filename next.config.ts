import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // imapflow é uma lib Node (IMAP) usada só no servidor; mantê-la fora do bundle
  serverExternalPackages: ['imapflow'],
};

export default nextConfig;
