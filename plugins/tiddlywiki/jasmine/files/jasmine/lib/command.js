var path = require('path'),
    fs = require('fs');

exports = module.exports = Command;

var subCommands = {
  init: {
    description: 'initialize jasmine',
    action: initJasmine
  },
  examples: {
    description: 'install examples',
    action: installExamples
  },
  help: {
    description: 'show help',
    action: help,
    alias: '-h'
  },
  version: {
    description: 'show jasmine and jasmine-core versions',
    action: version,
    alias: '-v'
  }
};

function Command(projectBaseDir, examplesDir, print) {
  this.projectBaseDir = projectBaseDir;
  this.specDir = path.join(projectBaseDir, 'spec');

  var command = this;

  this.run = function(jasmine, commands) {
    setEnvironmentVariables(commands);

    var commandToRun;
    Object.keys(subCommands).forEach(function(cmd) {
      var commandObject = subCommands[cmd];
        if (commands.indexOf(cmd) >= 0) {
        commandToRun = commandObject;
      } else if(commandObject.alias && commands.indexOf(commandObject.alias) >= 0) {
        commandToRun = commandObject;
      }
    });

    if (commandToRun) {
      commandToRun.action({jasmine: jasmine, projectBaseDir: command.projectBaseDir, specDir: command.specDir, examplesDir: examplesDir, print: print});
    } else {
      var env = parseOptions(commands);
      if (env.unknownOptions.length > 0) {
        process.exitCode = 1;
        print('Unknown options: ' + env.unknownOptions.join(', '));
        print('');
        help({print: print});
      } else {
        runJasmine(jasmine, env, print);
      }
    }
  };
}

function isFileArg(arg) {
  return arg.indexOf('--') !== 0 && !isEnvironmentVariable(arg);
}

function parseOptions(argv) {
  var files = [],
      helpers = [],
      requires = [],
      unknownOptions = [],
      color = process.stdout.isTTY || false,
      reporter,
      configPath,
      filter,
      stopOnFailure,
      failFast,
      random,
      seed;

  argv.forEach(function(arg) {
    if (arg === '--no-color') {
      color = false;
    } else if (arg === '--color') {
      color = true;
    } else if (arg.match("^--filter=")) {
      filter = arg.match("^--filter=(.*)")[1];
    } else if (arg.match("^--helper=")) {
      helpers.push(arg.match("^--helper=(.*)")[1]);
    } else if (arg.match("^--require=")) {
      requires.push(arg.match("^--require=(.*)")[1]);
    } else if (arg.match("^--stop-on-failure=")) {
      stopOnFailure = arg.match("^--stop-on-failure=(.*)")[1] === 'true';
    } else if (arg.match("^--fail-fast=")) {
      failFast = arg.match("^--fail-fast=(.*)")[1] === 'true';
    } else if (arg.match("^--random=")) {
      random = arg.match("^--random=(.*)")[1] === 'true';
    } else if (arg.match("^--seed=")) {
      seed = arg.match("^--seed=(.*)")[1];
    } else if (arg.match("^--config=")) {
      configPath = arg.match("^--config=(.*)")[1];
    } else if (arg.match("^--reporter=")) {
      reporter = arg.match("^--reporter=(.*)")[1];
    } else if (isFileArg(arg)) {
      files.push(arg);
    } else if (!isEnvironmentVariable(arg)) {
      unknownOptions.push(arg);
    }
  });
  return {
    color: color,
    configPath: configPath,
    filter: filter,
    stopOnFailure: stopOnFailure,
    failFast: failFast,
    helpers: helpers,
    requires: requires,
    reporter: reporter,
    files: files,
    random: random,
    seed: seed,
    unknownOptions: unknownOptions
  };
}

function runJasmine(jasmine, env, print) {
  jasmine.loadConfigFile(env.configPath || process.env.JASMINE_CONFIG_PATH);
  if (env.stopOnFailure !== undefined) {
    jasmine.stopSpecOnExpectationFailure(env.stopOnFailure);
  }
  if (env.failFast !== undefined) {
    jasmine.stopOnSpecFailure(env.failFast);
  }
  if (env.seed !== undefined) {
    jasmine.seed(env.seed);
  }
  if (env.random !== undefined) {
    jasmine.randomizeTests(env.random);
  }
  if (env.helpers !== undefined && env.helpers.length) {
    jasmine.addHelperFiles(env.helpers);
  }
  if (env.requires !== undefined && env.requires.length) {
    jasmine.addRequires(env.requires);
  }
  if (env.reporter !== undefined) {
    try {
      var Report = require(env.reporter);
      var reporter = new Report();
      jasmine.clearReporters();
      jasmine.addReporter(reporter);
    } catch(e) {
      print('failed to register reporter "' + env.reporter + '"');
      print(e.message);
      print(e.stack);
    }
  }
  jasmine.showColors(env.color);
  jasmine.execute(env.files, env.filter);
}

