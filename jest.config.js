module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/scripts/"],
  collectCoverageFrom: ["<rootDir>/src/**/*.ts"],
};
