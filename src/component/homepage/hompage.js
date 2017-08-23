/**
 * Created by ZHUANGYI on 2017/8/22.
 */


var jfAutoPlay = {

    'jfVariable': {

        'XPosition': 0,                                                                                             //存储第一个手指x轴位置，需刷新

        'isChange': 0,                                                                                              //判断是否往哪里移动，1后退，2前进，其他值不动，需刷新

        'setInterMove1000': 0,                                                                                      //存储循环

        'timer': 5000,                                                                                              //平滑过渡间隔时间

        'ifPosition': 0,                                                                                            //储存两张图片的左右状态

        'lastStance': 0,                                                                                            //上次触摸的位置

        'isThreeEle': true,                                                                                           //是否是三个或者以上元素

        'isTwoEle': false,                                                                                           //是否两个元素

        'canMove':true,                                                                                                //是否可以移动

        'isAndroidVersion4': false                                                                                    //是不是安卓四及其以下系统

    },

    jfAutoPlayInit: function () {

        /*增加点点*/
        var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

        var thisAllTagA = thisFatherEle.getElementsByTagName('a');                                                  //包含img的a

        var thisPaginationEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_pagination')[0];//光标

        var screenWidth = document.body.clientWidth;                                                               //屏幕宽度

        thisFatherEle.className = 'jf_autoplay_images';//预设 防止闪屏

        jfAutoPlay.jfVariable.isAndroidVersion4 = !browser.supplier.wechat && browser.androidVersion && browser.androidVersion < 5;                  //安卓系统

        if (
            0
            &&
            jfAutoPlay.jfVariable.isAndroidVersion4) {                                                                  //安卓4.4以下 ，

            var allImages = thisFatherEle.getElementsByTagName('img');

            for (var i = 0; i < allImages.length; i++) {//固定图片高度

                allImages[i].style.width = screenWidth + 'px';

                allImages[i].style.height = (screenWidth / 750 * 277) + 'px'
            }

            if(thisAllTagA.length==2){//两张图片时显示错位

                thisFatherEle.style.whiteSpace='nowrap';

                thisAllTagA[1].style.marginLeft='-3px'

            }

        }

        if (thisAllTagA.length == 2) {//预设是几个元素，默认为三个以上

            jfAutoPlay.jfVariable.isThreeEle = false;
            jfAutoPlay.jfVariable.isTwoEle = true;

        }
        else if (thisAllTagA.length == 1) {

            jfAutoPlay.jfVariable.isThreeEle = false;
            jfAutoPlay.jfVariable.isTwoEle = false;

        }

        if (jfAutoPlay.jfVariable.isTwoEle || jfAutoPlay.jfVariable.isThreeEle) {//两个以上的图片再加点

            for (var i = 0; i < thisAllTagA.length; i++) {

                var newSpan = document.createElement('span');                                                           //新建一个span元素

                thisPaginationEle.appendChild(newSpan);                                                                 //多少个图片 添加多少个span

            }

            jfAutoPlay.paginationChange(0);                                                                             //默认选中第一个点点

        }

        /*预设图片的显示模式*/

        thisAllTagA[0].className = 'show';                                                                          //第一张为显示

        var thisEle = document.getElementsByClassName('jf_homepage_autoplay')[0];

        /*增加监听*/

        if (jfAutoPlay.jfVariable.isThreeEle) {                                                                              //三张以及以上，此方法通过移动三个子元素

            thisAllTagA[1].className = 'after';                                                                         //第二张为后面一张

            thisAllTagA[thisAllTagA.length - 1].className = 'before';                                                   //最后一张为前一张

            jfAutoPlay.jfVariable.setInterMove1000 = setInterval(jfAutoPlay.jfAutoPlayRight, jfAutoPlay.jfVariable.timer);//页面读取后开始轮播

            thisEle.addEventListener('touchstart', jfAutoPlay.jfAutoStart, false);//添加touchstrat事件

            thisEle.addEventListener('touchmove', jfAutoPlay.jfAutoMove, false);

            thisEle.addEventListener('touchend', jfAutoPlay.jfAutoEnd, false);

        }

        else if (jfAutoPlay.jfVariable.isTwoEle) {                                                                          //两张，此方法通过移动父元素

            for (var i = 0; i < thisAllTagA.length; i++) {

                thisFatherEle.getElementsByTagName('a')[i].getElementsByTagName('img')[0].style.width = screenWidth + 'px';  //每个img的宽度 = 屏幕宽度

                thisAllTagA[i].style.width = screenWidth + 'px';                                                             //每个img的宽度 = 屏幕宽度

            }

            thisFatherEle.style.width = (screenWidth * (thisAllTagA.length)) + 'px';                                    //该元素的总宽度 = 图片数量 * 屏幕宽度

            thisAllTagA[1].className = 'show';                                                                          //第二张为显示

            thisEle.addEventListener('touchstart', jfAutoPlay.jfAutoStart, false);//添加touchstrat事件

            /*jfAutoPlay.jfAddEvent();                                                                                    //添加move 和 end 事件*/

            thisEle.addEventListener('touchmove', jfAutoPlay.jfAutoMove, false);

            thisEle.addEventListener('touchend', jfAutoPlay.jfAutoEnd, false);

            jfAutoPlay.jfVariable.setInterMove1000 = setInterval(jfAutoPlay.jfAutoPlayTwoAll, jfAutoPlay.jfVariable.timer);//页面读取后开始轮播

        }
        else {//默认一张不动

        }

    },

    jfAddEvent: function () {                                                                                       //添加move 和 end 事件

        jfAutoPlay.jfVariable.canMove=true;

        /*        var thisEle = document.getElementsByClassName('jf_homepage_autoplay')[0];

         thisEle.addEventListener('touchmove', jfAutoPlay.jfAutoMove, false);

         thisEle.addEventListener('touchend', jfAutoPlay.jfAutoEnd, false);*/

    },

    jfRemoveEvent: function () {                                                                                     //卸载move 和 end 事件

        jfAutoPlay.jfVariable.canMove=false;
        /*
         var thisEle = document.getElementsByClassName('jf_homepage_autoplay')[0];

         thisEle.removeEventListener('touchmove', jfAutoPlay.jfAutoMove, false);

         thisEle.removeEventListener('touchend', jfAutoPlay.jfAutoEnd, false);*/

    },

    jfAutoStart: function (event) {      //当图片上触摸事件开始时，停止轮播

        var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

        clearInterval(jfAutoPlay.jfVariable.setInterMove1000);                                                      //触摸开始时，停下循环轮播

        jfAutoPlay.jfVariable.XPosition = jfAutoPlay.jfVariable.lastStance = event.touches[0].clientX;              //预设第一次触摸点和最后一次触摸点

        var thisShowEle = thisFatherEle.getElementsByClassName('show')[0];

        if (thisShowEle.className.indexOf('delay') < 0 && jfAutoPlay.jfVariable.isThreeEle) {  //触摸时没有delay样式的话&&三个元素以上的情况，添加该样式

            thisShowEle.className += ' delay';                                                                        //消除平滑过渡的效果

            thisFatherEle.getElementsByClassName('after')[0].className += ' delay';

            thisFatherEle.getElementsByClassName('before')[0].className += ' delay';

        }
        else {//两个元素

            thisFatherEle.style.transition = 'transform 0s';

            thisFatherEle.style.webkitTransition = '-webkit-transform 0s';

        }

    },
//判断是否处于ios的setTimeout失效状态
    iosMoveDebug:function (_this) {


        if(_this.className.indexOf('after')>-1&&_this.className.indexOf('delay')>-1&&_this.getAttribute('style').indexOf('-100%')>-1&&_this.offsetLeft>1&&browser.os.iOS){

            this.isIosBug=true;

            var thisShowEleIndex=0;

            var farEle=document.getElementsByClassName('jf_autoplay_images')[0].getElementsByTagName('a');

            for(var i=0;i<farEle.length;i++){

                if(farEle[i]==_this){

                    thisShowEleIndex=i;

                }

                farEle[i].className='delay';

            }

            if(thisShowEleIndex==0){

                _this.className='show delay';

                farEle[thisShowEleIndex+1].className='after delay';

                farEle[farEle.length-1].className='before delay';

            }

            else if(thisShowEleIndex==farEle.length-1){

                _this.className='show delay';

                farEle[0].className='after delay';

                farEle[thisShowEleIndex-1].className='before delay';

            }

            else{

                _this.className='show delay';

                farEle[thisShowEleIndex+1].className='after delay';

                farEle[thisShowEleIndex-1].className='before delay';

            }

            for(var i=0;i<farEle.length;i++){

                farEle[i].setAttribute('style','');

            }

            jfAutoPlay.jfAddEvent();                                                                            //再加监听

        }


    },

    jfAutoMove: function (event) {      //当图片上触摸事件开始时，停止轮播

        jfAutoPlay.iosMoveDebug(event.target.parentNode);                                                               //判断a标签

        if(jfAutoPlay.jfVariable.canMove) {

            var screenWidth = document.body.clientWidth;                                                               //屏幕宽度

            windowBanEvent.bundling();                                                                                  //触摸时禁止其他页面事件

            var XThisPosition = event.touches[0].clientX;                                                               //此时触摸的x值

            if (XThisPosition - jfAutoPlay.jfVariable.XPosition > screenWidth / 3 || XThisPosition - jfAutoPlay.jfVariable.lastStance > 6) {//移动距离大于三分之一或者移动速度大于6

                jfAutoPlay.jfVariable.isChange = 1;                                                                     //后退

            }

            else if (XThisPosition - jfAutoPlay.jfVariable.XPosition < -screenWidth / 3 || XThisPosition - jfAutoPlay.jfVariable.lastStance < -6) {//移动距离大于三分之一或者移动速度大于6

                jfAutoPlay.jfVariable.isChange = 2;                                                                     //前进

            }

            else {

                jfAutoPlay.jfVariable.isChange = 0;                                                                     //恢复原位，停止不动

            }

            var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

            if (jfAutoPlay.jfVariable.isThreeEle) {//三个元素以上的情况,移动

                thisFatherEle.getElementsByClassName('show')[0].style.transform = 'translate3d(' + (XThisPosition - jfAutoPlay.jfVariable.XPosition) + 'px,0,0)'; //此时的元素

                thisFatherEle.getElementsByClassName('show')[0].style.webkitTransform = 'translate3d(' + (XThisPosition - jfAutoPlay.jfVariable.XPosition) + 'px,0,0)';

                thisFatherEle.getElementsByClassName('after')[0].style.transform = 'translate3d(' + (XThisPosition - jfAutoPlay.jfVariable.XPosition) + 'px,0,0)';//下一个元素

                thisFatherEle.getElementsByClassName('after')[0].style.webkitTransform = 'translate3d(' + (XThisPosition - jfAutoPlay.jfVariable.XPosition) + 'px,0,0)';

                thisFatherEle.getElementsByClassName('before')[0].style.transform = 'translate3d(' + (XThisPosition - jfAutoPlay.jfVariable.XPosition) + 'px,0,0)';//上一个元素

                thisFatherEle.getElementsByClassName('before')[0].style.webkitTransform = 'translate3d(' + (XThisPosition - jfAutoPlay.jfVariable.XPosition) + 'px,0,0)';


            }
            else {//两种情况，移动，需要当心边缘抵抗

                var thisPosition = XThisPosition - jfAutoPlay.jfVariable.XPosition;

                if (!jfAutoPlay.jfVariable.ifPosition) {

                    if (thisPosition <= 0) {
                        thisFatherEle.style.transform = 'translate3d(' + thisPosition + 'px,0,0)';

                        thisFatherEle.style.webkitTransform = 'translate3d(' + thisPosition + 'px,0,0)'
                    }
                    else {
                        thisFatherEle.style.transform = 'translate3d(' + thisPosition / 4 + 'px,0,0)';//边缘抵抗为移动的四分之一

                        thisFatherEle.style.webkitTransform = 'translate3d(' + thisPosition / 4 + 'px,0,0)'
                    }
                }
                else {

                    if (thisPosition >= 0) {

                        thisFatherEle.style.transform = 'translate3d(' + (thisPosition - screenWidth) + 'px,0,0)';

                        thisFatherEle.style.webkitTransform = 'translate3d(' + (thisPosition - screenWidth) + 'px,0,0)'

                    }

                    else {

                        thisFatherEle.style.transform = 'translate3d(' + (thisPosition / 4 - screenWidth) + 'px,0,0)';

                        thisFatherEle.style.webkitTransform = 'translate3d(' + (thisPosition / 4 - screenWidth) + 'px,0,0)'

                    }
                }
            }

            jfAutoPlay.jfVariable.lastStance = XThisPosition;                                                           //存储这次触摸位置，供下次使用

        }

    },

    jfAutoEnd: function (event) {        //当图片上触摸事件结束时，继续轮播

        if(jfAutoPlay.jfVariable.canMove) {

            var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

            var thisShowEle = thisFatherEle.getElementsByClassName('show')[0];

            var thisAfterEle = thisFatherEle.getElementsByClassName('after')[0];

            if (jfAutoPlay.jfVariable.isThreeEle) {//三个元素以上的情况

                var thisBeforeEle = thisFatherEle.getElementsByClassName('before')[0];

                thisShowEle.className = thisShowEle.className.replace(' delay', '');                                         //消除平滑过渡的效果

                thisAfterEle.className = thisAfterEle.className.replace(' delay', '');

                thisBeforeEle.className = thisBeforeEle.className.replace(' delay', '');

            }

            if (jfAutoPlay.jfVariable.isChange == 2 && jfAutoPlay.jfVariable.isThreeEle) {//三个元素以上的情况 向右

                jfAutoPlay.jfAutoPlayRight();

            }

            else if (jfAutoPlay.jfVariable.isChange == 2) {//两个元素的情况 向右

                jfAutoPlay.jfAutoPlayTwoRight();

            }
            else if (jfAutoPlay.jfVariable.isChange == 1 && jfAutoPlay.jfVariable.isThreeEle) {//三个元素以上的情况 向左

                jfAutoPlay.jfAutoPlayLeft();

            }
            else if (jfAutoPlay.jfVariable.isChange == 1) {//两个元素的情况 向左

                jfAutoPlay.jfAutoPlayTwoLeft();

            }

            else {

                if (jfAutoPlay.jfVariable.isThreeEle) {

                    thisShowEle.style.transform = '';
                    thisShowEle.style.webkitTransform = ''; //此时的元素

                    thisAfterEle.style.transform = '';
                    thisAfterEle.style.webkitTransform = '';  //下一个元素

                    thisBeforeEle.style.transform = '';

                    thisBeforeEle.style.webkitTransform = '';      //上一个元素

                }
                else {

                    thisFatherEle.style.transition = '';
                    thisFatherEle.style.webkitTransition = '';

                    if (!jfAutoPlay.jfVariable.ifPosition) {

                        thisFatherEle.style.transform = '';
                        thisFatherEle.style.webkitTransform = ''

                    }
                    else {

                        var screenWidth = document.body.clientWidth;

                        thisFatherEle.style.transform = 'translate3d(-' + screenWidth + 'px,0,0)';

                        thisFatherEle.style.webkitTransform = 'translate3d(-' + screenWidth + 'px,0,0)';

                    }


                }

                thisShowEle.addEventListener('transitionend', transitionMoveEndFn, false);                              //绑定平滑过渡后的方法

                thisShowEle.addEventListener('webkitTransitionEnd', transitionMoveEndFn, false);

                thisFatherEle.addEventListener('transitionend', transitionMoveEndFn, false);                              //绑定平滑过渡后的方法

                thisFatherEle.addEventListener('webkitTransitionEnd', transitionMoveEndFn, false);

                function transitionMoveEndFn() {

                    windowBanEvent.unbundling();                                                                        //解绑

                    thisShowEle.removeEventListener('transitionend', transitionMoveEndFn, false);                       //绑定平滑过渡后的方法

                    thisShowEle.removeEventListener('webkitTransitionEnd', transitionMoveEndFn, false);

                    thisFatherEle.removeEventListener('transitionend', transitionMoveEndFn, false);                       //绑定平滑过渡后的方法

                    thisFatherEle.removeEventListener('webkitTransitionEnd', transitionMoveEndFn, false);

                }

            }

            if (jfAutoPlay.jfVariable.isThreeEle) {//三个元素以上的情况

                jfAutoPlay.jfVariable.setInterMove1000 = setInterval(jfAutoPlay.jfAutoPlayRight, jfAutoPlay.jfVariable.timer);//加轮播循环

            }
            else {//三个元素以上的情况
                jfAutoPlay.jfVariable.setInterMove1000 = setInterval(jfAutoPlay.jfAutoPlayTwoAll, jfAutoPlay.jfVariable.timer);//开始轮播
            }

            jfAutoPlay.jfVariable.isChange = jfAutoPlay.jfVariable.XPosition = jfAutoPlay.jfVariable.lastStance = 0;    //初始化动态值

            windowBanEvent.unbundling();                                                                                 //解绑

        }

    },

    jfAutoPlayTwoAll: function () {

        if (!jfAutoPlay.jfVariable.ifPosition) {

            jfAutoPlay.jfAutoPlayTwoRight();

        }
        else {

            jfAutoPlay.jfAutoPlayTwoLeft();

        }

    },

    jfAutoPlayTwoRight: function () {

        var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

        var screenWidth = document.body.clientWidth;                                                               //屏幕宽度

        thisFatherEle.style.transition = '';

        thisFatherEle.style.webkitTransition = '';

        thisFatherEle.style.transform = 'translate3d(-' + screenWidth + 'px,0,0)';

        thisFatherEle.style.webkitTransform = 'translate3d(-' + screenWidth + 'px,0,0)';

        jfAutoPlay.jfVariable.ifPosition = 1;

        jfAutoPlay.paginationChange(1);

    },

    jfAutoPlayTwoLeft: function () {

        var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

        thisFatherEle.style.transition = '';
        thisFatherEle.style.webkitTransition = '';

        thisFatherEle.style.transform = '';
        thisFatherEle.style.webkitTransform = '';

        jfAutoPlay.jfVariable.ifPosition = 0;

        jfAutoPlay.paginationChange(0);

    },


    jfAutoPlayRight: function () {//向右移动

        jfAutoPlay.jfRemoveEvent();

        var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

        var thisAllTagA = thisFatherEle.getElementsByTagName('a');                                                      //包含img的a

        var thisBeforeEle = thisFatherEle.getElementsByClassName('before')[0];                                         //前一个元素

        var thisShowEle = thisFatherEle.getElementsByClassName('show')[0];                                              //此时的元素

        var thisAfterEle = thisFatherEle.getElementsByClassName('after')[0];                                            //下一个元素



        if (!jfAutoPlay.jfVariable.isAndroidVersion4) {//非安卓4.4以下系统

            thisShowEle.className = thisShowEle.className.replace(' delay', ' move');                                       //此时的元素向后平滑过渡

            thisShowEle.style.transform = 'translate3d(-100%, 0, 0)';
            thisShowEle.style.webkitTransform = 'translate3d(-100%, 0, 0)';

            thisAfterEle.className = thisAfterEle.className.replace(' delay', ' move');                                     //下个元素向后平滑过渡

            thisAfterEle.style.transform = 'translate3d(-100%, 0, 0)';
            thisAfterEle.style.webkitTransform = 'translate3d(-100%, 0, 0)';

            thisShowEle.addEventListener('transitionend', transitionEndFn, false);                                          //绑定平滑过渡后的方法

            thisShowEle.addEventListener('webkitTransitionEnd', transitionEndFn, false);

            jfAutoPlay.isMove=true;

            function transitionEndFn() {

                if(jfAutoPlay.isMove) {

                    if(jfAutoPlay.isIosBug&&browser.os.iOS) {

                        jfAutoPlay.isMove = false;

                        jfAutoPlay.isIosBug=false;

                        setTimeout(function () {

                            jfAutoPlay.isMove = true;

                        }, 500);

                    }



                    thisShowEle.className += ' delay';                                                                          //消除平滑过渡的效果

                    thisAfterEle.className += ' delay';

                    setTimeout(function () {

                        thisBeforeEle.className = '';                                                                             //前一个元素隐藏

                        thisShowEle.className = 'before delay';                                                                  //将此时这个元素变成上一个元素

                        thisShowEle.style.transform = '';
                        thisShowEle.style.webkitTransform = '';

                        thisAfterEle.className = 'show delay ';                                                                  //此时下一个元素变成这个元素

                        thisAfterEle.style.transform = '';
                        thisAfterEle.style.webkitTransform = '';

                        for (var i = 0, switchI = 0; i < thisAllTagA.length; i++) {                                         //遍历寻找下一个元素

                            if (thisAllTagA[i] == thisAfterEle) {                                                           //找到那个元素

                                switchI = 1;

                                jfAutoPlay.paginationChange(i);                                                             //小圆点跳到那个点

                            }
                            else if (switchI && thisAllTagA[i].tagName == 'A') {

                                break;                                                                                       //获取i的值

                            }

                        }


                        if (i != thisAllTagA.length) {                                                                         //如果没有找到，说明下一个元素在第一个

                            thisAllTagA[i].className = 'after delay';

                        }
                        else {

                            thisAllTagA[0].className = 'after delay';                                                      //如果找到，说明下一个元素就是i的位置

                        }

                        thisShowEle.removeEventListener('transitionend', transitionEndFn);                                  //移除平滑过渡

                        thisShowEle.removeEventListener('webkitTransitionEnd', transitionEndFn);

                        for (var i = 0; i < thisAllTagA.length; i++) {

                            thisAllTagA[i].style.transform = '';

                            thisAllTagA[i].style.webkitTransform = '';//清空style值

                        }

                        jfAutoPlay.jfAddEvent();                                                                            //再加监听



                    }, 100)

                }
            }

        }

        else {//安卓4.4以下系统，取消平滑过渡效果
            thisBeforeEle.className = '';                                                                             //前一个元素隐藏

            thisShowEle.className = 'before delay';                                                                  //将此时这个元素变成上一个元素

            thisShowEle.style.transform = '';
            thisShowEle.style.webkitTransform = '';

            thisAfterEle.className = 'show delay ';                                                                  //此时下一个元素变成这个元素

            thisAfterEle.style.transform = '';
            thisAfterEle.style.webkitTransform = '';

            for (var i = 0, switchI = 0; i < thisAllTagA.length; i++) {                                         //遍历寻找下一个元素

                if(thisAllTagA[i].style) {
                    thisAllTagA[i].removeAttribute('style');
                }
                if (thisAllTagA[i] == thisAfterEle) {                                                           //找到那个元素

                    switchI = 1;

                    jfAutoPlay.paginationChange(i);                                                             //小圆点跳到那个点
                }
                else if (switchI && thisAllTagA[i].tagName == 'A') {

                    break;                                                                                       //获取i的值

                }
            }

            if (i != thisAllTagA.length) {                                                                         //如果没有找到，说明下一个元素在第一个

                thisAllTagA[i].className = 'after delay';

            }

            else {

                thisAllTagA[0].className = 'after delay ';                                                      //如果找到，说明下一个元素就是i的位置

            }

            jfAutoPlay.jfAddEvent();                                                                            //再加监听

        }

    },
    jfAutoPlayLeft: function () {//向左移动

        jfAutoPlay.jfRemoveEvent();

        var thisFatherEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_autoplay_images')[0];//父元素，主要移动该元素

        var thisAllTagA = thisFatherEle.getElementsByTagName('a');                                                      //包含img的a

        var thisBeforeEle = thisFatherEle.getElementsByClassName('before')[0];                                         //前一个元素

        var thisShowEle = thisFatherEle.getElementsByClassName('show')[0];                                              //此时的元素

        var thisAfterEle = thisFatherEle.getElementsByClassName('after')[0];                                            //下一个元素

        if (!jfAutoPlay.jfVariable.isAndroidVersion4) {//非安卓4.4以下系统

            thisShowEle.className = thisShowEle.className.replace(' delay', ' move_left');                                        //此时的元素向后平滑过渡

            thisShowEle.style.transform = 'translate3d(100%, 0, 0)';

            thisShowEle.style.webkitTransform = 'translate3d(100%, 0, 0)';

            thisBeforeEle.className = thisBeforeEle.className.replace(' delay', ' move_left');                                   //下个元素向后平滑过渡

            thisBeforeEle.style.transform = 'translate3d(100%, 0, 0)';
            thisBeforeEle.style.webkitTransform = 'translate3d(100%, 0, 0)';

            thisShowEle.addEventListener('transitionend', transitionEndFn, false);                                          //绑定平滑过渡后的方法

            thisShowEle.addEventListener('webkitTransitionEnd', transitionEndFn, false);

            function transitionEndFn() {

                thisShowEle.className += ' delay';                                                                          //消除平滑过渡的效果

                thisBeforeEle.className += ' delay';

                setTimeout(function () {

                    thisAfterEle.className = '';                                                                             //前一个元素隐藏

                    thisShowEle.className = 'after delay';                                                                  //将此时这个元素变成上一个元素

                    thisShowEle.style.transform = '';
                    thisShowEle.style.webkitTransform = '';

                    thisBeforeEle.className = 'show delay';                                                                  //此时下一个元素变成这个元素

                    thisBeforeEle.style.transform = '';
                    thisBeforeEle.style.webkitTransform = '';


                    for (var i = thisAllTagA.length - 1, switchI = 0; i >= 0; i--) {                                         //遍历寻找下一个元素

                        if (thisAllTagA[i] == thisBeforeEle) {

                            switchI = 1;

                            jfAutoPlay.paginationChange(i);

                        }
                        else if (switchI && thisAllTagA[i].tagName == 'A') {

                            break;                                                                                       //获取i的值

                        }

                    }

                    if (i != -1) {                                                                                        //如果没有找到，说明下一个元素在第一个

                        thisAllTagA[i].className = 'before delay';

                    }
                    else {

                        thisAllTagA[thisAllTagA.length - 1].className = 'before delay';                                   //如果找到，说明下一个元素就是i的位置

                    }

                    thisShowEle.removeEventListener('transitionend', transitionEndFn);                                  //移除平滑过渡

                    thisShowEle.removeEventListener('webkitTransitionEnd', transitionEndFn);

                    for (var i = 0; i < thisAllTagA.length; i++) {

                        thisAllTagA[i].style.transform = '';
                        thisAllTagA[i].style.webkitTransform = '';

                    }

                    jfAutoPlay.jfAddEvent();                                                                            //加监听


                }, 100)


            }
        }

        else {//安卓4.4以下系统，取消平滑过渡效果
            thisAfterEle.className = '';                                                                             //前一个元素隐藏

            thisShowEle.className = 'after delay';                                                                  //将此时这个元素变成上一个元素

            thisShowEle.style.transform = '';
            thisShowEle.style.webkitTransform = '';

            thisBeforeEle.className = 'show delay';                                                                  //此时下一个元素变成这个元素

            thisBeforeEle.style.transform = '';
            thisBeforeEle.style.webkitTransform = '';

            for (var i = thisAllTagA.length - 1, switchI = 0; i >= 0; i--) {                                         //遍历寻找下一个元素

                if(thisAllTagA[i].style) {
                    thisAllTagA[i].removeAttribute('style');
                }
                if (thisAllTagA[i] == thisBeforeEle) {                                                           //找到那个元素

                    switchI = 1;

                    jfAutoPlay.paginationChange(i);                                                             //小圆点跳到那个点
                }
                else if (switchI && thisAllTagA[i].tagName == 'A') {

                    break;                                                                                       //获取i的值

                }
            }

            if (i != -1) {                                                                                        //如果没有找到，说明下一个元素在第一个

                thisAllTagA[i].className = 'before delay';

            }
            else {

                thisAllTagA[thisAllTagA.length - 1].className = 'before delay';                                   //如果找到，说明下一个元素就是i的位置

            }

            jfAutoPlay.jfAddEvent();                                                                            //再加监听

        }

    },
    paginationChange: function (thisChangeI) {

        var thisPaginationEle = document.getElementsByClassName('jf_homepage_autoplay')[0].getElementsByClassName('jf_pagination')[0];//光标

        var thisPaginationSpan = thisPaginationEle.getElementsByTagName('span');                                        //所有的小点点

        for (var i = 0; i < thisPaginationSpan.length; i++) {

            thisPaginationSpan[i].removeAttribute('class');                                                         //清除所有点点的样式，以便重新写

        }

        var activePag;                                                                                             //增加点点选中时的样式

        if (thisChangeI >= thisPaginationSpan.length) {                                                             //翻动时（最后一张到最后一张）的debug

            activePag = 0;

        }

        else {

            activePag = thisChangeI;                                                                                //到哪张，就移动哪张

        }

        thisPaginationSpan[activePag].className = 'active';                                                         //此时这点点被选中
    },

    jfCarouselInit: function () {                                                                                   //初始化

        //window.addEventListener('load', function () {

        jfAutoPlay.jfAutoPlayInit();

        //});

    }

};