import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: import('next').NextConfig = {
  // Keep Turbopack scoped to this app; the repository also has a root lockfile.
  turbopack: {
    root: frontendRoot
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*' // Proxy to backend
      }
    ]
  }
};

export default nextConfig;
