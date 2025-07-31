{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:security/recommended"
  ],
  "plugins": [
    "security",
    "react",
    "react-hooks",
    "@typescript-eslint"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    },
    "project": "./tsconfig.json"
  },
  "env": {
    "browser": true,
    "es2022": true,
    "jest": true
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "rules": {
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "off",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-new-buffer": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-non-literal-fs-filename": "off",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-non-literal-require": "off",
    "security/detect-object-injection": "warn",
    "security/detect-possible-timing-attacks": "warn",
    "security/detect-pseudoRandomBytes": "error",
    "security/detect-unsafe-regex": "error",
    
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",
    
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react/no-danger": "error",
    "react/no-danger-with-children": "error",
    "react/no-direct-mutation-state": "error",
    "react/no-unsafe": "error",
    "react/jsx-no-script-url": "error",
    "react/jsx-no-target-blank": ["error", { "enforceDynamicLinks": "always" }],
    "react/jsx-no-comment-textnodes": "error",
    "react/jsx-no-duplicate-props": "error",
    "react/jsx-no-undef": "error",
    "react/no-unescaped-entities": "error",
    
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    
    "no-console": "warn",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",
    "prefer-const": "error",
    "no-var": "error",
    
    "eqeqeq": ["error", "always"],
    "no-eq-null": "error",
    "radix": "error",
    "guard-for-in": "error"
  },
  "overrides": [
    {
      "files": ["*.test.tsx", "*.test.ts", "src/__tests__/**/*", "src/**/*.test.*"],
      "rules": {
        "no-console": "off",
        "@typescript-eslint/explicit-function-return-type": "off"
      }
    }
  ]
}