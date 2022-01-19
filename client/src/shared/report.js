/* 事件上报 */
// 判断是在正式环境还是在开发体验环境
function isRelease() {
    // envVersion 为空或release 并且 不是debug模式
    return (!__wxConfig.envVersion || __wxConfig.envVersion === 'release')
        && !__wxConfig.debug;
}

// 上报错误
export async function reportError(options) {
    if (!isRelease()) return; // 非正式环境不进行上报
    wx.reportAnalytics('error', {
        module: options.module, // 错误模块
        title: options.title, // 错误标题
        message: options.message, // 错误信息
        detail: options.detail, // 错误详情
    });
}

// 上报接口请求
export async function reportRequest(options) {
    if (!isRelease()) return; // 非正式环境不进行上报
    wx.reportAnalytics('request', {
        type: options.type, // 接口类型 cloud / api
        url: options.url, // 接口地址
        requestid: options.requestId, // 请求ID
    });
}
