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