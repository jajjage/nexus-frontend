import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  // setupFiles runs before the test framework is installed in the environment
  setupFiles: ["<rootDir>/jest.polyfills.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "until-async": "<rootDir>/__mocks__/until-async.js",
  },
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
    "**/__test__/**/*.[jt]s?(x)",
  ],
  testPathIgnorePatterns: ["<rootDir>/e2e/"],
};

export default createJestConfig(config)
