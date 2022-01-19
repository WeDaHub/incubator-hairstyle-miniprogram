const requestAPI = require('../../../lib/requestYunApi');

class SearchFaces {
    async searchFaces(OpenId, FaceModelVersion, Url) {
        let prxBody = await requestAPI({
            url: 'https://iai.tencentcloudapi.com',
            host: 'iai.tencentcloudapi.com',
            service: 'iai',
            action: 'ConsoleSearchFaces',
            version: '2020-03-03',
            region: 'ap-guangzhou',
            data: {
                MaxFaceNum: 3,
                MaxPersonNum: 3,
                NeedRotateDetection: 1,
                GroupIds: [`wx_${OpenId}_v${FaceModelVersion}`, `wx_searchfaces_public_v${FaceModelVersion}`],
                Url
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
            // 根据算法版本跨库搜索
            result = await this.searchFaces(data.OpenId, data.FaceModelVersion, data.Url);
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

module.exports = new SearchFaces();
