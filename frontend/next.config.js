/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 'output: export' es solo para deploy estático (Amplify/S3).
  // Para dev local y SSR estándar, comentar estas dos líneas.
  // output: 'export',
  // trailingSlash: true,
};

module.exports = nextConfig;
