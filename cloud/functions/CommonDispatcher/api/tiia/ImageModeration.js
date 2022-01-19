const requestAPI = require('../../lib/requestYunApi');

class ImageModeration {
    async ImageModeration(Url) {
        let prxBody = await requestAPI({
            url: 'https://tiia.tencentcloudapi.com',
            host: 'tiia.tencentcloudapi.com',
            service: 'tiia',
            action: 'ImageModeration',
            version: '2019-05-29',
            region: 'ap-guangzhou',
            data: {
                ImageUrl: Url,
                Scenes: ['PORN', 'TERRORISM', 'POLITICS'],
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
            result = await this.ImageModeration(data.Url);
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



