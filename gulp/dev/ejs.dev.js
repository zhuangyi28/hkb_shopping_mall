/**模板引擎合并
 * 开发*/

var gulp = require('gulp'),

    ejs = require('gulp-ejs'),//ejs模板

    cheerio = require('gulp-cheerio'),//批量更换html中的引用

    connect = require('gulp-connect'),//服务器

    rename = require("gulp-rename");//重命名

var browserSync = require('browser-sync').get("My Server");


function devEjs() {

    gulp.src('src/view/*/**.{ejs,html}')

        .pipe(ejs())

        //增加媒体查询，通用样式文件
        .pipe(cheerio({

                run:function ($) {

                    if ($('head').children('link')) {

                        $('head').children('link').remove();//重新引入全新css

                        $('head').append(addHtml);

                    }

                    var addHtml = "";

                    addHtml += "<link rel='stylesheet'  href='../../css/hkbBusinessMain.css'/>\n ";//框架


                    $('head').prepend(addHtml);

                },

            parserOptions: {
                // Options here
               // decodeEntities: false
            }

            }
        ))

        //顺序增加脚本文件
        .pipe(cheerio(function ($) {

            var addJSHtml = '';//保存引用的业务脚本

            var addJsRun = "<script src='../../js/hkbBusinessMain.js'></script>\n";//运行的脚本

            var addJs="<script>addEventListener('load',function()\{";

            var addJsHtmlHead = "<script src='";

            var addJSHtmlBottom = "'></script>\n";

            $('script').each(function (index, ele) {

                if ($(this).attr('src')) {

                    var thisAttr=$(this).attr('src');

                    if(thisAttr.indexOf('hkbBusinessMain.min.js')>-1){

                        thisAttr=thisAttr.replace('hkbBusinessMain.min.js','hkbBusinessMain.js')

                    }

                    addJSHtml += addJsHtmlHead + thisAttr + addJSHtmlBottom;

                }

                else {

                    addJs += $(this).html() + '\n';

                }

            });

            addJs += "\})\n</script>\n";


            $('script').remove();

            $('body').append(addJSHtml);

            $('body').append(addJsRun);

            $('body').append(addJs);

        }))

        .pipe(rename({

            extname: ".html"

        }))

        .pipe(gulp.dest('build/html'))//输出为html

        .pipe(browserSync.stream({once: true}));

        //.pipe(notify({message: 'html task complete'}));

        //.pipe(connect.reload());

    /*框架html导入*/
    gulp.src("src/index.html")

        .pipe(gulp.dest('build'));

}

module.exports = devEjs;