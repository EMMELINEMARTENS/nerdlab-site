'use strict';

// Plugins
const gulp = require("gulp");
const gnf = require("gulp-npm-files");
const browsersync = require("browser-sync").create();
const del = require("del");
const rename = require("gulp-rename");
const sass = require("gulp-sass")(require('sass'));
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const cheerio = require("gulp-cheerio");
const svgSymbols = require("gulp-svg-symbols");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const rev = require("gulp-rev");

// Config
const config = {
  browsersync: {
    proxy: 'http://nerdlab.test',
    notify: true,
    ghostMode: {
      clicks: true,
      location: true,
      forms: true,
      scroll: false
    }
  },
  icons: {
    title: '%f icon',
    svgAttrs: {
      class: 'c-icon-set',
    },
    templates: ['default-svg']
  },
  cheerio: {
    run: function ($) {
      $('[fill]').removeAttr('fill');
      $('defs').remove();
    },
    parserOptions: { xmlMode: true }
  },
  jsConcat: 'scripts.js'
};

// Paths
const paths = {
  vendor: 'web/assets/_vendor/',
  scssSrc: 'web/assets/_scss/**/*.scss',
  cssDist: 'web/assets/css/',
  revDist: 'web/build/',
  jsSrc: [
    'web/assets/_vendor/jquery/dist/jquery.min.js',
    'web/assets/_vendor/svgxuse/svgxuse.js',
    'web/assets/_vendor/picturefill/dist/picturefill.js',
    'web/assets/_vendor/lazysizes/lazysizes.js',
    'web/assets/_vendor/lazysizes/plugins/unveilhooks/ls.unveilhooks.js',
    'web/assets/js/_scripts/*.js'
  ],
  jsSrcProduction: [
    'web/assets/_vendor/jquery/dist/jquery.min.js',
    'web/assets/_vendor/svgxuse/svgxuse.js',
    'web/assets/_vendor/picturefill/dist/picturefill.js',
    'web/assets/_vendor/lazysizes/lazysizes.js',
    'web/assets/_vendor/lazysizes/plugins/unveilhooks/ls.unveilhooks.js',
    'web/assets/js/_scripts/*.js'
  ],
  jsDist: 'web/assets/js/',
  iconsSrc: '_artwork/icons/*.svg',
  iconsDist: 'web/assets/images/svg/',
  cssWatch: 'web/assets/_scss/**/*.scss',
  jsWatch: 'web/assets/js/_scripts/**/*.js',
  iconsWatch: '_artwork/icons/*.svg',
  siteWatch: [
    'craft/templates/**/*.html',
    'craft/templates/**/*.twig'
  ]
}

// Define tasks
function copyNpmDependencies() {
  return gulp.src(gnf(), {base:'./'})
    .pipe(gulp.dest(paths.vendor));
}

function copyVendorDependencies() {
  return gulp.src(`${paths.vendor}node_modules/**/*`)
    .pipe(gulp.dest(paths.vendor));
}

function dependencies() {
  return del([`${paths.vendor}node_modules/`]);
}

function browserSync(done) {
  browsersync.init(config.browsersync);
  done();
}

function browserSyncReload(done) {
  browsersync.reload();
  done();
}

function icons() {
  return gulp.src(paths.iconsSrc)
    .pipe(cheerio(config.cheerio))
    .pipe(svgSymbols(config.icons))
    .pipe(gulp.dest(paths.iconsDist))
    .pipe(browsersync.stream());
}

function css() {
  return gulp.src(paths.scssSrc)
    .pipe(sass({ outputStyle: "expanded" }).on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(gulp.dest(paths.cssDist))
    .pipe(browsersync.stream());
}

function productionCss() {
  return gulp
    .src(paths.scssSrc)
    .pipe(sass({ outputStyle: "compressed" }).on('error', sass.logError))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(rename((path) => {
      path.basename += ".min";
    }))
    .pipe(gulp.dest(paths.cssDist))
    .pipe(rev())
    .pipe(gulp.dest(paths.revDist))
    .pipe(rev.manifest({
      base: paths.revDist,
      path: 'web/build/manifest.json',
      merge: true
    }))
    .pipe(gulp.dest(paths.revDist));
}

function scripts() {
  return gulp
    .src(paths.jsSrc)
    .pipe(concat(config.jsConcat))
    .pipe(gulp.dest(paths.jsDist))
    .pipe(browsersync.stream());
}

function productionScripts() {
  return gulp
    .src(paths.jsSrcProduction)
    .pipe(concat(config.jsConcat))
    .pipe(rename((path) => {
      path.basename += ".min";
    }))
    .pipe(uglify())
    .pipe(gulp.dest(paths.jsDist))
    .pipe(rev())
    .pipe(gulp.dest(paths.revDist))
    .pipe(rev.manifest({
      base: paths.revDist,
      path: 'web/build/manifest.json',
      merge: true
    }))
    .pipe(gulp.dest(paths.revDist));
}

function watchFiles() {
  gulp.watch(paths.cssWatch, css);
  gulp.watch(paths.jsWatch, scripts);
  gulp.watch(paths.iconsWatch, icons);
  gulp.watch(paths.siteWatch, gulp.series(browserSyncReload));
}

// Export tasks
exports.install = gulp.series(copyNpmDependencies, copyVendorDependencies, dependencies);
exports.icons = icons;
exports.css = css;
exports.scripts = scripts;
exports.productionCss = productionCss;
exports.productionScripts = productionScripts;
exports.watch = gulp.series(exports.install, gulp.parallel(watchFiles, browserSync));

exports.default = gulp.series(exports.install, gulp.parallel(css, scripts, icons));
exports.build = gulp.series(exports.install, gulp.parallel(productionCss, productionScripts, icons));