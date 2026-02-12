import { defineConfig } from 'eslint/config';
import eslintPlugin from '@eslint/js';
import { configs as tseslintConfigs } from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import nextPlugin from '@next/eslint-plugin-next';

// Global ignores
const ignoresConfig = defineConfig([{
  name: 'project/ignores',
  ignores: [
    '.next/',
    'node_modules/',
    'public/',
    '.vscode/',
    'next-env.d.ts',
  ],
}]);

// ESLint recommended rules
const eslintConfig = defineConfig([{
  name: 'project/javascript-recommended',
  files: ['**/*.{js,mjs,ts,tsx}'],
  ...eslintPlugin.configs.recommended,
}]);

// TypeScript configuration
const typescriptConfig = defineConfig([{
  name: 'project/typescript',
  files: ['**/*.{ts,tsx}'],
  extends: [
    ...tseslintConfigs.recommended,
  ],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
}]);

// React and Next.js configuration
const reactConfig = defineConfig([{
  name: 'project/react-next',
  files: ['**/*.{jsx,tsx}'],
  plugins: {
    'react': reactPlugin,
    'react-hooks': reactHooksPlugin,
    'jsx-a11y': jsxA11yPlugin,
    '@next/next': nextPlugin,
  },
  rules: {
    ...reactPlugin.configs.recommended.rules,
    ...reactPlugin.configs['jsx-runtime'].rules,
    ...reactHooksPlugin.configs['recommended-latest'].rules,
    ...jsxA11yPlugin.configs.recommended.rules,
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs['core-web-vitals'].rules,
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}]);

export default defineConfig([
  ...ignoresConfig,
  ...eslintConfig,
  ...typescriptConfig,
  ...reactConfig,
]);
