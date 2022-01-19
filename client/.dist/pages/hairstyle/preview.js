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
                path: '/pages/vision/effect/fusion/index'
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