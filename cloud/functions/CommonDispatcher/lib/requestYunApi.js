const {secretId, secretKey} = require('../config/secret');
const request = require('request');
const crypto = require('crypto');
const moment = require('moment');

function getAuthorization ({secretKey, secretId, host, service, action}, param, unixTimeStamp) {
    // ************* 步骤 1：拼接规范请求串 *************
    const http_request_method = 'POST'
    const canonical_uri = '/'
    const canonical_querystring = ''
    const canonical_headers = `content-type:application/json\nhost:${host}\n`
    const SignedHeaders = 'content-type;host'
    const hash = crypto.createHash('sha256')
    const HashedRequestPayload = hash.update(JSON.stringify(param)).digest('hex')

    //console.log(HashedRequestPayload);

    let CanonicalRequest = http_request_method + '\n' + canonical_uri + '\n' + canonical_querystring + '\n' + canonical_headers + '\n' + SignedHeaders + '\n' + HashedRequestPayload

    //console.log("===============CanonicalRequest=====================");
    //console.log(CanonicalRequest);
    //# ************* 步骤 2：拼接待签名字符串 *************

    const Algorithm = 'TC3-HMAC-SHA256'
    const RequestTimestamp = parseInt(unixTimeStamp / 1000)
    const CredentialScope = moment.utc(unixTimeStamp).format('YYYY-MM-DD') + '/' + service + '/tc3_request'
    const hash2 = crypto.createHash('sha256')
    const HashedCanonicalRequest = hash2.update(CanonicalRequest).digest('hex')

    let StringToSign = Algorithm + '\n' + RequestTimestamp + '\n' + CredentialScope + '\n' + HashedCanonicalRequest
    //console.log("===============StringToSign=====================");
    //console.log(StringToSign);

    //# ************* 步骤 3：计算签名 *************

    function sign (key, ValidateData) {
        let hmac = crypto.createHmac('sha256', key)
        return hmac.update(ValidateData).digest()
    }

    let SecretDate = sign('TC3' + secretKey, moment.utc(unixTimeStamp).format('YYYY-MM-DD'))
    let SecretService = sign(SecretDate, service)
    let SecretSigning = sign(SecretService, 'tc3_request')
    let hmac = crypto.createHmac('sha256', SecretSigning)
    let Signature = hmac.update(StringToSign).digest('hex')

    //console.log("===============signature=====================");
    //console.log(Signature);

    //# ************* 步骤 4：拼接 Authorization *************

    let Authorization = Algorithm + ' ' +
        'Credential=' + secretId + '/' + CredentialScope + ', ' +
        'SignedHeaders=' + SignedHeaders + ', ' +
        'Signature=' + Signature

    //console.log("===============Authorization=====================");
    // console.log(Authorization);
    return Authorization
}


function requestAPI({
    url,   // 请求地址
    host,  // 请求域名
    service, //服务名
    action, // 接口名称
    version, // 版本号
    region, // 地域 (可选)
    data, // 请求数据
}) {
    return new Promise((resolve, reject) => {
        let unixTimeStamp = Date.now()
        let Authorization = getAuthorization({secretId, secretKey, host, service, action}, data, unixTimeStamp)
        let postConfig = {
          url: url,
          method: 'POST',
          headers: {
            'Authorization': Authorization,
            'Host': host,
            'Content-Type': 'application/json',
            'X-TC-Action': action,
            'X-TC-Timestamp': parseInt(unixTimeStamp / 1000).toString(),
            'X-TC-Version': version,
            'X-TC-Region': region || 'ap-guangzhou',
          },
          json: true,
          body: data,
          timeout: 15000
        }
  
        request(postConfig, function (error, response, body) {
          // body is the decompressed response body
          // console.log('serverConfig', JSON.stringify(serverConfig))
          // console.log('postData', JSON.stringify(postData))
          // console.log('error', error)
          // // console.log('response', response)
          // console.log('the decoded data is: ', body)
          if (error) {
            reject(error)
          }
          resolve(body)
        })
    })
}

module.exports = requestAPI;