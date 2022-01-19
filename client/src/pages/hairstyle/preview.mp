<config lang="json">
{
    "navigationBarTitleText": "发型屋",
    "backgroundColorBottom": "#ffffff",
    "usingComponents": {
        "face-highlight": "./components/faceHighlight",
        "face-avatar": "./components/faceAvatar",
        "error-tip": "./components/errorTip",
        "image-loader": "./components/imageLoader"
    }
}
</config>

<template>
<error-tip />

<view class="container fusion {{ $store.isIpx ? 'is-ipx' : '' }}">
    <view class="content">
        <!--预览区（可高亮）-->
        <face-highlight
            class="main-preview"
            image-mode="aspectFit"
            src="{{ resultUrl }}"
            materialSrc="{{ faceList[0].Url }}"
            showOriginal="{{ showOriginal }}"
            bindtap="tapPreview"
            bindlongpress="tapPreview" />

        <!--悬浮按钮组-->
        <cover-view class="fusion-tool-btn">
            <cover-image 
                class="btn-icon" 
                src="/assets/imgs/contrast.png"
                catchtouchstart="tapContrast" 
                catchtouchend="tapContrastCancel" 
                catchtouchcancel="tapContrastCancel"
            />
            <cover-view style="justify-content: flex-end; display: flex; margin-right: 10px;">
                <cover-image class="btn-icon" src="/assets/imgs/exchange.png" bindtap="tapExchange" />
                <cover-image wx:if="{{ resultUrl }}" class="btn-icon" src="/assets/imgs/download.png" bindtap="tapDownload" />
            </cover-view>
        </cover-view>

        <!--底部区域-->
        <view class="bottom-bar">
            <!--模板列表-->
            <view class="face-list-bar">
                <scroll-view scroll-x style="height: 100%">
                    <view class="list-bar-tab-content">
                        <image-loader
                            wx:for="{{ resultUrls || materialList[currentGender]  }}"
                            wx:key="MaterialId"
                            class="face-round {{ index === currentIndex ? 'active' : '' }}"
                            mode="aspectFill"
                            src="{{ item.Url }}"
                            data-index="{{ index }}"
                            bindtap="switchMaterial"
                            cache />
                    </view>
                </scroll-view>
            </view>
        </view>
    </view>
</view>
<view></view>
</template>

<script>
import mp from 'mp-helper';
import isEqual from 'lodash/isEqual';
import FusionStore from './fusionStore';
import { callFunction } from '../../shared/methods';

let fusionStore = new FusionStore();

