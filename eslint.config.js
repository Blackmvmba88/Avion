import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                performance: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                HTMLElement: 'readonly',
                localStorage: 'readonly',
                navigator: 'readonly',
                fetch: 'readonly',
                WebSocket: 'readonly',
                URL: 'readonly',
                Blob: 'readonly',
                FileReader: 'readonly',
                Image: 'readonly',
                Event: 'readonly',
                KeyboardEvent: 'readonly',
                MouseEvent: 'readonly',
                TouchEvent: 'readonly',
                DeviceOrientationEvent: 'readonly',
                Gamepad: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { 
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            'no-console': 'off',
            'semi': ['error', 'always'],
            'quotes': ['warn', 'single', { avoidEscape: true }],
            'indent': ['warn', 4, { SwitchCase: 1 }],
            'no-multiple-empty-lines': ['warn', { max: 2 }],
            'eol-last': ['warn', 'always']
        }
    },
    {
        ignores: ['dist/**', 'node_modules/**', '*.min.js']
    }
];
