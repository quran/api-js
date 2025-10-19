import baseConfig, { restrictEnvAccess } from "@quranjs/eslint-config/base";
import nextjsConfig from "@quranjs/eslint-config/nextjs";
import reactConfig from "@quranjs/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];