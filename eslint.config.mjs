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
  // DATA SUITE BOUNDARY RULES (PERMANENT - DO NOT DISABLE)
  // ============================================
  // The Data Suite is the SINGLE AUTHORITY for all data operations.
  // This rule ensures "zero cycles forever" - the architectural guardrail
  // that keeps data operations sovereign and auditable.
  // ============================================
  {
    files: ["lib/data-suite/**/*.ts", "lib/data-suite/**/*.tsx"],
    rules: {
      // data-suite MUST NEVER import from lib/api (would create cycle)
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/api", "@/lib/api/*", "../api", "../api/*"],
              message: "data-suite cannot import from lib/api. This would create a circular dependency.",
            },
          ],
        },
      ],
    },
  },
  // ============================================
  // API SHIM IMPORT DISCIPLINE (PERMANENT)
  // ============================================
  // lib/api must ONLY import from the api-internal barrel, not deep paths.
  // This prevents import drift and ensures the adapter controls exports.
  // Block ALL deep paths: demo-client, types, adapter, etc.
  // ============================================
  {
    files: ["lib/api/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Block all deep imports into api-internal (barrel only)
              group: [
                "@/lib/api-internal/*",
                "../api-internal/*",
                "../../api-internal/*",
              ],
              message: "Import from @/lib/api-internal (barrel) not deep paths. Barrel controls the public surface.",
            },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
];
