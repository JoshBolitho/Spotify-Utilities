import { createApp } from 'vue';
import { createStore } from 'vuex';
import App from './App.vue';
import router from './router';

const store = createStore({
    state () {
        return {
            dataToPass: null
        }
    },
    mutations: {
        setDataToPass (state, data) {
            state.dataToPass = data;
        }
    }
  })

createApp(App).use(router).use(store).mount('#app');
