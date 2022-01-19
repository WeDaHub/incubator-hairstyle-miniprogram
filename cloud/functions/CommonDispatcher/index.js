const cloud = require('wx-server-sdk');
const { getFileUrl } = require('./lib/utils');

cloud.init();

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    console.log('wxcontext:', wxContext);
    // 更新默认配置，将默认访问环境设为当前云函数所在环境
    if (wxContext.ENV !== 'local') cloud.updateConfig({ env: wxContext.ENV });
    console.log('event:', event);

    // 验证method存在
    const { method } = event;
    if (!method) {
        return {
            Response: {
                Error: {
                    Code: -1,
                    Message: '参数错误',
                },
            }
        };
    }

    // 传入openid
    event.data.OpenId = wxContext.OPENID;

    // 如果有文件传入fileUrl，如果其中有云存储fileID则将其转换为http url
    const { Url } = event.data;
    if (Url) {
        try {
            if (Array.isArray(Url)) { // 数组
                event.data.Url = await Promise.all(Url.map(url => getFileUrl(url)));
            } else { // 单值
                event.data.Url = await getFileUrl(Url);
            }
        } catch (err) {
            console.error(err);
            return {
                Response: {
                    Error: {
                        Code: -1,
                        Message: '文件错误',
                    },
                }
            };
        }
    }

    let requestRes;
    try {
        const methodHandler = require(`./api/${method}.js`);
        requestRes = {
            Response: await methodHandler.run(event.data),
        };
    } catch (err) {
        requestRes = {
            Response: {
                Error: {
                    Code: err.code || -1,
                    Message: err.message || '未知错误',
                },
            }
        };
    }

    return requestRes;
};
