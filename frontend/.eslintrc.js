module.exports = {
  extends: ['react-app'], // This already includes react-hooks, jsx-a11y, etc.
  plugins: ['prettier'], // Only add plugins that aren't already included
  rules: {
    'prettier/prettier': 'warn',
    // You can still customize react-hooks rules here if needed
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        paths: ['src'],
      },
    },
  },
};