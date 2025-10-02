module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for react-native-reanimated (updated for SDK 54)
      'react-native-worklets/plugin',
    ],
  };
};