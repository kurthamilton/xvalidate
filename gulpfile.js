var gulp = require('gulp'),
    babel = require('gulp-babel'),
    plumber = require('gulp-plumber'),
    watchPath = 'src/*.js',
    compilePath = 'compiled';
	
gulp.task('babel', function () {
    gulp.src([watchPath])
        .pipe(plumber())
        .pipe(babel())
        .pipe(gulp.dest(compilePath));
});

gulp.task('watch', function() {
    gulp.watch([watchPath], ['babel']);
});

gulp.task('default', ['babel', 'watch']);