function initJasmine(options) {
  var print = options.print;
  var specDir = options.specDir;
  makeDirStructure(path.join(specDir, 'support/'));
  if(!fs.existsSync(path.join(specDir, 'support/jasmine.json'))) {
    fs.writeFileSync(path.join(specDir, 'support/jasmine.json'), fs.readFileSync(path.join(__dirname, '../lib/examples/jasmine.json'), 'utf-8'));
  }
  else {
    print('spec/support/jasmine.json already exists in your project.');
  }
}

function installExamples(options) {
  var specDir = options.specDir;
  var projectBaseDir = options.projectBaseDir;
  var examplesDir = options.examplesDir;

  makeDirStructure(path.join(specDir, 'support'));
  makeDirStructure(path.join(specDir, 'jasmine_examples'));
  makeDirStructure(path.join(specDir, 'helpers', 'jasmine_examples'));
  makeDirStructure(path.join(projectBaseDir, 'lib', 'jasmine_examples'));

  copyFiles(
    path.join(examplesDir, 'spec', 'helpers', 'jasmine_examples'),
    path.join(specDir, 'helpers', 'jasmine_examples'),
    new RegExp(/[Hh]elper\.js/)
  );

  copyFiles(
    path.join(examplesDir, 'lib', 'jasmine_examples'),
    path.join(projectBaseDir, 'lib', 'jasmine_examples'),
    new RegExp(/\.js/)
  );

  copyFiles(
    path.join(examplesDir, 'spec', 'jasmine_examples'),
    path.join(specDir, 'jasmine_examples'),
    new RegExp(/[Ss]pec.js/)
  );
}

function help(options) {
  var print = options.print;
  print('Usage: jasmine [command] [options] [files]');
  print('');
  print('Commands:');
  Object.keys(subCommands).forEach(function(cmd) {
    var commandNameText = cmd;
    if(subCommands[cmd].alias) {
      commandNameText = commandNameText + ',' + subCommands[cmd].alias;
    }
    print('%s\t%s', lPad(commandNameText, 10), subCommands[cmd].description);
  });
  print('');
  print('If no command is given, jasmine specs will be run');
  print('');
  print('');

  print('Options:');
  print('%s\tturn off color in spec output', lPad('--no-color', 18));
  print('%s\tforce turn on color in spec output', lPad('--color', 18));
  print('%s\tfilter specs to run only those that match the given string', lPad('--filter=', 18));
  print('%s\tload helper files that match the given string', lPad('--helper=', 18));
  print('%s\tload module that match the given string', lPad('--require=', 18));
  print('%s\t[true|false] stop spec execution on expectation failure', lPad('--stop-on-failure=', 18));
  print('%s\t[true|false] stop Jasmine execution on spec failure', lPad('--fail-fast=', 18));
  print('%s\tpath to your optional jasmine.json', lPad('--config=', 18));
  print('%s\tpath to reporter to use instead of the default Jasmine reporter', lPad('--reporter=', 18));
  print('');
  print('The given arguments take precedence over options in your jasmine.json');
  print('The path to your optional jasmine.json can also be configured by setting the JASMINE_CONFIG_PATH environment variable');
}

function version(options) {
  var print = options.print;
  print('jasmine v' + require('../package.json').version);
  print('jasmine-core v' + options.jasmine.coreVersion());
}

function lPad(str, length) {
  if (str.length >= length) {
    return str;
  } else {
    return lPad(' ' + str, length);
  }
}

function copyFiles(srcDir, destDir, pattern) {
  var srcDirFiles = fs.readdirSync(srcDir);
  srcDirFiles.forEach(function(file) {
    if (file.search(pattern) !== -1) {
      fs.writeFileSync(path.join(destDir, file), fs.readFileSync(path.join(srcDir, file)));
    }
  });
}

function makeDirStructure(absolutePath) {
  var splitPath = absolutePath.split(path.sep);
  splitPath.forEach(function(dir, index) {
    if(index > 1) {
      var fullPath = path.join(splitPath.slice(0, index).join('/'), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath);
      }
    }
  });
}

function isEnvironmentVariable(command) {
  var envRegExp = /(.*)=(.*)/;
  return command.match(envRegExp);
}

function setEnvironmentVariables(commands) {
  commands.forEach(function (command) {
    var regExpMatch = isEnvironmentVariable(command);
    if(regExpMatch) {
      var key = regExpMatch[1];
      var value = regExpMatch[2];
      process.env[key] = value;
    }
  });
}
