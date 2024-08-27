/*\
title: $:/plugins/tiddlywiki/multiwikiserver/modules/test-attachment.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests attachments.

\*/
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var AttachmentStore = require('$:/plugins/tiddlywiki/multiwikiserver/store/attachments.js').AttachmentStore;
const {Buffer} = require('buffer');

function generateFileWithSize(filePath, sizeInBytes) {
  return new Promise((resolve, reject) => {
    var buffer = Buffer.alloc(sizeInBytes);
    for(var i = 0; i < sizeInBytes; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }

    fs.writeFile(filePath, buffer, (err) => {
      if(err) {
        console.error('Error writing file:', err);
        reject(err);
      } else {
        console.log('File '+filePath+' generated with size '+sizeInBytes+' bytes');
        fs.readFile(filePath, (err, data) => {
          if(err) {
            console.error('Error reading file:', err);
            reject(err);
          } else {
            resolve(data);
          }
        });
      }
    });
  });
}

(function() {
'use strict';
if($tw.node) {
  describe('AttachmentStore', function() {
    var storePath = './editions/test/test-store';
    var attachmentStore = new AttachmentStore({ storePath: storePath });
    var originalTimeout;

    beforeAll(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
    });

    afterAll(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
      fs.readdirSync(storePath).forEach(function(file) {
        var filePath = path.join(storePath, file);
        if(fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        } else if(fs.lstatSync(filePath).isDirectory()) {
          fs.rmdirSync(filePath, { recursive: true });
        }
      });
    });

    it('isValidAttachmentName', function() {
      expect(attachmentStore.isValidAttachmentName('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')).toBe(true);
      expect(attachmentStore.isValidAttachmentName('invalid-name')).toBe(false);
    });

    it('saveAttachment', function() {
      var options = {
        text: 'Hello, World!',
        type: 'text/plain',
        reference: 'test-reference',
      };
      var contentHash = attachmentStore.saveAttachment(options);
      assert.strictEqual(contentHash.length, 64);
      assert.strictEqual(fs.existsSync(path.resolve(storePath, 'files', contentHash)), true);
    });
  
    it('adoptAttachment', function() {
      var incomingFilepath = path.resolve(storePath, 'incoming-file.txt');
      fs.writeFileSync(incomingFilepath, 'Hello, World!');
      var type = 'text/plain';
      var hash = 'abcdef0123456789abcdef0123456789';
      var _canonical_uri = 'test-canonical-uri';
      attachmentStore.adoptAttachment(incomingFilepath, type, hash, _canonical_uri);
      expect(fs.existsSync(path.resolve(storePath, 'files', hash))).toBe(true);
    });
  
    it('getAttachmentStream', function() {
      var options = {
        text: 'Hello, World!',
        type: 'text/plain',
        filename: 'data.txt',
      };
      var contentHash = attachmentStore.saveAttachment(options);
      var stream = attachmentStore.getAttachmentStream(contentHash);
      expect(stream).not.toBeNull();
      expect(stream.type).toBe('text/plain');
    });

    it('getAttachmentFileSize', function() {
      var options = {
        text: 'Hello, World!',
        type: 'text/plain',
        reference: 'test-reference',
      };
      var contentHash = attachmentStore.saveAttachment(options);
      var fileSize = attachmentStore.getAttachmentFileSize(contentHash);
      expect(fileSize).toBe(13);
    });

    it('getAttachmentMetadata', function() {
      var options = {
        text: 'Hello, World!',
        type: 'text/plain',
        filename: 'data.txt',
      };
      var contentHash = attachmentStore.saveAttachment(options);
      var metadata = attachmentStore.getAttachmentMetadata(contentHash);
      expect(metadata).not.toBeNull();
      expect(metadata.type).toBe('text/plain');
      expect(metadata.filename).toBe('data.txt');
    });

    it('saveAttachment large file', async function() {
      var sizeInMB = 10
      const file = await generateFileWithSize('./editions/test/test-store/large-file.txt', 1024 * 1024 * sizeInMB)
      var options = {
        text: file,
        type: 'application/octet-stream',
        reference: 'test-reference',
      };
      var contentHash = attachmentStore.saveAttachment(options);
      assert.strictEqual(contentHash.length, 64);
      assert.strictEqual(fs.existsSync(path.resolve(storePath, 'files', contentHash)), true);
    });

    it('saveAttachment multiple large files', async function() {
      var sizeInMB = 10;
      var numFiles = 5;
      for (var i = 0; i < numFiles; i++) {
        const file = await generateFileWithSize(`./editions/test/test-store/large-file-${i}.txt`, 1024 * 1024 * sizeInMB);
        var options = {
          text: file,
          type: 'application/octet-stream',
          reference: `test-reference-${i}`,
        };
        var contentHash = attachmentStore.saveAttachment(options);
        assert.strictEqual(contentHash.length, 64);
        assert.strictEqual(fs.existsSync(path.resolve(storePath, 'files', contentHash)), true);
      }
    });

    it('getAttachmentStream multiple large files', async function() {
      var sizeInMB = 10;
      var numFiles = 5;
      for (var i = 0; i < numFiles; i++) {
        const file = await generateFileWithSize(`./editions/test/test-store/large-file-${i}.txt`, 1024 * 1024 * sizeInMB);
        var options = {
          text: file,
          type: 'application/octet-stream',
          reference: `test-reference-${i}`,
        };
        var contentHash = attachmentStore.saveAttachment(options);
        var stream = attachmentStore.getAttachmentStream(contentHash);
        assert.notStrictEqual(stream, null);
        assert.strictEqual(stream.type, 'application/octet-stream');
      }
    });
  });
}
})();
