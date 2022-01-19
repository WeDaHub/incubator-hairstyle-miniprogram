import mp from 'mp-helper';
import logger from './logger';
import { reportRequest } from './report';

const { promiser, urlString } = mp.utils;

// 选择照片, 参数 sources 为来源 默认 'message', 'album', 'camera'
export async function chooseImage(sources = ['message', 'album', 'camera']) {
    let tempFilePath;
    // 过滤掉 message 才是 wx.chooseImage 的参数 sourceType
    const chooseImageSourceType = sources.filter(e => e !== 'message');
    try {
        let name = 'image';
        // 如果 sources 中有指定 message 才显示 actionSheet
        if (sources.includes('message')) {
            const actions = [
                chooseImageSourceType.length ? { name: 'image', text: '本地图片' } : null,
                { name: 'message', text: '聊天图片' },
            ].filter(Boolean);
            const { tapIndex } = await promiser(wx.showActionSheet)({
                itemList: actions.map(e => e.text),
            });
            name = (actions[tapIndex] || {}).name;
        }
        if (!name) return;
        // 选择本地图片
        if (name === 'image') {
            const { tempFilePaths } = await promiser(wx.chooseImage)({
                count: 1,
                sizeType: ['compressed'],
                sourceType: chooseImageSourceType,
            });
            tempFilePath = tempFilePaths[0];
        } else { // 选择聊天会话图片
            const { tempFiles } = await promiser(wx.chooseMessageFile)({
                count: 1,
                type: 'image',
            });
            tempFilePath = (tempFiles[0] || {}).path;
        }
        if (!tempFilePath) return;
        // 压缩
        const compressResult = await promiser(wx.compressImage)({
            src: tempFilePath, // 照片路径
            quality: 30, // 压缩质量
        });
        tempFilePath = compressResult.tempFilePath;
    } catch (err) { }
    return tempFilePath;
}

// 上传照片，返回 fileID
export async function uploadImage(tempFilePath, ifShowToast = true) {
    ifShowToast && wx.showLoading({
        title: '上传中',
        mask: true
    });
    const _id = String(Math.random()).slice(2, 7);
    try {
        // 获取照片信息
        const { digest } = await promiser(wx.getFileInfo)({
            filePath: tempFilePath,
        });
        const data = {
            cloudPath: `tmp/${digest}.jpg`, // 云临时地址
            filePath: tempFilePath, // 本地地址
        };
        logger.log(`[${_id}]`, 'uploadFile:', data);
        const uploadFileResult = await wx.cloud.uploadFile(data);
        const { fileID } = uploadFileResult;
        logger.log(`[${_id}]`, 'uploadFile fileID:', fileID);
        ifShowToast && wx.hideLoading();
        if (!fileID) throw uploadFileResult;
        return fileID;
    } catch (err) {
        err.title = err.title || '上传失败';
        throw err;
    }
}

// 判断图片检查结果是否通过
export function imgIsEvil(response) {
    console.log('response', response);
    const { Data } = response;
    const {
        HotDetect, IllegalDetect, PolityDetect, PornDetect, TerrorDetect
    } = Data;
    if ((Data.EvilFlag === 1 || Data.EvilType !== 100)
        || (HotDetect && (HotDetect.EvilFlag === 1 || HotDetect.EvilType !== 100))
        || (IllegalDetect && (IllegalDetect.EvilFlag === 1 || IllegalDetect.EvilType !== 100))
        || (PolityDetect && (PolityDetect.EvilFlag === 1 || PolityDetect.EvilType !== 100))
        || (PornDetect && (PornDetect.EvilFlag === 1 || PornDetect.EvilType !== 100))
        || (TerrorDetect && (TerrorDetect.EvilFlag === 1 || TerrorDetect.EvilType !== 100))
    ) {
        getApp().$setStore({
            error: '图片包含敏感信息，请更换图片。'
        });
        return true; // 图片不通过则返回true
    }
    wx.hideLoading();
    return false;
}

// 调用cms图片安全检查, 返回是否通过
export async function checkEvilImg(fileID, ifShowToast = true) {
    ifShowToast && wx.showLoading({
        title: '上传图片检查中',
        mask: true
    });
    /* eslint-disable no-use-before-define */
    const { result } = await callFunction({
        name: 'CommonDispatcher',
        data: {
            method: 'cms/ImageRecognition',
            data: {
                Url: fileID, // fileUrl: 文件 url (支持字符串或者数组) 在云函数中如果是云存储 fileID 则会进行转换
            },
        },
    });
    if (result.Response.Error) {
        ifShowToast && wx.hideLoading();
        getApp().$setStore({
            error: result.Response.Error.Message
        });
    }
    ifShowToast && wx.hideLoading();
    return imgIsEvil(result.Response);
}

// 调用云函数，并将此事件上报
export async function callFunction(options) {
    const _id = String(Math.random()).slice(2, 7);
    const { data = {} } = options || {};
    const url = !data.action ? options.name : (`${options.name}:${data.action}`);
    const info = {
        type: 'cloud',
        url, // 接口地址
    };
    logger.log(`[${_id}]`, 'callFunction:', info, options);
    const res = await wx.cloud.callFunction(options);
    info.requestId = res.requestID; // 请求ID
    logger.log(`[${_id}]`, 'callFunction requestId:', info.requestId);
    reportRequest(info);
    return res;
}
export async function uploadToTranslate(path) {
    wx.showLoading({
        title: '上传图片检查中',
        mask: true
    });
    try {
        const { data, errMsg } = await promiser(wx.getFileSystemManager().readFile)({
            filePath: path,
            encoding: 'base64',
        });
        if (!data) throw errMsg;
        return data;
    } catch (err) {
        err.title = err.title || '图片转换base64失败';
        throw err;
    }
}

// 检查是否已经同意用户隐私条例
export async function hasAgreePrivacyProtocol() {
    try {
        const { result } = await callFunction({
            name: 'HandleProtocol',
            data: {
                type: 'check'
            },
        });
        return result.hasAgree;
    } catch (err) {
        return false;
    }
}

// 点击活动或运营位, 跳转至小程序内页面/其他小程序/webview页面/video页面
export function navigate(item) {
    const {
        mode, wxAppid, url, title
    } = item;
    switch (mode) {
        case 'navigateToMiniProgram':
            wx.navigateToMiniProgram({
                appId: wxAppid,
                path: url || '',
            });
            break;
        case 'video':
            wx.navigateTo({
                url: urlString.stringify('/pages/common/video', {
                    url,
                    title,
                }),
            });
            break;
        case 'webview':
            wx.navigateTo({
                url: urlString.stringify('/pages/common/webview', {
                    url,
                    title,
                }),
            });
            break;
        default:
            wx.navigateTo({
                url: urlString.stringify(url),
            });
    }
}
