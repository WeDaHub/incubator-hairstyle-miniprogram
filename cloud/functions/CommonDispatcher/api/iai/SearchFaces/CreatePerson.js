const requestAPI = require('../../../lib/requestYunApi');

class CreatePerson {
    async createPerson(OpenId, FaceModelVersion, PersonIndex, Url) {
        let prxBody = await requestAPI({
            url: 'https://iai.tencentcloudapi.com',
            host: 'iai.tencentcloudapi.com',
            service: 'iai',
            action: 'CreatePerson',
            version: '2020-03-03',
            region: 'ap-guangzhou',
            data: {
                GroupId: `wx_${OpenId}_v${FaceModelVersion}`,
                PersonName: `wx_${OpenId}_v${FaceModelVersion}_p${PersonIndex}`,
                PersonId: `wx_${OpenId}_v${FaceModelVersion}_p${PersonIndex}`,
                NeedRotateDetection: 1,
                Url
            }
        });
        console.log(prxBody);

        // 调用错误
        if (!prxBody.Response) throw prxBody;
        return prxBody.Response;
    }

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
            // 往3.0库添加人员
            let createTasks = [];
            createTasks.push(this.createPerson(data.OpenId, '3', data.PersonIndex, data.Url));

            let resList = await Promise.all(createTasks);

            for (let res of resList) {
                if (res.Error) {
                    // 添加人员失败的时候删除人员
                    let deleteTasks = [];
                    deleteTasks.push(this.deletePerson(data.OpenId, '3', data.PersonIndex));

                    await Promise.all(deleteTasks);

                    throw res.Error;
                }
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

module.exports = new CreatePerson();
