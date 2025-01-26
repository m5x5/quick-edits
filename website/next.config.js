const { i18n } = require("./next-i18next.config");
const fs = require("fs");
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    compilationMode: 'annotation',
  },
  webpack: (config) => {
    config.resolve.symlinks = true;
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/browser-extension': path.resolve(__dirname, './node_modules/@browser-extension/src'),
      '@/browser-extension/core': path.resolve(__dirname, './node_modules/@browser-extension/src/core')
    };
    return config;
  },
  i18n,
  async redirects() {
    const redirects = [];

    fs.readdirSync("./src/components/posts").forEach((file) => {
      if (file.endsWith(".mdx") || file.endsWith(".md")) {
        const name = file.replace(".mdx", "").replace(".md", "");
        redirects.push({
          source: "/blog/latest",
          destination: "/blog/" + name,
          permanent: true,
        });
      }
    });

    return redirects;
  },
};

module.exports = nextConfig;
