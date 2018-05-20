import Vue from 'vue'
import App from './App.vue'
import VueWebsocket from "vue-websocket";

import store from './store';

Vue.use(VueWebsocket);
Vue.config.productionTip = false

const vm = new Vue({
  render: h => h(App),
  store 
}).$mount('#app')

export default vm;