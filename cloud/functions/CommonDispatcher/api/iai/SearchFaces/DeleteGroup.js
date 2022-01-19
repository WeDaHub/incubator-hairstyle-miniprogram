const requestAPI = require('../../../lib/requestYunApi');

class DeleteGroup {
    async deleteGroup(GroupId, FaceModelVersion) {
        let prxBody = await requestAPI({
            url: 'https://iai.tencentcloudapi.com',
            host: 'iai.tencentcloudapi.com',
            service: 'iai',
            action: 'DeleteGroup',
            version: '2020-03-03',
            region: 'ap-guangzhou',
            data: {
                GroupId: `wx_${GroupId}_v${FaceModelVersion}`
            }
        });
        console.log(prxBody);

        // 调用错误
        if (!prxBody.Response) throw prxBody;
        return prxBody.Response;
    }

    async run(data) {
        let result = [];
        try {
            // 删除3.0库
            let deleteTasks = [];
            deleteTasks.push(this.deleteGroup(data.OpenId, '3'));

            let resList = await Promise.all(deleteTasks);

            for (let res of resList) {
                if (res.Error) throw res.Error;
                result.push(res);
                // console.log(res)
            }
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

module.exports = new DeleteGroup();
