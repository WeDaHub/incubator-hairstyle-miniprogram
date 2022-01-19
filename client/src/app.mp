<config lang="js">
module.exports = {
  "pages": [
    "pages/hairstyle/index",
    "pages/hairstyle/preview"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "WeChat",
    "navigationBarTextStyle": "black"
  },
  "plugins": {
    "tfjsPlugin": {
      "version": "0.2.0",
      "provider": "wx6afed118d9e81df9"
    }
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
</config>

<script>
import mp from 'mp-helper';
import logger from './shared/logger';

wx.cloud.init({
    env: 'env-test-1gpwfmyhe6c3ec23',
    traceUser: true,
});
//app.js
mp.App({
    onLaunch: function () {
        
    },
    logger,
    // 获取权限
    getScopeAuth(scope, success, fail) {
        if (!scope) return;
        const scopeMap = {
            'scope.userInfo': '用户信息',
            'scope.record': '录音',
            'scope.writePhotosAlbum': '相册',
            'scope.camera': '摄像头',
        };
        wx.getSetting({
            success(res) {
                if (!res.authSetting[scope]) {
                    wx.authorize({
                        scope,
                        success() {
                            // 成功获取
                            success && success();
                        },
                        fail() {
                            // 弹窗提醒
                            wx.showModal({
                                title: `获取${scopeMap[scope] || ''}权限失败`,
                                content: '是否前往进行设置',
                                confirmText: '前往设置',
                                confirmColor: '#006eff',
                                success(res) {
                                    if (res.confirm) {
                                        // 前往设置
                                        wx.openSetting();
                                    } else {
                                        fail && fail();
                                    }
                                },
                                fail,
                            });
                        },
                    })
                } else { success && success(); } // 之前已经获取
            },
            fail,
        });
    },
})
</script>

<style>
page {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    font-size: 32rpx;
    position: relative;
}
.container {
    flex: 1;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    padding-bottom: 118rpx;
}
.content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
}
</style>