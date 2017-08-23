/**图片压缩
 * 交付*/


var gulp = require('gulp');

function distImg() {

    gulp.src('build/icon/**/*.png')

        .pipe(gulp.dest('dist/icon'));

    gulp.src('build/images/**/*.{jpg,png,gif}')

        .pipe(gulp.dest('dist/images'));
    
}

module.exports = distImg;