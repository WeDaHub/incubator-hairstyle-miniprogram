/*
 * @Author: Calamus
 * @Descripttion:
 * @version:
 * @Date: 2020-06-23 17:29:50
 * @LastEditors: Calamus
 * @LastEditTime: 2020-07-27 15:23:11
 */
/* 人脸融合相关的 store */
import isEqual from 'lodash/isEqual';
import { getAll } from '../../shared/db';

const db = wx.cloud.database();

let instance = null;
class FusionStore {
    // 构造函数
    constructor() {
        // 单例
        if (instance) return instance;
        // 初始化
        instance = this;
        // 数据
        this.data = {
            // 模板素材人脸列表
            materialList: {
                // 单人模板
                // (数据结构与人脸融合官网文档 MaterialInfos 一致)
                // 格式为 [{ ProjectId, MaterialId, Url, MaterialFaceList: [{ FaceId, FaceInfo }] }]
                female: [],
                // 多人模板
                male: [],
            },
            // 已上传的人脸列表
            // (数据结构与人脸融合官网文档 MergeInfo 类似)
            // 格式为 [{ Url, InputImageFaceRect: {} }]
            faceList: [],
            // 最近几次有操作记录的人脸列表，第一位为最新的在 faceList 中的index人脸
            recordFaceIndex: [],
            // 模板人脸与上传人脸对应的关系（默认将按照人脸顺序进行对应）
            // 格式为 { MaterialId: { TemplateFaceID: faceIndex } }
            faceMapping: {},
            // 融合结果列表
            // 格式为 [{ MaterialId, MergeInfos, FusedImage }]
            resultList: [],
        };
    }

    // 清空实例
    static clear() {
        instance = null;
    }

    /* 方法 */
    // 请求获取模板列表
    async getMaterialList() {
        wx.showLoading({
            title: '加载中',
        });
        // 查询数据库拉取数据
        try {
            const { data: hairstyleData } = await getAll(db.collection('hairstyle'), {
                where: { enable: true },
                orderBy: ['sort', 'asc'],
            });
            console.log('dasd', hairstyleData);
            // 构造数据为 { female: [], male: [] }
            const { materialList } = this.data;
            materialList.female = hairstyleData.filter(e => e.gender === 'female');
            materialList.male = hairstyleData.filter(e => e.gender === 'male');
           
            wx.hideLoading();
        } catch (err) {
            err.module = 'facefusion';
            err.title = '获取融合模板失败';
            console.log(err);
        }
    }

    // 切换模板素材，传入id，设置当前模板的信息
    switchMaterial(id) {
        const { female = [], male = [] } = this.data.materialList;
        // 判断是否为单人模板
        let currentMaterial = female.find(e => e.MaterialId === id);
        let type;
        if (currentMaterial) {
            type = 'female';
        } else {
            // 判断是否为多人模板
            currentMaterial = male.find(e => e.MaterialId === id);
            if (currentMaterial) type = 'male';
        }
        if (type) {
            this.data.currentMaterial = {
                ...currentMaterial,
                type,
            };
        }
    }

    // 设置人脸映射关系
    setFaceMapping(MaterialId, TemplateFaceID, faceIndex) {
        let faceMapping = this.data.faceMapping[MaterialId];
        if (!faceMapping) faceMapping = {};
        // 设置映射关系
        faceMapping[TemplateFaceID] = faceIndex;
        this.data.faceMapping[MaterialId] = faceMapping;
    }

    removeFaceMapping(MaterialId, TemplateFaceID) {
        let faceMapping = this.data.faceMapping[MaterialId];
        if (!faceMapping) faceMapping = {};
        // （再次点击为删除）如果已有该映射关系，则删除掉
        delete faceMapping[TemplateFaceID];
        this.data.faceMapping[MaterialId] = faceMapping;
    }

    // 记录该人脸，将人脸faceIndex记录为最新
    setRecordFaceIndex(faceIndex) {
        if (faceIndex < 0) return;
        const recordFaceIndex = this.data.recordFaceIndex || [];
        const index = recordFaceIndex.indexOf(faceIndex);
        if (index !== -1) recordFaceIndex.splice(index, 1);
        recordFaceIndex.unshift(faceIndex);
        this.data.recordFaceIndex = recordFaceIndex;
    }

    // 添加融合结果列表addResultList
    addResultList(MaterialId, MergeInfos, result) {
        if (!result.FusedImage) return;
        const index = this.data.resultList.findIndex(e => e.MaterialId === MaterialId
            && isEqual(e.MergeInfos, MergeInfos));
        if (index !== -1) this.data.resultList.splice(index, 1);
        this.data.resultList.push({
            MaterialId,
            MergeInfos,
            FusedImage: result.FusedImage,
        });
    }
}

export default FusionStore;
