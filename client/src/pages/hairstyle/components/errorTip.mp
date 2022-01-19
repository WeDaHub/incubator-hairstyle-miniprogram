/*
  全局顶部错误提示组件, 有渐入渐隐效果
 */
<config lang="js">
module.exports = {
  "component": true,
  "usingComponents": {}
}
</config>
<template>
<view class="tips {{ _store.error ? 'show' : ''}}">
  <view class="text">{{ _store.error }}</view>
</view>
</template>

<script>
  import mp from 'mp-helper';

  mp.Component({
    options: {
      addGlobalClass: true,
    },
    properties: {
    },
    data: {
    },
    methods: {
      // onLoad() {
      // },
    },
    observers: {
      '_store.error': function(error) {
        if (!error) return;
        // 一段时间后重置错误信息
        setTimeout(() => {
          this.$setStore({
            error: ''
          });
        }, 2000);
      }
    }
  });
</script>
<style lang="less">
.tips {
  position: absolute;
  z-index: 11;
  left: 0;
  right: 0;
  top: -100rpx;
  height: 100rpx;
  line-height: 100rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
  background-color: #FFE3E1;
  transition: all 0.4s;
  opacity: 0;
}
.tips.show {
  top: 0;
  opacity: 1;
}
.tips::before,
.tips .text {
  display: inline-block;
  vertical-align: middle;
}
.tips .text {
  color: #A8002D;
  font-size: 28rpx;
}
.tips::before {
  content: '';
  width: 40rpx;
  height: 40rpx;
  margin-right: 20rpx;
  background-image: url('https://imgcache.qq.com/open_proj/proj_qcloud_v2/rocket_images/1598436870617_d4k1yih5rpiew2ke29.svg');
  background-size: 100% 100%;
}
</style>
