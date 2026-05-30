import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config, { webpack }) {
    // Polyfill Buffer with buffer@6 so readBigInt64BE is available in browsers.
    // Required by @stellar/js-xdr when deserializing Int64 XDR values.
    config.plugins.push(
      new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
    );
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve("buffer"),
    };
    return config;
  },
};

export default nextConfig;
