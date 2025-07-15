/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    BACKEND_URL: 'http://localhost:5000'
  }
}

module.exports = nextConfig