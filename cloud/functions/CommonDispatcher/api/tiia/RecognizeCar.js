const requestAPI = require('../../lib/requestYunApi');

class RecognizeCar {
    async RecognizeCar(Url) {
        let prxBody = await requestAPI({
            url: 'https://tiia.tencentcloudapi.com',
            host: 'tiia.tencentcloudapi.com',
            service: 'tiia',
            action: 'RecognizeCar',
            version: '2019-05-29',
            region: 'ap-guangzhou',
            data: {
                ImageUrl: Url,
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
            result = await this.RecognizeCar(data.Url);
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

module.exports = new RecognizeCar();