// 注册页面 (使用 Component 构造组件化页面)
// https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/component.html#使用-Component-构造器构造页面
mp.Component({
    // 配置项
    options: {
        addGlobalClass: true, // 支持全局样式
    },

    // 上下文数据 context (mp-helper 增强API)
    // 将注入到当前页面及其所有组件的 data.$context 内, 跨页面不共享
    // 通过 this.$setContext 设置页面上下文数据使页面响应, 用法与一致 setData
    $context: {

    },

    // 页面数据
    data: {
        fuseFaceAction: 'facefusion/FuseFace',
        // 当前模板性别
        currentGender: 'female',
        // 当前大图对应模板
        currentIndex: 0,
        // 当前批量结果
        resultUrls: [],
        // 仅将 fusionStore 的初始化数据给到页面，后续不再更新
        ...fusionStore.data,
    },
    // 计算数据 (mp-helper 增强API)
    $computed: {
        resultUrl: {
            depend: ['currentIndex', 'resultUrls'],
            get(currentIndex, resultUrls = []) {
                return resultUrls[currentIndex] && resultUrls[currentIndex].Url
            }
        }
    },
    // 数据字段监听
    observers: {},

    /* Methods */
    methods: {
        /* 页面生命周期 */
        // 页面加载
        onLoad(query = {}) {
            fusionStore = new FusionStore();
            const { faceList } = fusionStore.data;
            this.setData({
                ...fusionStore.data,
                currentGender: faceList[0].Gender < 50 ? 'female' : 'male', // 上传图片的性别
            });
            // 初始化模板进行融合
            this.fusionFace();
        },
        // 页面切入显示
        onShow() {
        },
        // 页面渲染完成
        onReady() {},
        // 页面隐藏
        onHide() {},
        // 页面卸载
        onUnload() {},

        /* 页面事件 */
        // 下拉刷新
        //onPullDownRefresh() {},
        // 上拉触底
        //onReachBottom() {},
        // 页面滚动
        //onPageScroll(event) {},
        // 页面尺寸改变
        //onResize() {},
        // 转发分享 (定义了此事件，右上角菜单将显示`转发`按钮)
        onShareAppMessage(event) {
            // 自动生成分享信息
            return this.$app.genShareMessage(this, {
                path: '/pages/hairstyle/index'
            });
        },
        // 当前是 Tab 页时，点击 Tab 项
        //onTabItemTap(item) {},

        /* Other Methods */
        // 点击对比原图
        tapContrast(e) {
            this.setData({
                showOriginal: true
            });
        },
        // 取消对比
        tapContrastCancel(e) {
            this.setData({
                showOriginal: false
            });
        },
        // 点击变化人脸
        tapExchange() {
            const { currentGender } = this.data;
            this.setData({
                currentGender: currentGender === 'female' ? 'male' : 'female'
            }, () => this.fusionFace());
        },
        // 点击预览图
        tapPreview() {
            if (!this.data.resultUrl) return;
            wx.previewImage({
                current: this.data.resultUrl,
                urls: [this.data.resultUrl],
            });
        },
        // 点击交换人脸确定
        tapConfirm() {
            // 判断当前是否有一个人脸有融合
            if (this.data.markTagTemplateFaceIndexs.length <= 0) {
                wx.showToast({
                    title: '请选择人脸进行融合',
                    icon: 'none',
                });
                return;
            }
           
        },
        // 点击下载融合图片
        tapDownload() {
            if (!this.data.resultUrl) return;
            wx.previewImage({
                current: this.data.resultUrl,
                urls: [this.data.resultUrl],
            });
        },
        // 切换模板素材
        switchMaterial(event) {
            const { index } = event.currentTarget.dataset;
            if (index === undefined) return;
            this.setData({
                currentIndex: index
            });
        },
        getPostData(mergeInfos) {
            const { materialList } = fusionStore.data;
            const { currentGender } = this.data;
            const { InputImageFaceRect, Url } = mergeInfos[0];
            return materialList[currentGender].map(e => {
                return {
                    ProjectId: e.ProjectId,
                    ModelId: e.MaterialId,
                    MergeInfos: [{
                        TemplateFaceID: e.MaterialFaceList[0].FaceId,
                        InputImageFaceRect,
                        Url
                    }]
                }
            }); 
        },
        // 进行人脸融合, removeCurrent 表示移除当前的结果
        async fusionFace() {
            const { resultList, faceList } = fusionStore.data;
            const MergeInfos = faceList;
            if (!MergeInfos.length) { // 没有融合信息，则恢复模板
                this.setData({ resultUrl: '' });
                return;
            }
            const postData = this.getPostData(MergeInfos);
            console.log('postData', postData);
            // // 先判断当前人脸融合结果是否已在结果列表
            // const res = resultList.find(e => e.MaterialId === postData.ModelId && isEqual(e.MergeInfos, postData.MergeInfos));
            // if (res && res.FusedImage) {
            //     this.setData({
            //         resultUrl: res.FusedImage, // 返回结果列表中的融合接口
            //     });
            //     return;
            // }
            try {
                // 发送请求
                let { fuseFaceAction } = this.data;
                if (!fuseFaceAction) return;
                wx.showLoading({
                    title: '发型生成中...',
                    mask: true
                });
                // 批量调用云函数
                const fusionTasks = postData.map(data => {
                    return callFunction({
                        name: 'CommonDispatcher',
                        data: {
                            method: fuseFaceAction,
                            data
                        },
                    });
                });
                const fusionResultList = (await Promise.all(fusionTasks)).map(res => res.result.Response);
                
                // 保存结果
                // fusionStore.addResultList(postData.ModelId, postData.MergeInfos, fusionResult);
                this.setData({
                    resultUrls: fusionResultList.map(e => ({
                        Url: e.FusedImage,
                    })),
                    // resultList: fusionStore.data.resultList,
                });
                wx.hideLoading();
            } catch (err) {
                err.title = err.title || '融合失败';
                this.$app.logger.error(err);
            }
        },
    }
});
</script>

