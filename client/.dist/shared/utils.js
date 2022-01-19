/*
* @Author: bilibiliye
* @Date:   2020-05-29 12:45:11
* @Last Modified by:   bilibiliye
* @Last Modified time: 2020-05-29 23:46:12
*/
import mp from 'mp-helper';

const { promiser } = mp.utils;

let serverHost = 'ai.qq.com';
const FULL_URL_REGEX = /^https?:\/\//i;

export const setHost = (host) => {
    serverHost = host;
};

export const getHost = () => serverHost;

export const makeUrl = (url) => {
    // 添加请求域名
    if (!FULL_URL_REGEX.test(url)) {
        url = `https://${serverHost}${url}`;
    }
    return url;
};
function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
        return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (value === null || Number.isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
        return NaN;
    }
    // If the value is negative...
    if (value < 0) {
        return -decimalAdjust(type, -value, exp);
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(`${value[0]}e${value[1] ? (+value[1] - exp) : -exp}`));
    // Shift back
    value = value.toString().split('e');
    return +(`${value[0]}e${value[1] ? (+value[1] + exp) : exp}`);
}

/**
 * 四舍五入 round(1.005, -2); // 1.01
 */
export const round = (value, exp) => decimalAdjust('round', value, exp);

export const getPx2RpxRatio = ({
    width = 0
}) => {
    if (width > 0) {
        return round(width / 750, -2);
    }
    return 1;
};
export const request = (options) => {
    options.url = makeUrl(options.url);
    return promiser(wx.request)(options).then(response => {
        if (response.statusCode >= 200 && response.statusCode < 400) {
            return response;
        }
        throw new Error(response.data || '系统错误');
    });
};
export function doRequest(url, { imgUrl, imgPath }, otherData) {
    let data = otherData || {};
    if (imgUrl) {
        data.image_url = imgUrl;
        return request({
            url,
            data
        });
    } else if (imgPath) {
        return promiser(wx.uploadFile)({
            url: makeUrl(url),
            filePath: imgPath,
            name: 'image_file',
            formData: data
        }).then(res => {
            res.data = JSON.parse(res.data);
            return res;
        });
    }
}

/**
 * 图片上传
 * @param {string} imgPath 图片路径
 */
export const uploadImage = (imgPath) => {
    const url = '/cgi-bin/image_upload';
    return promiser(wx.uploadFile)({
        url: makeUrl(url),
        filePath: imgPath,
        name: 'image_file'
    }).then(res => {
        res.data = JSON.parse(res.data);
        return res;
    });
};

/**
 * 随机打乱array, 使用Fisher-Yates算法 (https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
 * @param {Array} array
 */
export const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));

        // swap elements array[i] and array[j]
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

/**
 * 获取文件后缀
 * @param {string} fileName 文件名
 */
export const getFileExtension = (fileName) => fileName.split('.').pop().toLowerCase();
