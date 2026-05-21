const {getDefaultConfig} = require('expo/metro-config');
const {withNativeWind} = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Exclude test files from the bundle
config.resolver.blockList = [
    ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
    /.*\.test\.[jt]sx?$/,
    /.*\.spec\.[jt]sx?$/,
    /.*\/__tests__\/.*/,
];

module.exports = withNativeWind(config, {input: './global.css'});
