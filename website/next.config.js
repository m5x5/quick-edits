const { i18n } = require("./next-i18next.config");
const fs = require("fs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    compilationMode: 'annotation',
  },
  i18n,
  async redirects() {
    let redirects = [];

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
