var path = require('path'),
    util = require('util'),
    glob = require('glob'),
    CompletionReporter = require('./reporters/completion_reporter'),
    ConsoleSpecFilter = require('./filters/console_spec_filter');

module.exports = Jasmine;
module.exports.ConsoleReporter = require('./reporters/console_reporter');

function Jasmine(options) {
  options = options || {};
  var jasmineCore = options.jasmineCore || require('jasmine-core');
  this.jasmineCorePath = path.join(jasmineCore.files.path, 'jasmine.js');
  this.jasmine = jasmineCore.boot(jasmineCore);
  this.projectBaseDir = options.projectBaseDir || path.resolve();
  this.specDir = '';
  this.specFiles = [];
  this.helperFiles = [];
  this.requires = [];
  this.env = this.jasmine.getEnv({suppressLoadErrors: true});
  this.reportersCount = 0;
  this.completionReporter = new CompletionReporter();
  this.onCompleteCallbackAdded = false;
  this.exit = process.exit;
  this.showingColors = true;
  this.reporter = new module.exports.ConsoleReporter();
  this.addReporter(this.reporter);
  this.defaultReporterConfigured = false;

  var jasmineRunner = this;
  this.completionReporter.onComplete(function(passed) {
    jasmineRunner.exitCodeCompletion(passed);
  });
  this.checkExit = checkExit(this);

  this.coreVersion = function() {
    return jasmineCore.version();
  };
}

Jasmine.prototype.randomizeTests = function(value) {
  this.env.configure({random: value});
};

Jasmine.prototype.seed = function(value) {
  this.env.configure({seed: value});
};

Jasmine.prototype.showColors = function(value) {
  this.showingColors = value;
};

Jasmine.prototype.addSpecFile = function(filePath) {
  this.specFiles.push(filePath);
};

Jasmine.prototype.addReporter = function(reporter) {
  this.env.addReporter(reporter);
  this.reportersCount++;
};

Jasmine.prototype.clearReporters = function() {
  this.env.clearReporters();
  this.reportersCount = 0;
};

Jasmine.prototype.provideFallbackReporter = function(reporter) {
  this.env.provideFallbackReporter(reporter);
};

Jasmine.prototype.configureDefaultReporter = function(options) {
  options.timer = options.timer || new this.jasmine.Timer();
  options.print = options.print || function() {
    process.stdout.write(util.format.apply(this, arguments));
  };
  options.showColors = options.hasOwnProperty('showColors') ? options.showColors : true;
  options.jasmineCorePath = options.jasmineCorePath || this.jasmineCorePath;

  this.reporter.setOptions(options);
  this.defaultReporterConfigured = true;
};

Jasmine.prototype.addMatchers = function(matchers) {
  this.env.addMatchers(matchers);
};

Jasmine.prototype.loadSpecs = function() {
  this.specFiles.forEach(function(file) {
    require(file);
  });
};

Jasmine.prototype.loadHelpers = function() {
  this.helperFiles.forEach(function(file) {
    require(file);
  });
};

Jasmine.prototype.loadRequires = function() {
  this.requires.forEach(function(r) {
    require(r);
  });
};

Jasmine.prototype.loadConfigFile = function(configFilePath) {
  try {
    var absoluteConfigFilePath = path.resolve(this.projectBaseDir, configFilePath || 'spec/support/jasmine.json');
    var config = require(absoluteConfigFilePath);
    this.loadConfig(config);
  } catch (e) {
    if(configFilePath || e.code != 'MODULE_NOT_FOUND') { throw e; }
  }
};