<style lang="less">
.fusion {
    position: relative;
    padding-bottom: 0 !important;
    .main-preview {
        flex: 1;
    }
    // 工具区域
    .fusion-tool-btn {
        position: absolute;
        // padding: 28rpx 30rpx;
        // right: 0;
        bottom: 320rpx;
        z-index: 2;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        .btn-tooltip {
            position: relative;
            padding-right: 20rpx;
            margin-right: -20rpx;
            .btn-tooltip-content {
                border-radius: 4rpx;
                background-color: #555;
                color: #fff;
                font-size: 28rpx;
                line-height: 60rpx;
                height: 60rpx;
                padding: 0 18rpx;
            }
            .btn-tooltip-arrow {
                content: '';
                position: absolute;
                top: 50%;
                width: 20rpx;
                height: 20rpx;
                margin-top: -10rpx;
                right: 11rpx;
                background-color: #555;
                transform-origin: 50% 50%;
                transform: rotate(45deg);
            }
        }
        .btn-icon {
            width: 92rpx;
            height: 92rpx;
            margin-left: 18rpx;
            display: flex;
            flex-grow: 0;
            flex-shrink: 0;
            flex-basis: auto;
            align-items: center;
        }
    }
    // 顶部确认换脸
    .fusion-confirm-btn {
        position: absolute;
        top: 0;
        right: 0;
        padding: 36rpx;
        z-index: 2;
        display: flex;
        align-items: center;
        .btn-icon {
            width: 48rpx;
            height: 48rpx;
        }
    }
    // 底部区域
    .bottom-bar {
        flex-shrink: 0;
        height: 300rpx; // 1rpx border-top
    }
    .face-list-bar {
        height: 100%;
        border-top: 1rpx solid #e5e5e5;
        background: #fff;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        z-index: 3;
        .bar-remind {
            text-align: center;
            font-size: 28rpx;
            line-height: 40rpx;
            padding: 36rpx 36rpx 4rpx;
            color: #666;
        }
    }
    // tab
    .list-bar-tab {
        height: 88rpx;
        border-bottom: 1rpx solid #e5e5e5;
        display: flex;
        align-items: flex-end;
        padding: 0 8rpx;
        .list-bar-tab-item {
            font-size: 32rpx;
            line-height: 88rpx;
            margin: 0 48rpx 0 32rpx;
            color: #888;
            border-bottom: 4rpx solid transparent;
            &.active {
                color: #006eff;
                border-bottom-color: #006eff;
            }
        }
    }
    .list-bar-tab-content {
        height: 300rpx;
        padding: 0 26rpx;
        display: flex;
        align-items: center;
        .face-round {
            flex-shrink: 0;
            margin: 0 12rpx;
            width: 200rpx;
            height: 200rpx;
            background-color: #f2f2f2;
            box-sizing: border-box;
            overflow: hidden;
            image {
                width: 200rpx;
                height: 200rpx;
            }
            &.active {
                box-shadow: 0 0 0 5rpx #006eff;
            }
        }
    }
    // face list
    .face-list-content {
        height: 180rpx;
        padding: 0 22rpx;
        display: flex;
        align-items: center;
        .face-list-item {
            flex-shrink: 0;
            width: 120rpx;
            height: 120rpx;
            border-radius: 10rpx;
            margin: 0 15rpx;
            overflow: hidden;
            image {
                width: 200rpx;
                height: 200rpx;
                border-radius: 10rpx;
            }
            &.active {
                box-shadow: 0 0 0 4rpx #006eff;
            }
            &.face-list-add {
                border-radius: 0;;
            }
        }
        .face-list-item-origin {
            position: relative;
            .face-avatar-origin-text {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
                background-color: rgba(0,0,0,0.4);
                color: rgba(255,255,255,0.8);
                font-size: 30rpx;
                line-height: 36rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                box-sizing: border-box;
                padding: 20rpx;
            }
        }
    }

    // iphone x
    &.is-ipx {
        .fusion-tool-btn {
            margin-bottom: 32rpx;
        }
        .bottom-bar,
        .face-list-bar {
            padding-bottom: 32rpx;
        }
    }
    .switch-engine-picker {
        flex: 1;
        text-align: right;
    }
    .list-bar-tab .switch-engine-tab {
        color: #006eff;
    }
}
</style>
