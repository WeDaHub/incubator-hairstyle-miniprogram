const requestAPI = require('../../lib/requestYunApi');

class ImageModeration {
    async imageModeration(FileUrl) {
        let prxBody = await requestAPI({
            url: 'https://cms.tencentcloudapi.com',
            host: 'cms.tencentcloudapi.com',
            service: 'cms',
            action: 'ImageModeration',
            version: '2019-03-21',
            region: 'ap-guangzhou',
            data: {
                FileUrl,
            }
        });
        console.log(prxBody);

        // 调用错误
        if (!prxBody.Response) throw prxBody;
        return prxBody.Response;
    }

    async run(data) {
        let result;
        try {
            result = await this.imageModeration(data.Url);
        } catch (err) {
            console.log(err);
            result = {
                Error: {
                    Code: err.Code || err.code || -2,
                    Message: err.Message || err.message || '未知错误',
                }
            };
        }
        return result;
    }
}

module.exports = new ImageModeration();
