<config>
{
    "component": true
}
</config>

<template>
<scroll-view
    class="face-highlight"
    scroll-x="{{ imageMode === 'scroll' }}"
    scroll-y="{{ imageMode === 'scroll' }}"
    scroll-top="{{ scrollTop }}"
    scroll-left="{{ scrollLeft }}"
    bindscroll="bindscroll">
    <view class="face-highlight-content" style="{{ imageStyle }}">
        <!-- 原图 -->
        <image
            wx:if="{{ materialSrc }}"
            style="display: {{ showOriginal ? 'block' : 'none' }}"
            class="face-highlight-image"
            src="{{ materialSrc }}"
            mode="{{ imageMode === 'scroll' ? 'scaleToFill' : imageMode }}"
            bindload="bindload" />
        <!-- 素材图 -->
        <image
            wx:if="{{ imageSrc }}"
            style="display: {{ showOriginal ? 'none' : 'block' }}"
            class="face-highlight-image"
            src="{{ imageSrc }}"
            mode="{{ imageMode === 'scroll' ? 'scaleToFill' : imageMode }}"
            bindload="bindload" />
        <!-- 蒙层 -->
        <canvas class="face-highlight-canvas" canvas-id="highlightCanvas" bindtap="tapCanvas" style="display:{{ hidden ? 'none' : 'block' }}" />
    </view>
</scroll-view>
</template>

<script>
import mp from 'mp-helper';
import isEqual from 'lodash/isEqual';

const { inlineStyles } = mp.utils;

