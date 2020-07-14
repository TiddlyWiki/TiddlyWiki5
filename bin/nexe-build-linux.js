#!/usr/bin/env node

const { compile } = require('nexe')


console.log('Building Executable for Linux x64')
compile({
  input: './tiddlywiki.js',
  output: 'tiddlywiki',
  targets: 'linux-x64',
  resources: ['./plugins/**/*', './themes/**/*', './editions/**/*', './languages/**/*']
}).then(() => {
  console.log('done')
}).catch((e) => {console.log('error?', e)})

