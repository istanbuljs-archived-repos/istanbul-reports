istanbul-reports
================

[![Greenkeeper badge](https://badges.greenkeeper.io/istanbuljs/istanbul-reports.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/istanbuljs/istanbul-reports.svg?branch=master)](https://travis-ci.org/istanbuljs/istanbul-reports)


## Reporters

- clover
- cobertura
- html
- json-summary
- json
- lcov
- lcovonly
- none
- teamcity
- text-lcov
- text-summary
- text


## Development

These are common methods used in the reporters:

* node.getRelativeName
* context.getSource(filePath)
* context.classForPercent(type, percent)
* context.console.colorize(str, class)
* context.writer
* context.console.write
* context.console.println
