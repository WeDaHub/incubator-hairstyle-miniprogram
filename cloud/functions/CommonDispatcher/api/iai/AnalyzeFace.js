const requestAPI = require('../../lib/requestYunApi');

class AnalyzeFace {
    async analyzeFace(Url) {
        let prxBody = await requestAPI({
            url: 'https://iai.tencentcloudapi.com',
            host: 'iai.tencentcloudapi.com',
            service: 'iai',
            action: 'AnalyzeFace',
            version: '2020-03-03',
            region: 'ap-guangzhou',
            data: {
                Url,
                NeedRotateDetection: 1,
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
            result = await this.analyzeFace(data.Url);
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

module.exports = new AnalyzeFace();



