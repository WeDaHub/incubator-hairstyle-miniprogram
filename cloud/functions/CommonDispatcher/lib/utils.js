const cloud = require('wx-server-sdk');

cloud.init();

exports.getFileUrl = async function (url) {
    // 如果是 cloud:// 则，换取云文件真实链接
    if (/^cloud:\/\//.test(url)) {
        const { fileList } = await cloud.getTempFileURL({
            fileList: [url],
        });
        console.log('fileList:', fileList);
        if (!fileList || !fileList[0]) throw new Error('无法获取文件');
        const file = fileList[0];
        return file.tempFileURL;
    } else {
        return url;
    }
};
