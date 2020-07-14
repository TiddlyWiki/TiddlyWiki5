#!/usr/bin/env node

const { compile } = require('nexe')


console.log('Building Executable for Linux x32')
compile({
  input: './tiddlywiki.js',
  output: 'tiddlywiki',
  targets: 'linux-x32',
  resources: ['./plugins/**/*', './themes/**/*', './editions/**/*', './languages/**/*']
}).then(() => {
  console.log('done')
}).catch((e) => {console.log('error?', e)})