// 注册 Component
mp.Component({
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
        // 是否显示原图
        showOriginal: {
            type: Boolean,
            value: false
        },
        // 图片资源地址
        src: {
            type: String,
            value: '',
        },
        // 素材地址
        materialSrc: {
            type: String,
            value: '',
        },
        // 图片裁剪、缩放的模式
        // 主要可选值 scroll aspectFill aspectFit
        // scroll 为新增 即可通过滚动查看完整照片
        imageMode: {
            type: String,
            value: 'scroll'
        },
        // 人脸位置信息
        faces: {
            type: Array,
            value: [],
        },
        // 激活态的 face index
        activeIndexs: {
            type: Array,
            value: [],
        },
        // 带 mark tag 的 face index
        markTagIndexs: {
            type: Array,
            value: [],
        },
        // 是否展示蒙层 showMask
        showMask: {
            type: Boolean,
            value: false,
        },
        // 是否展示 indexTag (仅 mask 状态下展示)
        showIndexTag: {
            type: Boolean,
            value: false,
        }
    },
    // 组件的内部数据
    data: {
        hidden: false,
        imageSrc: '',
        scrollTop: 0,
        scrollLeft: 0,
        imageInfo: { // 图片信息
            imageWidth: 0, // 照片真实宽度
            imageHeight: 0, // 照片真实高度
            outWidth: 0, // 容器宽度
            outHeight: 0, // 容器高度
            innerTop: 0, // 视图中心区与容器的top
            innerLeft: 0, // 视图中心区与容器的left
            scale: 1,
        },
        // 人脸在canvas中的位置等信息
        faceInfo: [],
        // 蒙层背景颜色
        maskBgColor: 'rgba(0,0,0,0.6)',
        activeBorderColor: '#006eff',
    },
    // 组件的计算数据 (mp-helper 增强API)
    $computed: {
        // 图片样式 imageStyle
        imageStyle: {
            depend: ['imageMode', 'imageInfo', 'hidden'],
            get(imageMode, imageInfo, hidden) {
                return inlineStyles(Object.assign({
                    visibility: hidden ? 'hidden': 'visible',
                }, imageMode === 'scroll' ? {
                    width: imageInfo.imageWidth * imageInfo.scale + 'px',
                    height: imageInfo.imageHeight * imageInfo.scale + 'px',
                } : {
                    width: imageInfo.outWidth + 'px',
                    height: imageInfo.outHeight + 'px',
                }));
            }
        },
    },
    // 组件数据字段监听器
    observers: {
        src(src) {
            if (src !== this.data.imageSrc) {
                this.setData({
                    hidden: true,
                    imageSrc: src,
                });
            }
        },
        // 计算人脸位置
        'imageMode, imageInfo, faces'(imageMode, imageInfo, faces) {
            if (!imageInfo.imageWidth || !imageInfo.outWidth) return;
            // 如果是滚动，则没有 offsetTop offsetLeft 人脸的偏移
            let offsetTop, offsetLeft;
            if (imageMode === 'scroll') {
                offsetTop = 0;
                offsetLeft = 0;
            } else {
                offsetTop = imageInfo.innerTop;
                offsetLeft = imageInfo.innerLeft;
            }
            // 人脸信息
            const faceInfo = faces.map((face = {}) => {
                // 获取矩形
                const x = face.x || face.X; // px
                const y = face.y || face.Y; // px
                const width = face.width || face.Width; // px
                const height = face.height || face.Height; // px
                return { // 人脸在canvas中的位置等信息
                    x: x * imageInfo.scale + offsetLeft,
                    y: y * imageInfo.scale + offsetTop,
                    width: width * imageInfo.scale,
                    height: height * imageInfo.scale,
                };
            });
            if (!isEqual(this.data.faceInfo, faceInfo)) {
                this.setData({
                    faceInfo,
                });
            }
        },
        // 重新渲染
        'showMask, faceInfo'(showMask, faceInfo) {
            if (!this.ctx) this.ctx = wx.createCanvasContext('highlightCanvas', this);
            // 重置画布
            this.ctx.draw();
            // 绘制渲染
            this.renderFaces();
            this.drawFace();
            
        },
        // 活跃的 activeIndexs
        'activeIndexs, markTagIndexs'() {
            this.drawFace();
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
            if (!this.ctx) this.ctx = wx.createCanvasContext('highlightCanvas', this);
            this.setData({
                imageSrc: this.data.src,
            });
        },
        // 组件实例被移动到节点树另一个位置
        //moved() {},
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
        resize(size) {}
    },

    /* Methods */
    methods: {
        // 滚动区域滚动
        bindscroll(event) {
            const { scrollLeft, scrollTop } = event.detail;
            this._scrollLeft = scrollLeft;
            this._scrollTop = scrollTop;
        },
        // 图片加载成功，获取其原始宽高
        bindload(event) {
            const { width: imageWidth, height: imageHeight } = event.detail;
            // 同时获取容器的宽高
            this.createSelectorQuery().select('.face-highlight')
                .boundingClientRect((rect) => {
                    const { width: outWidth, height: outHeight, top: outY, left: outX } = rect;
                    this.computeInfo({
                        imageWidth,
                        imageHeight,
                        outWidth,
                        outHeight,
                        outX,
                        outY,
                    });
                }).exec();
        },
        // 计算图片及人脸信息
        computeInfo(info = {}) {
            const { imageWidth = 0, imageHeight = 0, outWidth = 0, outHeight = 0 } = info; // px
            const { imageMode } = this.data; // px

            if (!imageWidth || !outWidth) return;

            // 照片信息
            const imageProportion = imageHeight / imageWidth;
            const outProportion = outHeight / outWidth;
            // 算出 innerHeight innerWidth 及 innerTop innerLeft
            let innerHeight, innerWidth, innerTop, innerLeft;
            let scale; // 图片的缩放比例，即 占用的px/原图px 比例
            if (imageMode === 'aspectFit'
                ? outProportion > imageProportion  // aspectFit: 宽等，高未满 留白
                : outProportion < imageProportion) {  // aspectFill: 宽等，高溢出 裁剪
                innerWidth = outWidth; // px
                innerHeight = outWidth * imageProportion; // px
                innerTop = (outHeight - innerHeight) / 2; // px
                innerLeft = 0;
                scale = innerWidth / imageWidth;
            } else {
                innerHeight = outHeight; // px
                innerWidth = outHeight / imageProportion; // px
                innerTop = 0;
                innerLeft = (outWidth - innerWidth) / 2; // px
                scale = innerHeight / imageHeight;
            }

            // 重置
            const scrollTop = -innerTop < 0 ? 0 : -innerTop;
            const scrollLeft = -innerLeft < 0 ? 0 : -innerLeft;
            this._scrollTop = scrollTop;
            this._scrollLeft = scrollLeft;

            // 设置信息
            this.setData({
                imageInfo: {
                    ...info,
                    innerTop,
                    innerLeft,
                    scale,
                },
                scrollTop: 0,
                scrollLeft: 0,
            }, () => {
                this.setData({
                    scrollTop,
                    scrollLeft,
                }, () => {
                    this.setData({
                        hidden: false,
                    });
                });
            });
        },
        // 高亮出人脸位置
        renderFaces(drawing = true) {
            if (!this.data.showMask) return;
            const faceInfo = this.data.faceInfo || [];
            if (!faceInfo.length) return;
            // 获取图片实际的宽高及占用的宽高
            const {
                imageWidth, imageHeight,
                outWidth, outHeight,
                scale
            } = this.data.imageInfo; // px
            if (!outWidth || !outHeight) return;

            // 绘制全屏的半透明蒙版
            this.ctx.beginPath();
            this.ctx.setFillStyle(this.data.maskBgColor);
            const imageSize = this.data.imageMode === 'scroll' ? {
                width: imageWidth * scale,
                height: imageHeight * scale,
            } : {
                width: outWidth,
                height: outHeight,
            };
            this.ctx.fillRect(0, 0, imageSize.width, imageSize.height);

            // 清空人脸位置的绘制
            const self = this;
            faceInfo.forEach((info = {}) => {
                self.ctx.clearRect(info.x, info.y, info.width, info.height);
            });

            if (drawing) this.ctx.draw(); // 默认会立即执行绘制
        },
        // 点击canvas某区域
        tapCanvas(event) {
            if (!this.data.showMask) return;
            const { x, y } = event.detail;
            // 根据 x, y 判断点击的区域
            const tapX = x - this.data.imageInfo.outX + (this._scrollLeft || 0);
            const tapY = y - this.data.imageInfo.outY + (this._scrollTop || 0);
            // 找到点击的区域
            const currentFaceIndex = this.data.faceInfo.findIndex(info =>
                info.x <= tapX
                && tapX <= info.x + info.width
                && info.y <= tapY
                && tapY <= info.y + info.height);
            if (currentFaceIndex === -1) return;
            // 触发 tapface 事件, 响应结果
            this.triggerEvent('tapface', {
                index: currentFaceIndex, // index 为在 faces 中的序号
            });
        },
        // 选中某个人脸边框信息
        drawFace() {
            if (!this.data.showMask) return;
            const { faceInfo, activeIndexs, markTagIndexs } = this.data;

            this.renderFaces(false); // 清空重新绘制

            const self = this;
            faceInfo.forEach((info, index) => {
                if (!info) return;

                /* 绘制活跃边框 */
                const i = activeIndexs.indexOf(index);
                if (i !== -1) {
                    // 绘制激活人脸的边框
                    self.ctx.lineWidth = 2;
                    self.ctx.setStrokeStyle(self.data.activeBorderColor);
                    self.ctx.strokeRect(info.x, info.y, info.width, info.height);
                    // 绘制右上角 index tag
                    const tagSize = 20;
                    if (self.data.showIndexTag
                        && info.width >= tagSize && info.height >= tagSize) {
                        self.ctx.beginPath();
                        self.ctx.moveTo(info.x + info.width - tagSize, info.y);
                        self.ctx.lineTo(info.x + info.width, info.y);
                        self.ctx.lineTo(info.x + info.width, info.y + tagSize);
                        self.ctx.fillStyle = self.data.activeBorderColor;
                        self.ctx.fill();
                        self.ctx.font = '10px sans-serif';
                        self.ctx.setTextAlign('right');
                        self.ctx.setTextBaseline('top');
                        self.ctx.fillStyle = '#fff';
                        self.ctx.fillText(`${i + 1}`, info.x + info.width - 2, info.y);
                    }
                }

                /* 绘制配对标记 */
                // 对于 markTagIndexs 绘制其标记
                const j = markTagIndexs.indexOf(index)
                if (j !== -1) {
                    // 绘制右上角 mark tag
                    let tagSize = 12;
                    if (info.width < tagSize || info.height < tagSize) {
                        tagSize = Math.min(info.width, info.height);
                    }
                    self.ctx.beginPath();
                    self.ctx.moveTo(info.x + info.width - tagSize, info.y);
                    self.ctx.lineTo(info.x + info.width, info.y);
                    self.ctx.lineTo(info.x + info.width, info.y + tagSize);
                    self.ctx.fillStyle = self.data.activeBorderColor;
                    self.ctx.fill();
                }
            });

            this.ctx.draw();
        }
    }
});
</script>

<style lang="less">
face-highlight {
    position: relative;
}
.face-highlight {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    .face-highlight-content {
        position: relative;
    }
    .face-highlight-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
    }
    .face-highlight-canvas {
        width: 100%;
        height: 100%;
    }
}
</style>
