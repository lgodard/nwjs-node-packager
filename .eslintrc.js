'use strict';

module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'script'
    },
    env: {
        es6: true,
        node: true
    },
    extends: 'eslint:recommended',
    rules: {
        //*** Programming best practices ***

        semi: ['error', 'always'],
        strict: ['error', 'safe'],
        'no-array-constructor': ['error'],

        'no-unused-vars': ['error', {args: 'none'}],

        // No redeclaration of existing restricted names and builtins
        'no-shadow-restricted-names': 'error',
        // No redeclaration of existing variables in outer scope
        'no-shadow': ['error', {builtinGlobals: true}],
        //
        // Interesting but produces less readable code …
        //'no-shadow': ['error', {builtinGlobals: true, hoist: 'all'}],

        // No dead code
        'no-unreachable': 'error',

        // Disallow gratuitous parentheses
        'no-extra-parens': ['error', 'all', {conditionalAssign: false}],

        // Take full advantage of JavaScript flexibility by being able, in a
        // function, to return different types (for exemple sometimes a boolean
        // and sometimes an object).
        'consistent-return': 'off',

        // Error best practices:
        // Only throw Error instances
        'no-throw-literal': 'error',
        // Only reject Error instances
        'prefer-promise-reject-errors': 'error',

        // Switch-case best practices
        'default-case': 'error',
        'no-fallthrough': 'error',
        'no-case-declarations': 'error',

        // Enforces return statements in callbacks of array's methods
        'array-callback-return': 'error',

        // TODO: allow console, replace it
        'no-console': 'off',

        //*** Presentation style ***

        indent: ['error', 4],
        quotes: ['error', 'single', {avoidEscape: true}],
        'quote-props': ['error', 'as-needed'],

        // Use snake_case for variable names and camelCase for function names
        camelcase: 'off',

        'new-cap': 'error',

        'no-multiple-empty-lines': ['error', {max: 2}],
        'no-trailing-spaces': 'error',
        'comma-spacing': ['error', {before: false, after: true}],
        'space-in-parens': ['error', 'never'],
        'keyword-spacing': 'error',
        'space-before-blocks': 'error',
        'space-infix-ops': 'error',
        'space-before-function-paren': ['error', 'never'],
        'no-spaced-func': 'error',
        'no-multi-spaces': 'error',
        'space-unary-ops': 'error',
        'object-curly-spacing': ['error', 'never'],
        'array-bracket-spacing': ['error', 'never'],
        'brace-style': ['error', '1tbs'],
        curly: ['error', 'all'],

        // Don't use "var", only use "let" and "const"
        'no-var': 'error',
        // Use const if a variable is never reassigned
        'prefer-const': 'error',

        // Use arrow functions instead of callbacks
        'prefer-arrow-callback': 'error',

        // Require method and property shorthand syntax for object literals
        'object-shorthand': 'error',

        // Disallows unnecessary return await
        'no-return-await': 'error',

        // Disallow async functions which have no await expression
        'require-await': 'error',

        // Disallow await inside of loops
        'no-await-in-loop': 'error',

        // Disallow using an async function as a Promise executor
        'no-async-promise-executor': 'error',

    }

};