Jasmine.prototype.loadConfig = function(config) {
  this.specDir = config.spec_dir || this.specDir;

  var configuration = {};

  if (config.stopSpecOnExpectationFailure !== undefined) {
    configuration.oneFailurePerSpec = config.stopSpecOnExpectationFailure;
  }

  if (config.stopOnSpecFailure !== undefined) {
    configuration.failFast = config.stopOnSpecFailure;
  }

  if (config.random !== undefined) {
    configuration.random = config.random;
  }

  if (Object.keys(configuration).length > 0) {
    this.env.configure(configuration);
  }

  if(config.helpers) {
    this.addHelperFiles(config.helpers);
  }

  if(config.requires) {
    this.addRequires(config.requires);
  }

  if(config.spec_files) {
    this.addSpecFiles(config.spec_files);
  }
};

Jasmine.prototype.addHelperFiles = addFiles('helperFiles');
Jasmine.prototype.addSpecFiles = addFiles('specFiles');

Jasmine.prototype.addRequires = function(requires) {
  var jasmineRunner = this;
  requires.forEach(function(r) {
    jasmineRunner.requires.push(r);
  });
};

function addFiles(kind) {
  return function (files) {
    var jasmineRunner = this;
    var fileArr = this[kind];

    var includeFiles = [];
    var excludeFiles = [];
    files.forEach(function(file) {
      if (file.startsWith('!')) {
        var excludeFile = file.substring(1);
        if(!(path.isAbsolute && path.isAbsolute(excludeFile))) {
          excludeFile = path.join(jasmineRunner.projectBaseDir, jasmineRunner.specDir, excludeFile);
        }

        excludeFiles.push(excludeFile);
      } else {
        includeFiles.push(file);
      }
    });

    includeFiles.forEach(function(file) {
      if(!(path.isAbsolute && path.isAbsolute(file))) {
        file = path.join(jasmineRunner.projectBaseDir, jasmineRunner.specDir, file);
      }
      var filePaths = glob.sync(file, { ignore: excludeFiles });
      filePaths.forEach(function(filePath) {
        // glob will always output '/' as a segment separator but the fileArr may use \ on windows
        // fileArr needs to be checked for both versions
        if(fileArr.indexOf(filePath) === -1 && fileArr.indexOf(path.normalize(filePath)) === -1) {
          fileArr.push(filePath);
        }
      });
    });
  };
}

Jasmine.prototype.onComplete = function(onCompleteCallback) {
  this.completionReporter.onComplete(onCompleteCallback);
};

Jasmine.prototype.stopSpecOnExpectationFailure = function(value) {
  this.env.configure({oneFailurePerSpec: value});
};

Jasmine.prototype.stopOnSpecFailure = function(value) {
  this.env.configure({failFast: value});
};

Jasmine.prototype.exitCodeCompletion = function(passed) {
  var jasmineRunner = this;
  var streams = [process.stdout, process.stderr];
  var writesToWait = streams.length;
  streams.forEach(function(stream) {
    stream.write('', null, exitIfAllStreamsCompleted);
  });
  function exitIfAllStreamsCompleted() {
    writesToWait--;
    if (writesToWait === 0) {
      if(passed) {
        jasmineRunner.exit(0);
      }
      else {
        jasmineRunner.exit(1);
      }
    }
  }
};

var checkExit = function(jasmineRunner) {
  return function() {
    if (!jasmineRunner.completionReporter.isComplete()) {
      process.exitCode = 4;
    }
  };
};

Jasmine.prototype.execute = function(files, filterString) {
  this.completionReporter.exitHandler = this.checkExit;

  this.loadRequires();
  this.loadHelpers();
  if (!this.defaultReporterConfigured) {
    this.configureDefaultReporter({ showColors: this.showingColors });
  }

  if(filterString) {
    var specFilter = new ConsoleSpecFilter({
      filterString: filterString
    });
    this.env.configure({specFilter: function(spec) {
      return specFilter.matches(spec.getFullName());
    }});
  }

  if (files && files.length > 0) {
    this.specDir = '';
    this.specFiles = [];
    this.addSpecFiles(files);
  }

  this.loadSpecs();

  this.addReporter(this.completionReporter);
  this.env.execute();
};
