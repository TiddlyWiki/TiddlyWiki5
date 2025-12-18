module.exports = function() {
  var onCompleteCallback = function() {};
  var completed = false;

  this.onComplete = function(callback) {
    onCompleteCallback = callback;
  };

  this.jasmineStarted = function() {
    if (this.exitHandler) {
      process.on('exit', this.exitHandler);
    }
  };

  this.jasmineDone = function(result) {
    completed = true;
    if (this.exitHandler) {
      process.removeListener('exit', this.exitHandler);
    }

    onCompleteCallback(result.overallStatus === 'passed');
  };

  this.isComplete = function() {
    return completed;
  };

  this.exitHandler = null;
};
