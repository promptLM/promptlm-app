import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@promptlm/api-client",
              importNames: [
                "PromptStoreService",
                "PromptSpecificationsService",
                "CapabilitiesService",
                "LlmCatalogService",
                "OpenAPI",
              ],
              message:
                "Do not import OpenAPI-generated service stubs in presentation components/pages. Call them via api-common contexts/hooks (integration layer) and pass view models/props to UI components.",
            },
          ],
          patterns: [
            {
              group: ["@promptlm/api-client/**/services/**", "@promptlm/api-client/**/core/**"],
              message:
                "Do not import OpenAPI-generated service/core modules in presentation components/pages. Use api-common contexts/hooks.",
            },
          ],
        },
      ],
    },
  },
);
