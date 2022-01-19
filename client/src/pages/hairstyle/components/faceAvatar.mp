<config>
{
    "component": true
}
</config>

<template>
<view class="face-avatar">
    <!-- Error -->
    <view class="face-error-placeholder fadeIn face--error" wx:if="{{ error }}"></view>
    <!-- Loading -->
    <view class="face-loading-placeholder fadeIn face--loading" wx:elif="{{ !loaded }}"></view>
    <image
        class="face-avatar-image"
        mode="aspectFill"
        src="{{ src }}"
        bindload="bindload"
        binderror="binderror"
        style="{{ style }}" />
</view>
</template>


<script>
import mp from 'mp-helper';

const { classNames, inlineStyles } = mp.utils;

// 注册 Component
mp.Component({
    // 配置项
    options: {
        addGlobalClass: true, // 是否支持全局样式
    },
    // 组件接受的外部样式类
    externalClasses: [],
    // 组件的对外属性
    properties: {
        // 图片资源地址
        src: {
            type: String,
            value: '',
        },
        // 人脸大小定位信息
        rect: {
            type: Object,
            value: {},
        },
    },
    // 组件的内部数据
    data: {
        loaded: false, // 是否加载完毕
        error: false, // 是否发生错误
        imgInfo: null, // 图片信息
        // 图片大小 人脸位置信息
        imgWidth: '100%', // 图片缩放后显示的宽度
        imgHeight: '100%', // 图片缩放后显示的高度
        faceTop: '0px', // 人脸Y轴偏移量
        faceLeft: '0px', // 人脸X轴偏移量
    },
    // 组件的计算数据 (mp-helper 增强API)
    $computed: {
        // class
        imageClass: {
            depend: ['loaded', 'error'],
            get(loaded, error) {
                return classNames({
                    'image--hidden': !loaded || error,
                });
            }
        },
        // 样式
        style: {
            depend: ['imgWidth', 'imgHeight', 'faceTop', 'faceLeft', 'hidden'],
            get(imgWidth, imgHeight, faceTop, faceLeft, hidden) {
                return inlineStyles({
                    top: faceTop + 'px',
                    left: faceLeft + 'px',
                    width: imgWidth + 'px',
                    height: imgHeight + 'px',
                    display: hidden ? 'none': 'block',
                });
            },
        },
    },
    // 组件数据字段监听器
    observers: {
        rect() {
            if (this.data.imgInfo) this.computeInfo(this.data.imgInfo);
        }
    },

    /* 组件生命周期 */
    lifetimes: {
        // 组件实例被创建
        created() {},
        // 组件实例进入页面节点树
        attached() {},
        // 页面组件初始化完成
        ready() {},
        // 组件实例被移动到节点树另一个位置
        moved() {},
        // 组件实例被从页面节点树移除
        detached() {},
    },
    /* 组件所在页面的生命周期 */
    pageLifetimes: {
        // 页面被展示
        show() {},
        // 页面被隐藏
        hide() {},
        // 页面尺寸变化
        resize() {}
    },

    /* Methods */
    methods: {
        // 图片加载成功 获取其原始宽高 获取容器宽高
        bindload(event) {
            const self = this;
            // 原始图片宽高
            const { width: imageWidth, height: imageHeight } = event.detail;
            // 获取容器的宽高
            self.createSelectorQuery().select('.face-avatar').boundingClientRect((rect) => {
                const { width: outWidth, height: outHeight } = rect;
                // 缩放图片显示人脸
                self.computeInfo({
                    imageWidth,
                    imageHeight,
                    outWidth: outHeight,
                    outHeight
                });
            }).exec();
        },
        // 缩放图片显示人脸 先根据容器的大小跟人脸大小的比列，缩放图片， 然后再根据一样的比列缩放偏移量，最后根据偏移量显示人脸
        computeInfo(info = {}) {
            const { imageWidth = 0, imageHeight = 0, outWidth = 0, outHeight = 0 } = info; // px
            if (!imageWidth || !outWidth) return;
            const outProportion = outHeight / outWidth;// 容器高宽比 px
            // 人脸信息
            const {
                Width: faceWidth = imageWidth,
                Height: faceHeight = (imageWidth * outProportion),
                X: faceX = 0,
                Y: faceY = 0,
            } = this.data.rect || {};
            if (!faceWidth) return;
            // 缩放图片显示人脸
            const faceProportion = faceHeight / faceWidth; // 人脸高宽比 px
            let innerHeight, innerWidth, innerTop, innerLeft;
            let scale; // 人脸的缩放比例 容器的大小px / 人脸大小的px

            if (outProportion > faceProportion) { // 宽满，高未满 可画图理解
                scale = outWidth / faceWidth; // 容器的宽度/人脸实际的宽度 px/px
                innerWidth = imageWidth * scale; // 照片按比例显示的宽 px 非人脸
                innerHeight = imageHeight * scale; // 照片按比例显示的高 px 非人脸
                innerLeft = faceX * scale; // 人脸在照片中的X轴偏移量 按比例缩放
                innerTop = faceY * scale; // 人脸在照片中的Y轴偏移量 按比例缩放
            } else { // 高满，宽未满 或者 显示容器和人脸大小比例相等
                scale = outHeight / faceHeight; // 容器的宽度/人脸实际的宽度 px/px
                innerWidth = imageWidth * scale; // 照片按比例显示的宽 px 非人脸
                innerHeight = imageHeight * scale; // 照片按比例显示的宽 px 非人脸
                innerLeft = faceX * scale; // 人脸在照片中的X轴偏移量 按比例缩放
                innerTop = faceY * scale; // 人脸在照片中的Y轴偏移量 按比例缩放
            }

            this.setData({
                imgInfo: info,
                imgWidth: innerWidth,
                imgHeight: innerHeight,
                faceLeft: -innerLeft,
                faceTop: -innerTop,
                loaded: true,
            });
        },
        binderror(event) {
            this.setData({ error: true });
        },
    }
});
</script>

<style lang="less">
.face-avatar {
    position: relative;
    width: 156rpx;
    height: 156rpx;
    overflow: hidden;
    margin: 0 auto;
    .face-avatar-image {
        position: absolute;
        display: block;
        &.image--hidden {
            opacity: 0;
            visibility: hidden;
        }
    }
    .face-loading-placeholder,
    .face-error-placeholder {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background-position: center center;
        opacity: 0;
        transition: opacity .5s;
    }
    .fadeIn {
        opacity: 1;
    }
    .face--loading {
        animation: loading 1s ease-in-out infinite alternate;
    }
    .face--error {
        background-color: #fad9d9;
    }
    @keyframes loading {
        from { background-color: #f5f5f5; }
        to { background-color: #ececec; }
    }
}

</style>
