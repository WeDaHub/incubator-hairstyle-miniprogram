
// 获取某个数据集所有内容 (因 limit 有限制)
const MAX_LIMIT = 20; // 客户端限制 20 / 服务端限制 100
export async function getAll(collection, options) {
    const { where, orderBy, field } = options || {};
    // 先取出集合记录总数
    const countResult = await collection.count();
    const { total } = countResult;
    // 筛选、排序等
    let coll = collection;
    if (where) coll = coll.where(where);
    if (orderBy && orderBy.length === 2) coll = coll.orderBy(...orderBy);
    if (field) coll = coll.field(field);
    // 计算需分几次取
    const batchTimes = Math.ceil(total / MAX_LIMIT);
    // 承载所有读操作的 promise 的数组
    const tasks = Array.from({ length: batchTimes }, (e, i) =>
        coll.skip(i * MAX_LIMIT).limit(MAX_LIMIT).get());
    return (await Promise.all(tasks)).reduce((obj, e) => ({
        data: obj.data.concat(e.data),
        errMsg: obj.errMsg || e.errMsg,
    }), {
        data: [],
        errMsg: '',
    });
}

export default {
    getAll,
};
