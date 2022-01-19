# 通用分发

其主要作用是根据请求调用方法

主入口为 `index.js`，其将根据传入的 `method` 去获取对应的方法名（`api/`）

整个云函数也将按照云API规范进行返回

**因此，接入通用请求仅需在`api/`中新增文件，命名为`[action].js`**


### 接入例子

有这样的一个云API

```
- 接口请求域名: ocr.tencentcloudapi.com
- Action: IDCardOCR
- Version: 2018-11-19
- ImageUrl: 图片的 Url 地址
- CardSide: 正反面
```

那么可新建文件 `api/ocr/BankCardOCR.js`：

```js
//  `fileUrl` 为传入的 `fileId` 云文件ID 在主入口转换时的临时HTTP路径
module.exports = (data, fileUrl) => {
    // 返回请求参数
    return {
        service: 'ocr',
        action: 'BankCardOCR',
        version: 'v20181119',
        // 请求数据
        data: {
            ImageUrl: fileUrl,
            ...data,
        },
    };
};
```

可在开发工具右键点击云函数 `本地调试` 进行调试与开发

最后完成开发上传整个云函数即可。

前端将可通过参数 `action` 设为 `ocr/IDCardOCR` 进行调用

```js
// 公共调用云函数方法，将会上报请求
import { callFunction } from 'path/to/shared/methods';
// 调用云函数
const { result } = await callFunction({
    name: 'CommonRequest',
    data: {
        action: this.data.action,
        data: { ... }, // 将作为第一个参数 data
        fileUrl: '...', // fileUrl: 文件 url (支持字符串或者数组) 在云函数中如果是云存储 fileID 则会进行转换
    },
});
```

其中 `fileUrl` 为文件网络地址，可传入字符串或数组，如果其中有 云存储 `fileID` 将会在云函数中转换为临时HTTP地址，并作为配置文件的第二个参数 `fileUrl` 传入


### 返回值

- 成功返回

```js

{
    Response: {
        ..., // 返回数据字段
    }
}
```

- 失败返回

```js
{
    Response: {
        Error: {
            Code: -1,
            Message: '', // 错误信息
        }
    }
}
```

