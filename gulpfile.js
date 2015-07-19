'use strict';

var fs = require('fs');

var gulp = require('gulp');

// 丑化压缩js
var uglify = require('gulp-uglify');
// 压缩html
var minifyHTML = require('gulp-minify-html');
// 压缩css
var minifycss = require('gulp-minify-css');
//压缩图片
var imagemin = require('gulp-imagemin');

var rev = require('gulp-rev');
var revCollector = require('gulp-rev-collector');

var webpack = require('gulp-webpack');
var run = require('run-sequence');

var replace = require('gulp-replace');

var clean = require('gulp-clean');

var merge = require('merge-stream');

var gulpif = require('gulp-if');

var config = require('./steamer.js');

// 代码中使用：___cdn 替换cdn路径
var urlCdn = config.cdn;

// 代码中使用：___web 替换web路径
var urlWeb = config.root;
// 时间戳
var timeline = new Date().getTime();

// 清理dev文件夹
gulp.task('clean-dev', function() {
    return gulp.src(['./dev/'], {read: false})
               .pipe(clean());
});

gulp.task('clone-lib', function() {
	return gulp.src(['./src/lib/**/*'])
		       .pipe(gulp.dest('./dev/lib/'));
});

gulp.task('clone-img', function() {
	return gulp.src(['./src/img/**/*'])
			   .pipe(gulp.dest('./dev/img/'));
});

gulp.task('clone-html', function() {
	return gulp.src(['./src/*.html'])
	           .pipe(replace(/\_\_\_(cdnCss)/g, urlCdn.css))
        	   .pipe(replace(/\_\_\_(cdnJs)/g, urlCdn.js))
        	   .pipe(replace(/\_\_\_(cdnImg)/g, urlCdn.img))
        	   .pipe(replace(/\_\_\_(cdn)/g, urlCdn.default))
        	   .pipe(replace(/\_\_\_(web)/g, urlWeb))
        	   .pipe(replace(/\_\_\_(timeline)/g, timeline))
			   .pipe(gulp.dest('./dev/'));
});

gulp.task('clone-css', function() {
	return gulp.src(['./src/css/**/*'])
	           .pipe(replace(/\_\_\_(cdnImg)/g, urlCdn.img))
			   .pipe(gulp.dest('./dev/css/'));
});

gulp.task('clone-js', function() {
	return gulp.src(['./src/js/**/*'])
	           .pipe(replace(/\_\_\_(cdnJs)/g, urlCdn.js))
			   .pipe(gulp.dest('./dev/js/'));
});

gulp.task('dev', function() {
    run('clone-lib', 'clone-img', 'clone-html', 'clone-css', 'clone-js');
});

gulp.task('default', ['clean-dev'], function() {
	run('dev');
    gulp.watch(['src/**/*'], ['dev']);
});


// dev ↑
//===================================================================================
// dist ↓
// 清理dist文件夹
gulp.task('clean-dist', function() {
    return gulp.src(['./dist/'], {read: false})
               .pipe(clean());
});

gulp.task('minify-css', function() {
    return gulp.src(['./dev/css/**/*'])
	           .pipe(minifycss())
	           .pipe(rev())
			   .pipe(gulp.dest('./dist/css/'))
			   .pipe(rev.manifest())
        	   .pipe(gulp.dest('rev/css'));
});


gulp.task('md5-css', function() {
    return gulp.src(['rev/css/*.json', 'rev/img/*.json', './dist/css/**/*'])
	           .pipe(revCollector({
		            replaceReved: true,
		            dirReplacements: {
		                'css/': 'css/',
		                'js/': 'js/',
		                'img/': 'img/',
		            }
		        }))
			   .pipe(gulp.dest('./dist/css/'))
});

gulp.task('minify-js', function() {
    return gulp.src(['./dev/js/**/*'])
	           .pipe(uglify())
	           .pipe(rev())
			   .pipe(gulp.dest('./dist/js/'))
			   .pipe(rev.manifest())
        	   .pipe(gulp.dest('rev/js'));
});

gulp.task('md5-js', function() {
    return gulp.src(['rev/js/*.json', 'rev/css/*.json', 'rev/img/*.json', './dist/js/**/*'])
	           .pipe(revCollector({
		            replaceReved: true,
		            dirReplacements: {
		                'css/': 'css/',
		                'js/': 'js/',
		                'img/': 'img/',
		            }
		        }))
			   .pipe(gulp.dest('./dist/js/'))
});

gulp.task('minify-img', function() {
    var stream1 = gulp.src(['./dev/img/**/*'])
    				  // .pipe(imagemin())
    				  .pipe(gulp.dest('./dist/img/'));

    var stream2 = gulp.src(['./dev/img/*'])
			          // .pipe(imagemin())
			          .pipe(rev())
					  .pipe(gulp.dest('./dist/img/'))
					  .pipe(rev.manifest())
		        	  .pipe(gulp.dest('rev/img'));

    return merge(stream1, stream2);
});

gulp.task('minify-html', function() {
    return gulp.src(['rev/**/*.json', './dev/*.html'])
    			.pipe(revCollector({
		            replaceReved: true,
		            dirReplacements: {
		                'css/': 'css/',
		                'js/': 'js/',
		                'img/': 'img/',
		            }
		        }))
		        .pipe(replace(/<script.*src=[\"|\']*(.+)\?\_\_\_inline.*?<\/script>/ig, function(a, b) {
		            b = 'dist/' + b;
		            if (!fs.existsSync(b)) {
		                return '';
		            }
		            return '<script>' + fs.readFileSync(b) + '</script>';
		        }))
		        .pipe(replace(/<link.*href=[\"|\']*(.+)\?\_\_\_inline.*?>/ig, function(a,b) {
		            b = 'dist/' + b;
		            if (!fs.existsSync(b)) {
		                return '';
		            }
		            return '<style type="text/css">'+fs.readFileSync(b)+'</style>';
		        }))
	           .pipe(minifyHTML())
			   .pipe(gulp.dest('./dist/'));
});

gulp.task('copy-lib', function() {
    return gulp.src(['./dev/lib/**/*'])
			   .pipe(gulp.dest('./dist/lib/'));
});

gulp.task('clean-rev', function() {
    return gulp.src(['./rev/'], {read: false})
               .pipe(clean());
});

gulp.task('dist', ['clean-dist'], function() {
	run('copy-lib', 'minify-img', 'minify-css', 'md5-css', 'minify-js', 'md5-js', 'minify-html', 'clean-rev');
});

