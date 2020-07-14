#!/usr/bin/env node

const { compile } = require('nexe')


console.log('Building Executable for Windows x32')
compile({
  input: './tiddlywiki.js',
  output: 'tiddlywiki.exe',
  targets: 'windows-x32',
  resources: ['./plugins/**/*', './themes/**/*', './editions/**/*', './languages/**/*']
}).then(() => {
  console.log('done')
}).catch((e) => {console.log('error?', e)})

