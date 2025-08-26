/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    },
    experimental: {
        serverActions: {
            enabled: true
        },
    },
}

module.exports = nextConfig