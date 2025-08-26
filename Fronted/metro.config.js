const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for TypeScript files
config.resolver.sourceExts.push('ts', 'tsx');

// Add support for face recognition assets
config.resolver.assetExts.push('bin', 'txt', 'jpg', 'png', 'json');

module.exports = config;