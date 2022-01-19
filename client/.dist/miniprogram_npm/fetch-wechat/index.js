"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEXT_FILE_EXTS = /\.(txt|json|html|txt|csv)/;
function parseResponse(url, res) {
    var header = res.header || {};
    header = Object.keys(header).reduce(function (map, key) {
        map[key.toLowerCase()] = header[key];
        return map;
    }, {});
    return {
        ok: ((res.statusCode / 200) | 0) === 1,
        status: res.statusCode,
        statusText: res.statusCode,
        url: url,
        clone: function () { return parseResponse(url, res); },
        text: function () {
            return Promise.resolve(typeof res.data === 'string' ? res.data : JSON.stringify(res.data));
        },
        json: function () {
            if (typeof res.data === 'object')
                return Promise.resolve(res.data);
            var json = {};
            try {
                json = JSON.parse(res.data);
            }
            catch (err) {
                console.error(err);
            }
            return Promise.resolve(json);
        },
        arrayBuffer: function () {
            return Promise.resolve(res.data);
        },
        headers: {
            keys: function () { return Object.keys(header); },
            entries: function () {
                var all = [];
                for (var key in header) {
                    if (header.hasOwnProperty(key)) {
                        all.push([key, header[key]]);
                    }
                }
                return all;
            },
            get: function (n) { return header[n.toLowerCase()]; },
            has: function (n) { return n.toLowerCase() in header; }
        }
    };
}
exports.parseResponse = parseResponse;
function fetchFunc() {
    // tslint:disable-next-line:no-any
    return function (url, options) {
        options = options || {};
        var dataType = url.match(exports.TEXT_FILE_EXTS) ? 'text' : 'arraybuffer';
        return new Promise(function (resolve, reject) {
            wx.request({
                url: url,
                method: options.method || 'GET',
                data: options.body,
                header: options.headers,
                dataType: dataType,
                responseType: dataType,
                success: function (resp) { return resolve(parseResponse(url, resp)); },
                fail: function (err) { return reject(err); }
            });
        });
    };
}
exports.fetchFunc = fetchFunc;
function setWechatFetch(debug) {
    if (debug === void 0) { debug = false; }
    // tslint:disable-next-line:no-any
    var typedGlobal = global;
    if (typeof typedGlobal.fetch !== 'function') {
        if (debug) {
            console.log('setup global fetch...');
        }
        typedGlobal.fetch = fetchFunc();
    }
}
exports.setWechatFetch = setWechatFetch;
//# sourceMappingURL=index.js.map