#!/usr/bin/env node

const { compile } = require('nexe')


console.log('Building Executable for Linux x64')
compile({
  input: './tiddlywiki.js',
  output: 'tiddlywiki',
  targets: 'linux-x64',
  resources: ['./plugins/**/*', './themes/**/*', './editions/**/*', './languages/**/*']
}).then(() => {
  console.log('Building Executable for Linux x32')
  return compile({
    input: './tiddlywiki.js',
    output: 'tiddlywiki',
    targets: 'linux-x32',
    resources: ['./plugins/**/*', './themes/**/*', './editions/**/*', './languages/**/*']
  })
}).then(() => {
  console.log('Building Executable for OSX x64')
  return compile({
    input: './tiddlywiki.js',
    output: 'tiddlywiki.command',
    targets: 'mac-x64',
    resources: ['./plugins/**/*', './themes/**/*', './editions/**/*', './languages/**/*']
  })
}).then(() => {
  console.log('Building Executable for Windows x64')
  return compile({
    input: './tiddlywiki.js',
    output: 'tiddlywiki.exe',
    targets: 'windows-x64',
    resources: ['./plugins/**/*', './themes/**/*', './editions/**/*', './languages/**/*']
  })
}).then(() => {
  console.log('Building Executable for Windows x32')
  return compile({
    input: './tiddlywiki.js',
    output: 'tiddlywiki.exe',
    targets: 'windows-x32',
    resources: ['./plugins/**/*', './themes/**/*', './editions/**/*', './languages/**/*']
  })
}).then(() => {
  console.log('done')
}).catch((e) => {console.log('error?', e)})

