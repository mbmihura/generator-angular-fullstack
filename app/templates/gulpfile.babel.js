// Generated on <%= (new Date).toISOString().split('T')[0] %> using <%= pkg.name %> <%= pkg.version %>
'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var http = require('http');
var openURL = require('open');
var lazypipe = require('lazypipe');
var wiredep = require('wiredep').stream;
var nodemon = require('nodemon');
var runSequence = require('run-sequence');
var path = require('path');<% if(filters.stylus) { %>
var nib = require('nib');<% } %>
var config;

var yeoman = {
  app: require('./bower.json').appPath || 'app',
  dist: 'dist'
};

var paths = {
  client: {
    scripts: [yeoman.app + '/scripts/**/*.<% if(filters.coffee) { %>coffee<% } else { %>js<% } %>'],
    styles: [yeoman.app + '/styles/**/*.<% if(filters.stylus) { %>styl<% } else if (filters.sass) { %>scss<% } else { %>css<% } %>'],
    test: ['test/client/**/*.<% if(filters.coffee) { %>coffee<% } else { %>js<% } %>'],
    testRequire: [
      yeoman.app + '/bower_components/angular/angular.js',
      yeoman.app + '/bower_components/angular-mocks/angular-mocks.js',
      yeoman.app + '/bower_components/angular-resource/angular-resource.js',
      yeoman.app + '/bower_components/angular-cookies/angular-cookies.js',
      yeoman.app + '/bower_components/angular-sanitize/angular-sanitize.js',
      yeoman.app + '/bower_components/angular-route/angular-route.js',<% if(filters.coffee) { %>
      'test/mock/**/*.coffee',
      'test/spec/**/*.coffee'<% } else { %>
      'test/mock/**/*.js',
      'test/spec/**/*.js'<% } %>
    ]
  },
  server: {<% if(filters.coffee) { %>
    scripts: ['lib/**/*.coffee'],
    test: ['test/server/**/*.coffee'],<% } else { %>
    scripts: ['lib/**/*.js'],
    test: ['test/server/**/*.js'],<% } %>

  },
  views: {<% if(filters.jade) { %>
    main: yeoman.app + '/views/index.jade',
    files: [yeoman.app + '/views/**/*.jade']<% } else {%>
    main: yeoman.app + '/views/index.html',
    files: [yeoman.app + '/views/**/*.html']<% } %>
  },
  karma: 'karma.conf.js'
};

//////////////////////
// Helper functions //
//////////////////////

function onServerLog(log) {
  console.log(plugins.util.colors.white('[') + plugins.util.colors.yellow('nodemon') + plugins.util.colors.white('] ') + log.message);
}

function checkAppReady(cb) {
  var options = {
    host: 'localhost',
    port: config.port,
  };
  http.get(options, function() {
    cb(true);
  }).on('error', function() {
    cb(false);
  });
}

// Call page until first success
function whenServerReady (cb) {
  var serverReady = false;
  var appReadyInterval = setInterval(function () {
    checkAppReady(function(ready){
      if (!ready || serverReady) { return; }
      clearInterval(appReadyInterval);
      serverReady = true;
      cb();
    });
  }, 100);
}

////////////////////////
// Reusable pipelines //
////////////////////////

var lintScripts = lazypipe()<% if(filters.coffee) { %>
  .pipe(plugins.coffeelint)
  .pipe(plugins.coffeelint.reporter);<% } else { %>
  .pipe(plugins.jshint, '.jshintrc')
  .pipe(plugins.jshint.reporter, 'jshint-stylish');<% } %>

var styles = lazypipe()<% if(filters.stylus) { %>
  .pipe(plugins.stylus, {
    use: [nib()],
    errors: true
  })<% } %><% if(filters.sass) { %>
  .pipe(plugins.rubySass, {
    style: 'expanded',
    precision: 10
  })<% } %>
  .pipe(plugins.autoprefixer, 'last 1 version')
  .pipe(gulp.dest, '.tmp/styles');

///////////
// Tasks //
///////////

gulp.task('styles', function () {
  return gulp.src(paths.client.styles)
    .pipe(styles());
});<% if(filters.coffee) { %>

gulp.task('coffee', function() {
  return gulp.src(paths.client.scripts)
    .pipe(lintScripts())
    .pipe(plugins.coffee({bare: true}).on('error', plugins.util.log))
    .pipe(gulp.dest('.tmp/scripts'));
});<% } %>

gulp.task('lint:scripts', function () {
  var scripts = paths.client.scripts.concat(paths.server.scripts);
  return gulp.src(scripts).pipe(lintScripts());
});

