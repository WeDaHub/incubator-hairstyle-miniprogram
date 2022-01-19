const requestAPI = require('../../../lib/requestYunApi');

class CreateGroup {
    async createGroup(GroupId, FaceModelVersion) {
        let prxBody = await requestAPI({
            url: 'https://iai.tencentcloudapi.com',
            host: 'iai.tencentcloudapi.com',
            service: 'iai',
            action: 'CreateGroup',
            version: '2020-03-03',
            region: 'ap-guangzhou',
            data: {
                GroupId: `wx_${GroupId}_v${FaceModelVersion}`,
                GroupName: `wx_${GroupId}_v${FaceModelVersion}`,
                FaceModelVersion: `${FaceModelVersion}.0`,
            }
        });
        console.log('createGroupRes: ', prxBody);

        // 调用错误
        if (!prxBody.Response) throw prxBody;
        return prxBody.Response;
    }

    async deleteGroup(GroupId, FaceModelVersion) {
        let prxBody = await requestAPI({
            url: 'https://iai.tencentcloudapi.com',
            host: 'iai.tencentcloudapi.com',
            service: 'iai',
            action: 'DeleteGroup',
            version: '2020-03-03',
            region: 'ap-guangzhou',
            data: {
                GroupId: `wx_${GroupId}_v${FaceModelVersion}`,
                // GroupName: `wx_${GroupId}_v${FaceModelVersion}`,
                // FaceModelVersion: `${FaceModelVersion}.0`
            }
        });
        console.log('deleteGroupRes: ', prxBody);

        // 调用错误
        if (!prxBody.Response) throw prxBody;
        return prxBody.Response;
    }

    async run(data) {
        let result = [];
        try {
            // 创建3.0库
            const { OpenId } = data;
            let res = await this.createGroup(OpenId, '3');

            let isExist = false;
            if (res.Error && res.Error.Code) {
                if (res.Error.Code === 'InvalidParameterValue.GroupIdAlreadyExist' || res.Error.Code === 'InvalidParameterValue.GroupNameAlreadyExist') {
                    isExist = true;
                } else {
                    // 添加人员库失败的时候删除人员
                    await this.deleteGroup(OpenId, '3');
                    throw res.Error;
                }
            }

            if (isExist) {
                // 如果人员库存在，删除3.0库
                res = await this.deleteGroup(OpenId, '3');

                if (res.Error) throw res.Error;

                // 重新尝试新建人员库
                res = await this.createGroup(OpenId, '3');

                if (res.Error) throw res.Error;

                result = res;
            }
        } catch (err) {
            console.log(err);
            result = {
                Error: {
                    Code: err.Code || -2,
                    Message: err.Message || '未知错误',
                }
            };
        }
        return result;
    }
}

module.exports = new CreateGroup();
