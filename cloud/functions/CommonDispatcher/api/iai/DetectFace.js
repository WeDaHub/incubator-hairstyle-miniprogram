const requestAPI = require('../../lib/requestYunApi');

class DetectFace {
    async detectFace(data) {
        const { 
            MaxFaceNum,
            Url,
            NeedFaceAttributes,
            NeedQualityDetection,
            FaceModelVersion,
            NeedRotateDetection,
            MinFaceSize,
        } = data;
        let prxBody = await requestAPI({
            url: 'https://iai.tencentcloudapi.com',
            host: 'iai.tencentcloudapi.com',
            service: 'iai',
            action: 'DetectFace',
            version: '2020-03-03',
            region: 'ap-guangzhou',
            data: {
                MaxFaceNum,
                Url,
                NeedFaceAttributes,
                NeedQualityDetection,
                FaceModelVersion,
                NeedRotateDetection,
                MinFaceSize,
            },
        });
        console.log('prxBody: ', prxBody);

        // 调用错误
        if (!prxBody.Response) throw prxBody;
        return prxBody.Response;
    }

    async run(data) {
        let result;
        try {
            result = await this.detectFace(data);
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

module.exports = new DetectFace();
