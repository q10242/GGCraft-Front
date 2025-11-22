import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, vueQueryOptions } from './plugins/vue-query'
import { plugin as FormKitPlugin, defaultConfig } from '@formkit/vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, vueQueryOptions)
app.use(FormKitPlugin, defaultConfig())

app.mount('#app')
