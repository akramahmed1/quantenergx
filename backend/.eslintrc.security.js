{
  "extends": [
    "eslint:recommended",
    "plugin:security/recommended",
    "plugin:@microsoft/sdl/node",
    "plugin:@microsoft/sdl/common"
  ],
  "plugins": [
    "security",
    "no-secrets",
    "@microsoft/sdl"
  ],
  "env": {
    "node": true,
    "es6": true,
    "jest": true
  },
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    // Security rules
    "security/detect-object-injection": "error",
    "security/detect-non-literal-regexp": "error",
    "security/detect-non-literal-fs-filename": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-pseudoRandomBytes": "error",
    "security/detect-possible-timing-attacks": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "warn",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-no-csrf-before-method-override": "error",
    
    // No secrets rules
    "no-secrets/no-secrets": ["error", {
      "tolerance": 4.2,
      "ignoreContent": [
        "test",
        "spec",
        "example",
        "demo",
        "localhost",
        "127.0.0.1",
        "your-api-key",
        "your-secret-key",
        "placeholder"
      ]
    }],
    
    // SDL rules
    "@microsoft/sdl/no-html-method": "error",
    "@microsoft/sdl/no-insecure-url": "error",
    "@microsoft/sdl/no-unsafe-alloc": "error",
    "@microsoft/sdl/no-weak-crypto-algorithm": "error",
    
    // Additional security-focused rules
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",
    "strict": ["error", "global"],
    
    // Input validation
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-undef": "error",
    "no-redeclare": "error",
    
    // Best practices for security
    "eqeqeq": ["error", "always"],
    "no-eq-null": "error",
    "radix": "error",
    "guard-for-in": "error",
    "no-extend-native": "error",
    "no-new-wrappers": "error",
    "no-throw-literal": "error",
    
    // Node.js specific security
    "no-path-concat": "error",
    "handle-callback-err": "error"
  },
  "overrides": [
    {
      "files": ["test/**/*.js", "**/*.test.js", "**/*.spec.js"],
      "rules": {
        "security/detect-non-literal-fs-filename": "off",
        "no-secrets/no-secrets": "off"
      }
    }
  ]
}