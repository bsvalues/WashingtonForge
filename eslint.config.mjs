import eslintConfigPrettier from "eslint-config-prettier";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [".next/", "node_modules/", "out/", "dist/"],
  },
  ...tseslint.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // Allow unused vars prefixed with underscore
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Allow any for prototype speed (tighten later)
      "@typescript-eslint/no-explicit-any": "warn",
      // Prefer const
      "prefer-const": "error",
      // No console in production
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  // ============================================
  // DATA SUITE BOUNDARY RULES
  // ============================================
  // The Data Suite is the SINGLE AUTHORITY for all data operations.
  // UI components should NEVER import directly from:
  //   - @/lib/api (legacy direct uploads)
  //   - @/lib/wa-data/client (bypasses hub)
  // 
  // Instead, import from @/lib/data-suite which routes through the hub.
  // 
  // To enforce at compile time, add eslint-plugin-import-access:
  //   npm install eslint-plugin-import-access
  // Then uncomment the rules below.
  // ============================================
  // {
  //   files: ["app/**/*.tsx", "components/**/*.tsx"],
  //   rules: {
  //     "no-restricted-imports": [
  //       "error",
  //       {
  //         patterns: [
  //           {
  //             group: ["@/lib/api", "@/lib/api/*"],
  //             message: "Use @/lib/data-suite instead. Direct API imports bypass the DataSuiteHub.",
  //           },
  //           {
  //             group: ["@/lib/wa-data/client"],
  //             message: "Use @/lib/data-suite instead. Direct wa-data imports bypass the DataSuiteHub.",
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // },
  eslintConfigPrettier,
];