gulp.task('clean:tmp', function () {
  return gulp.src('.tmp', {read: false}).pipe(plugins.clean());
});

gulp.task('start:client', [<% if(filters.coffee) { %>'coffee', <% } %>'styles'], function (callback) {
  whenServerReady(function () {
    openURL('http://localhost:' + config.port);
    callback();
  });
});

gulp.task('start:server', function () {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  config = require('./lib/config/config');
  nodemon('-w lib server.js')
    .on('log', onServerLog);
});

gulp.task('watch', function () {
  var testFiles = paths.client.test.concat(paths.server.test);

  plugins.watch({glob: paths.client.styles})
    .pipe(plugins.plumber())
    .pipe(styles())
    .pipe(plugins.livereload());

  plugins.watch({glob: paths.views.files})
    .pipe(plugins.plumber())
    .pipe(plugins.livereload());

  plugins.watch({glob: paths.client.scripts})
    .pipe(plugins.plumber())
    .pipe(lintScripts())<% if(filters.coffee) { %>
    .pipe(plugins.coffee({bare: true}).on('error', plugins.util.log))
    .pipe(gulp.dest('.tmp/scripts'))<% } %>
    .pipe(plugins.livereload());

  plugins.watch({glob: paths.server.scripts.concat(testFiles)})
    .pipe(plugins.plumber())
    .pipe(lintScripts());

  gulp.watch('bower.json', ['bower']);
});

gulp.task('serve', function (callback) {
  runSequence('clean:tmp',
    ['lint:scripts'],
    ['start:server', 'start:client'],
    'watch', callback);
});

gulp.task('test:server', function () {
  process.env.NODE_ENV = 'test';
  return gulp.src(paths.server.test)
    .pipe(plugins.mocha({reporter: 'spec'}));
});

gulp.task('test:client', function () {
  var testFiles = paths.client.testRequire.concat(paths.client.test)
  gulp.src(testFiles)
    .pipe(plugins.karma({
      configFile: paths.karma,
      action: 'watch'
    }));
});

// inject bower components
gulp.task('bower', function () {
  return gulp.src(paths.views.main)
    .pipe(wiredep({
      directory: yeoman.app + '/bower_components',
      ignorePath: '..'
    }))
  .pipe(gulp.dest(yeoman.app + '/views/'));
});

///////////
// Build //
///////////

gulp.task('build', function (callback) {
  runSequence('clean:dist',
    ['images', 'copy:extras', 'copy:fonts', 'copy:server', 'client:build'],
    callback);
});

gulp.task('clean:dist', function () {
  return gulp.src('dist', {read: false}).pipe(plugins.clean());
});

gulp.task('client:build', ['html'], function () {
  var jsFilter = plugins.filter('**/*.js');
  var cssFilter = plugins.filter('**/*.css');<% if(filters.jade) { %>
  var assets = plugins.filter('**/*.{js,css}');<% } %>

  return gulp.src(paths.views.main)<% if(filters.jade) { %>
    .pipe(plugins.jade({pretty: true}))<% } %>
    .pipe(plugins.useref.assets({searchPath: [yeoman.app, '.tmp']}))
    .pipe(jsFilter)
    .pipe(plugins.ngmin())
    .pipe(plugins.uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe(plugins.minifyCss({cache: true}))
    .pipe(cssFilter.restore())
    .pipe(plugins.rev())
    .pipe(plugins.useref.restore())
    .pipe(plugins.revReplace())
    .pipe(plugins.useref())<% if(filters.jade) { %>
    .pipe(assets)<% } %>
    .pipe(gulp.dest(yeoman.dist + '/public'));
});

gulp.task('html', function () {
  return gulp.src(yeoman.app + '/views/**/*')
    .pipe(gulp.dest(yeoman.dist + '/public/views'));
});

gulp.task('images', function () {
  return gulp.src(yeoman.app + '/images/**/*')
    .pipe(plugins.cache(plugins.imagemin({
        optimizationLevel: 5,
        progressive: true,
        interlaced: true
    })))
    .pipe(gulp.dest(yeoman.dist + '/public/images'));
});

gulp.task('copy:extras', function () {
  return gulp.src(yeoman.app + '/*.*', { dot: true })
    .pipe(gulp.dest(yeoman.dist + '/public'));
});

gulp.task('copy:fonts', function () {
  return gulp.src(yeoman.app + '/fonts/**/*')
    .pipe(gulp.dest(yeoman.dist + '/fonts'));
});

gulp.task('copy:server', function(){
  return gulp.src([
    'package.json',
    'server.js',
    'lib/**/*'
  ], {cwdbase: true}).pipe(gulp.dest(yeoman.dist));
});
