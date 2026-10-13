export default {
    preset: 'ts-jest/presets/js-with-ts',
    testEnvironment: 'jest-environment-jsdom',
    testTimeout: 15000,
    maxWorkers: 2,
    // Only *.test.ts(x) files are suites; src/__tests__/helpers/ holds shared test utilities
    testMatch: ['<rootDir>/src/__tests__/**/*.test.{ts,tsx}'],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.test.json',
            // TS1343: `import.meta` is rewritten to `process.env` by the transformer below, so the CommonJS module check is moot
            diagnostics: {ignoreCodes: [1343]},
            astTransformers: {before: [{path: '<rootDir>/jest/importMetaTransformer.cjs'}]}
        }],
    },
    moduleNameMapper: {
        // Deep antd imports (antd/es/...) are ESM and pull ESM @babel/runtime helpers; the CommonJS build is equivalent
        '^antd/es/(.*)$': '<rootDir>/node_modules/antd/lib/$1',
        '^@vempain/vempain-auth-frontend$': '<rootDir>/node_modules/@vempain/vempain-auth-frontend/dist/index.js',
        // The rich-text editor ships an ESM-only build; the stub keeps the props contract (value/onChange/onEmbedsChange/dataProviders)
        '^@vempain/vempain-rt-editor$': '<rootDir>/__mocks__/@vempain/vempain-rt-editor.tsx',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js'
    },
    modulePaths: [
        '<rootDir>/src'
    ],
    setupFilesAfterEnv: [
        '<rootDir>/src/setupTests.ts'
    ],
    moduleDirectories: [
        'node_modules'
    ],
    transformIgnorePatterns: [
        '/node_modules/(?!(@vempain/vempain-auth-frontend|@vempain/vempain-common-frontend|@ant-design|antd|rc-virtual-list))'
    ]
};
