const gulp = require('gulp');
const babel = require('gulp-babel');
const plumber = require('gulp-plumber');
const sourcePath = 'src/*.js';
const targetPath = 'compiled';

gulp.task('babel', function () {
    gulp.src([sourcePath])
        .pipe(plumber())
        .pipe(babel({
			presets: ['es2015']
		}))
        .pipe(gulp.dest(targetPath));
});

gulp.task('watch', function() {
    gulp.watch([sourcePath], ['babel']);
});

gulp.task('default', ['babel', 'watch']);