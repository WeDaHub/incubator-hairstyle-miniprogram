import { reportError } from './report';

// 日志与上报
const logger = wx.getLogManager();
const realtimeLogger = wx.canIUse('getRealtimeLogManager') ? wx.getRealtimeLogManager() : null;

function log(...msg) {
    console.log(...msg);
    logger.log(...msg);
    realtimeLogger && realtimeLogger.info(...msg);
}

function error(err = {}, ...msg) {
    console.error(err, ...msg);
    logger.warn(err, ...msg);
    realtimeLogger && realtimeLogger.error(err, ...msg);
    // 将 err 转换为标准格式错误
    const title = err.title || err.message || '未知错误';
    // 上报错误
    if (err.reportError !== false) {
        reportError({
            module: err.module,
            title,
            message: err.message,
            detail: JSON.stringify(err),
        });
    }
    if (err.showToast !== false) {
        getApp().$setStore({
            error: title
        });
        // wx.showToast({
        //     title,
        //     icon: 'none',
        // });
    }
}

export default {
    log,
    error,
};
