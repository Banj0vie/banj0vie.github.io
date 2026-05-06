module.exports = function override(config, env) {
  // Silence sourcemap warnings from third-party packages that ship sourcemaps
  // referencing .ts files which aren't included in their published npm bundle.
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    /Failed to parse source map/,
  ];
  return config;
};
