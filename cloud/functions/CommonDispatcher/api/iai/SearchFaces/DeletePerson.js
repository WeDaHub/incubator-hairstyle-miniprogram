const requestAPI = require('../../../lib/requestYunApi');

class DeletePerson {
    async deletePerson(OpenId, FaceModelVersion, PersonIndex) {
        let prxBody = await requestAPI({
            url: 'https://iai.tencentcloudapi.com',
            host: 'iai.tencentcloudapi.com',
            service: 'iai',
            action: 'DeletePerson',
            version: '2020-03-03',
            region: 'ap-guangzhou',
            data: {
                PersonId: `wx_${OpenId}_v${FaceModelVersion}_p${PersonIndex}`
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
            // 并行删除2.0, 3.0库中的人员
            let deleteTasks = [];
            deleteTasks.push(this.deletePerson(data.OpenId, '2', data.PersonIndex));
            deleteTasks.push(this.deletePerson(data.OpenId, '3', data.PersonIndex));

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

module.exports = new DeletePerson();
