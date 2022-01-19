const requestAPI = require('../../lib/requestYunApi');
const { getFileUrl } = require('../../lib/utils');

class FuseFace {
    async fuseFace(data) {
        const { ProjectId, ModelId, MergeInfos } = data;
        let prxBody = await requestAPI({
            url: 'https://facefusion.tencentcloudapi.com',
            host: 'facefusion.tencentcloudapi.com',
            service: 'facefusion',
            action: 'FuseFace',
            version: '2018-12-01',
            region: 'ap-guangzhou',
            data: {
                RspImgType: 'url',
                ProjectId,
                ModelId,
                MergeInfos
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
            // 处理文件地址
            data.MergeInfos = await Promise.all((data.MergeInfos || []).map(async (e) => ({
                ...e,
                Url: await getFileUrl(e.Url),
            })));
            result = await this.fuseFace(data);
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

module.exports = new FuseFace();



