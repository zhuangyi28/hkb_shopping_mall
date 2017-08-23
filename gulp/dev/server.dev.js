/**服务器设置
 * 开发*/

var gulp = require('gulp'),

    connect = require('gulp-connect'),

    option = require('../config.js').serverDev;//服务器

var browserSync = require('browser-sync').get("My Server");


function devServer() {
    //
    //connect.server(option);

    browserSync.init({

        server: option,

        reloadDebounce: 500,

        browser: "chrome",

        notify: false,

        //port: 666,//端口

    });





    /* browserSync.init({
     proxy: 'http://localhost:3000',
     browser: 'chrome',
     port: 7000*/

}

module.exports = devServer;