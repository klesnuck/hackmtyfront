// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // react-hooks/immutability (from the React Compiler ESLint rules bundled
    // in eslint-config-expo) flags react-native-reanimated's `sharedValue.value
    // = x` as an illegal mutation. That IS Reanimated's real, documented API —
    // shared values are an intentional escape hatch, not React state — so this
    // rule is a false positive for any file using useSharedValue/useAnimatedStyle.
    // See src/theme/motion.ts for this project's animation approach.
    rules: {
      "react-hooks/immutability": "off",
    },
  },
]);
