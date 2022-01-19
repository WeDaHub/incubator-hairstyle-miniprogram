import mp from 'mp-helper';
import { chooseImage, uploadImage, callFunction, uploadToTranslate, checkEvilImg } from '../../shared/methods';
import FusionStore from './fusionStore';

const { promiser } = mp.utils;
let fusionStore = new FusionStore();

// 注册 Page
mp.Page({
    // 页面数据
    data: {
        devicePosition: 'front', // 镜头
        cameraWidth: 0,
        cameraHeight: 0,
        // 预览照片
        previewSrc: null, // 本地照片
        previewFileId: null, // 对应的云存储照片
        // 当前选择照片的人脸信息
        faces: [],
        activeFaceIndexs: [], // 选中需导入的人脸 index
        // 识别人脸接口信息
        detectAction: 'iai/DetectFace',
        detectExtraQuery: { // 额外的查询数据作为参数传入接口
            MaxFaceNum: 5, // 最多一次识别5个人脸
            NeedFaceAttributes: 1,
            NeedQualityDetection: 0,
            // NeedRotateDetection:1, // 开启旋转检查，会增加500ms的搜索
        },
        // 仅将 fusionStore 的初始化数据给到页面，后续不再更新
        ...fusionStore.data,
    },

    /* 生命周期 */
    // 页面加载
    async onLoad(query = {}) {
        fusionStore = new FusionStore();
        this.setData({
            ...fusionStore.data,
        });
        // 进入首页，当前选中模板将清空
        fusionStore.data.currentMaterial = {};
        await fusionStore.getMaterialList();
        this.setData({
            materialList: fusionStore.data.materialList
        });
        
        // 获取摄像头权限失败提示
        this.$app.getScopeAuth('scope.camera', null, () => {
            wx.showToast({
                title: '请开启摄像头权限',
            });
        });
    },
    // 页面切入显示
    onShow() {},
    // 页面渲染完成
    onReady() {
        this.drawCamera();
    },
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
            path: '/pages/hairstyle/index',
        });
    },
    // 当前是 Tab 页时，点击 Tab 项
    //onTabItemTap(item) {},

    /* Others */

    /* Methods */
    // 相机初始化完成
    cameraInitDone(event) {
        this.drawCamera();
    },
    // 用户不允许使用摄像头时触发
    cameraError(event) {
        event.title = '调起摄像头失败';
        this.$app.logger.error(event);
    },
    // 切换镜头
    tapSwitchLens() {
        this.setData({
            devicePosition: this.data.devicePosition === 'front' ? 'back' : 'front',
        });
    },
    // 绘制相册的蒙层
    drawCamera() {
        const cameraArea = this.createSelectorQuery().select('.camera-area');

        if (!cameraArea) return;
        // 同时获取容器的宽高
        cameraArea.boundingClientRect((rect) => {
            const { width = 375, height = 375 } = rect || {};
            this.setData({
                cameraWidth: width,
                cameraHeight: height,
            });
            // 绘制蒙层
            const ctx = wx.createCanvasContext('cameraMask');
            const maskInfo = { width, height: width * 473 / 375 };
            const y = parseInt((height - maskInfo.height) / 2);
            ctx.drawImage('/assets/imgs/photoArea.png', 0, y, maskInfo.width, maskInfo.height);
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, 0, width, y);
            ctx.fillStyle = '#fff';
            ctx.font = '14px sans-serif';
            ctx.setTextAlign('center');
            ctx.setTextBaseline('bottom');
            ctx.fillText('请正脸拍摄', width / 2, y);
            ctx.draw();
        }).exec();
    },
    // 通过相册选择照片
    async tapAlbum() {
        let tempFilePath = await chooseImage(['message', 'album']);
        if(!tempFilePath) return
        // 验证end
        await this.detectImageFace(tempFilePath);
    },
    // 拍照选中照片
    takePhoto() {
        const self = this;
        const ctx = wx.createCameraContext();
        try {
            ctx.takePhoto({
                quality: 'high',
                success({ tempImagePath }) {
                    self.detectImageFace(tempImagePath);
                }
            });
        } catch (err) { 
            console.error(err); 
            this.$setStore({
                error: err.message
            });
        }
    },
    // 识别照片中的人脸
    async detectImageFace(tempPath) {
        try {
            // 上传至云存储
            const fileID = await uploadImage(tempPath);
            // 图片上传验证
            const isEvil = await checkEvilImg(fileID);
            if (isEvil) return;

            this.setData({
                previewSrc: tempPath,
            });
                
            // 发送识别请求查询人脸信息
            let { detectAction } = this.data;
            if (!fileID || !detectAction) return;
            wx.showLoading({
                title: '识别人脸中',
                mask: true
            });
            // 调用云函数
            const { result: res } = await callFunction({
                name: 'CommonDispatcher',
                data: {
                    method: detectAction,
                    data: { // 要透传的数据
                        ...this.data.detectExtraQuery,
                        Url: fileID
                    },
                },
            });
            console.log('detectFace res: ', res)
            if (!res.Response) throw res;
            let err = res.Response.Error;
            if (err) {
                err = new Error(err.Message);
                err.title = err.message;
                throw err;
            }
            const detectResult = res.Response;
            // 找出人脸信息
            const faces = detectResult.FaceInfos || [];
            let activeFaceIndexs = [];
            if (faces.length) {
                activeFaceIndexs = [0]; // 单人模板，默认选中第一个
            }
            this.setData({
                faces,
                activeFaceIndexs,
            });
            wx.hideLoading();
            this.setData({
                previewFileId: fileID,
            });
        } catch (err) {
            err.title = err.title || '识别失败';
            this.$app.logger.error(err);
            // 延迟关闭
            const self = this;
            setTimeout(() => {
                self.previewCancel();
            }, 2000);
        }
    },
    // 点击人脸（单人模板为单个、多人模板为人脸数、添加人脸库不限制个数）
    tapface(event) {
        const { index } = event.detail;
        let activeIndexs = this.data.activeFaceIndexs || [];
        const { currentMaterial } = fusionStore.data;
        if (activeIndexs.indexOf(index) === -1) { // 添加
            if (this.data.addMore) { // 不限制个数
                activeIndexs.push(index);
            } else if (currentMaterial && currentMaterial.type === 'multi') { // 多人模板
                const len = (currentMaterial.MaterialFaceList || []).length; // 人脸数
                if (activeIndexs.length < len) {
                    activeIndexs.push(index);
                } else {
                    activeIndexs[activeIndexs.length] = index;
                }
            } else { // 单人模板
                activeIndexs = [index]
            }
        } else { // 删除
            activeIndexs.splice(activeIndexs.indexOf(index), 1);
        }
        this.setData({
            activeFaceIndexs: activeIndexs,
        });
    },
    // 预览照片取消
    previewCancel() {
        this.setData({
            previewSrc: null,
            previewFileId: null,
            faces: [],
            activeFaceIndexs: [],
        }, () => {
            this.drawCamera();
        });
    },
    // 预览照片确定
    previewConfirm() {
        // 选中的人脸
        const activeFaces = this.data.activeFaceIndexs.map(i => {
            const { Height = 0, Width = 0, X = 0, Y = 0, FaceAttributesInfo: { Gender } } = this.data.faces[i] || {};
            return {
                Url: this.data.previewFileId,
                InputImageFaceRect: { Height, Width, X, Y },
                Gender,
            };
        });
        fusionStore.data.faceList = activeFaces;
        this.$app.logger.log(fusionStore.data);
        wx.redirectTo({
            url: '/pages/hairstyle/preview'
        });
    }

});