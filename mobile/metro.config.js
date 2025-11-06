// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.symbolicator = {
  customizeStack: (stack) => stack,
};

module.exports = config;