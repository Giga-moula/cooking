/** @type {import('next').NextConfig} */
const nextConfig = {
    // Note: 'output: export' désactivé pour permettre les API routes
    // Si vous voulez un export statique, utilisez une solution de stockage côté client
    distDir: "dist",
};

export default nextConfig;

