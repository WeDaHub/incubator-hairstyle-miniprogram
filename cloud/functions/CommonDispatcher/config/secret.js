// const configKeyHelper = require('configkeyhelpernodejs');

module.exports = {
    secretId: configKeyHelper.Decrypt('ENCRYPTED_SECRETID_HERE', 'SECRET_HERE'),
    secretKey: configKeyHelper.Decrypt('ENCRYPTED_SECRETKEY_HERE', 'SECRET_HERE'),
};
