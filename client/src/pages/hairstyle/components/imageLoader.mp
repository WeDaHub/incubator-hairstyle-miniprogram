<config>
    {
    "component": true
    }
</config>

<template>
    <!-- Error -->
    <view class="image-error-placeholder fadeIn {{ errorClass }}" wx:if="{{ error }}" style="{{ loadingStyle }}"></view>
    <!-- Loading -->
    <view class="image-loading-placeholder fadeIn {{ loadingClass }}" wx:elif="{{ !loaded }}" style="{{ errorStyle }}">
    </view>
    <!-- 原图 -->
    <image wx:if="{{ imageSrc }}" class="{{ imageClass }}" src="{{ imageSrc }}" mode="{{ mode }}"
        lazy-load="{{ lazyLoad }}" show-menu-by-longpress="{{ showMenuByLongpress }}" binderror="binderror"
        bindload="bindload" />
</template>

<script>
    import mp from 'mp-helper';

    const { promiser, classNames } = mp.utils;

    // 全局执行一次 wx.getStorageSync ，减少性能开销
    let imageCache = wx.getStorageSync('imageCache');
    const fs = wx.getFileSystemManager();

    // 注册 Component
    Component({
        // 配置项
        options: {
            addGlobalClass: true, // 是否支持全局样式
        },

        // 引用组件混入
        //behaviors: [],
        // 定义组件间关系
        //relations: {},

        // 组件接受的外部样式类
        externalClasses: [],
        // 组件的对外属性
        properties: {

            // 图片资源地址
            src: {
                type: String,
            },
            // 加载中占位符的class样式
            loadingClass: {
                type: String,
                value: 'image--loading'
            },
            // 错误占位符的class样式
            errorClass: {
                type: String,
                value: 'image--error'
            },
            // 加载中占位符的样式
            loadingStyle: {
                type: String,
                value: ''
            },
            // 错误占位符的样式
            errorStyle: {
                type: String,
                value: ''
            },
            // 图片裁剪、缩放的模式
            mode: {
                type: String,
                value: 'scaleToFill'
            },
            // 图片懒加载，在即将进入一定范围（上下三屏）时才开始加载
            lazyLoad: {
                type: Boolean,
                value: false
            },
            // 开启长按图片显示识别小程序码菜单
            showMenuByLongpress: {
                type: Boolean,
                value: false
            },
            // 是否开启缓存（建议仅永久缓存固定图标）
            cache: {
                type: Boolean,
                value: false,
            }
        },
        // 组件的内部数据
        data: {
            imageSrc: null, // 当前图片路径（可能为缓存路径）
            loaded: false, // 是否加载完毕
            error: false, // 是否发生错误
        },
        // 组件的计算数据 (mp-helper 增强API)
        $computed: {
            imageClass: {
                depend: ['loaded', 'error'],
                get(loaded, error) {
                    return classNames({
                        'image--hidden': !loaded || error,
                    });
                }
            }
        },
        // 组件数据字段监听器
        observers: {
            // src 改变会重写触发 loadImage
            src(src) {
                this.loadImage(src);
            }
        },

        /* 组件生命周期 */
        lifetimes: {
            // 组件实例被创建
            //created() {},
            // 组件实例进入页面节点树
            //attached() {},
            // 页面组件初始化完成
            ready() {
                this.loadImage(this.data.src);
            },
            // 组件实例被移动到节点树另一个位置
            //moved() {},
            // 组件实例被从页面节点树移除
            detached() { },
        },
        /* 组件所在页面的生命周期 */
        pageLifetimes: {
            // 页面被展示
            show() { },
            // 页面被隐藏
            hide() { },
            // 页面尺寸变化
            resize(size) { }
        },

        /* Methods */
        methods: {
            // 加载图片
            async loadImage(src) {
                let imageSrc = src || '';
                if (imageSrc && this.data.cache) { // 需要缓存
                    let cachePath;
                    try {
                        // 先判断图片是否已经临时缓存
                        if (imageCache && imageCache[imageSrc]) {
                            cachePath = imageCache[imageSrc];
                        }
                        // 判断缓存是否存在
                        if (cachePath) {
                            try {
                                fs.accessSync(cachePath);
                            } catch (err) { cachePath = null; } // 缓存失效
                        }
                        // 如果没有缓存地址或缓存失效，则进行缓存
                        if (!cachePath) {
                            // 下载图片缓存地址
                            cachePath = await this.downloadImage(imageSrc);
                            // 异步缓存图片
                            if (cachePath) this.cacheImage(imageSrc, cachePath);
                        }
                        // console.log(`imageSrc: ${imageSrc}`, `cachePath: ${cachePath}`);
                        imageSrc = cachePath || imageSrc;
                    } catch (err) { console.warn(err, `imageSrc: ${imageSrc}`, `cachePath: ${cachePath}`) }
                }
                // 设置地址
                if (this.data.imageSrc !== imageSrc) {
                    this.setData({ imageSrc });
                }
            },
            // 异步缓存图片
            cacheImage(originSrc, cachePath) {
                if (!imageCache) imageCache = {};
                if (imageCache[originSrc] !== cachePath) {
                    imageCache[originSrc] = cachePath;
                    wx.setStorage({
                        key: 'imageCache',
                        data: imageCache,
                    });
                }
            },
            // 下载图片
            async downloadImage(src) {
                const imageInfo = await promiser(wx.getImageInfo)({ src });
                if (!imageInfo.path) throw new Error('加载图片失败');
                return imageInfo.path;
            },
            // 当图片载入完毕时触发，event.detail = {height, width}
            bindload(event) {
                const vm = this;
                vm.setData({ loaded: true });
                this.triggerEvent('load', event.detail);
            },
            // 当错误发生时触发，event.detail = {errMsg}
            binderror(event) { // 异常报错
                console.error(event, `originSrc: ${originSrc}`, `imageSrc: ${this.data.imageSrc}`);
            },
        }
    });
</script>

<style lang="less">
    image-loader {
        position: relative;
        display: inline-block;

        image {
            display: block;
            width: 100%;
            height: 100%;

            &.image--hidden {
                opacity: 0;
                visibility: hidden;
            }
        }

        .image-loading-placeholder,
        .image-error-placeholder {
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

        .image--loading {
            animation: loading 1s ease-in-out infinite alternate;
        }

        .image--error {
            background-color: #fad9d9;
        }

        @keyframes loading {
            from {
                background-color: #f5f5f5;
            }

            to {
                background-color: #ececec;
            }
        }
    }
</style>
