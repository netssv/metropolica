const nextConfig: import('next').NextConfig = {
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
