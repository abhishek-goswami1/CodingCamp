/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Security headers (Phase 4 — OWASP hardening)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.accounts.dev https://*.clerk.accounts.dev https://*.clerk.com https://www.youtube.com https://s.ytimg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.clerk.accounts.dev https://*.clerk.com https://img.clerk.com https://images.clerk.dev https://i.ytimg.com https://*.youtube.com https://*.gravatar.com https://gravatar.com",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.programiz.com",
              "connect-src 'self' https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.clerk.com https://*.youtube.com https://*.ytimg.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Allow images from Clerk and YouTube thumbnail CDNs
  images: {
    domains: ["img.clerk.com", "images.clerk.dev", "i.ytimg.com", "secure.gravatar.com", "gravatar.com"],
  },
};

module.exports = nextConfig;
