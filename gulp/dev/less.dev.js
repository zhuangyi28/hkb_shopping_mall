7/**样式翻译合并
 * 开发*/

var gulp = require('gulp'),

    less = require('gulp-less'),//less解码

    autoprefixer = require('gulp-autoprefixer'),//css兼容性

    concatDir = require('gulp-concat-dir'),//按文件夹合并
    
    concat = require("gulp-concat"),//文件合并

    connect = require('gulp-connect'),//服务器

    rename = require("gulp-rename");//重命名

var browserSync = require('browser-sync').get("My Server");


function devLess() {

    // gulp.src(['src/component/**/*.{less,css}']) //该任务针对的文件7
    //
    //     .pipe(less()) //编译less
    //
    //     .pipe(autoprefixer({
    //
    //         browsers: ['Android >= 4.0', 'IOS >=7'],//兼容设备
    //
    //         cascade: true, //是否美化属性值 默认：true 像这样：
    //         //-webkit-transform: rotate(45deg);
    //         //        transform: rotate(45deg);
    //         remove: true //是否去掉不必要的前缀 默认：true
    //
    //     }))
    //
    //     .pipe(concatDir({ext: '.css'}))//根据文件夹合并
    //
    //     .pipe(rename({prefix: "jf_"}))//统一加前缀
    //
    //     //.pipe(minifyCss()) //压缩css
    //
    //     .pipe(gulp.dest('build/css')) //将会在src/css下生成index.css
    //
    //     //.pipe(notify({message: 'style task complete'}))
    //
    //     // .pipe(livereload());

    gulp.src(['src/component/**/*.less']) //该任务针对的文件7

        .pipe(less()) //编译less

        .pipe(autoprefixer({
            browsers: ['Android >= 4.0', 'IOS >=7'],//兼容设备

            cascade: true, //是否美化属性值 默认：true 像这样：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);

            remove: true //是否去掉不必要的前缀 默认：true
        }))

        .pipe(concat('hkbBusinessMain.css'))  // 合并匹配到的css文件

        //.pipe(minifyCss()) //压缩css

        .pipe(gulp.dest('build/css')) //将会在build/css下生成index.css

        .pipe(browserSync.stream());

        //.pipe(connect.reload());

   /* gulp.src(['src/css/component.css'])

        //.pipe(minifyCss()) //压缩css

        //.pipe(concat('component.min.css'))  // 合并匹配到的css文件

        .pipe(gulp.dest('build/css')) //将会在src/css下生成index.css

        .pipe(connect.reload());

    gulp.src(['src/css/main.css'])

        //.pipe(minifyCss()) //压缩css

        //.pipe(concat('main.min.css'))

        .pipe(gulp.dest('build/css'))

        .pipe(connect.reload());

    gulp.src(['src/css/bootstrap.min.css'])

        //.pipe(concat('bootstrap.min.css'))

        .pipe(gulp.dest('build/css'))

        .pipe(connect.reload());
*/
}

module.exports = devLess;