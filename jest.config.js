'use strict';

const { join } = require('path');

module.exports = {
  roots: [
    'test'
  ],
  testEnvironment: 'node',
  testRegex: 'test/(.*/)*.*test.js$',
  coverageDirectory: './coverage/',
  collectCoverage: true,
  collectCoverageFrom: [
    'lib/**/*',
    'index.js',
    'custom.js',
    'appender.js',
    'custom-appender.js'
  ],
  moduleNameMapper: {
    '^clrsole$': join(__dirname, '..', 'clrsole')
  }
};
