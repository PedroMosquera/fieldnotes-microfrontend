import { createApp } from 'vue';
import Basket from './Basket.vue';
import { bootstrap, send } from '../../shared/bridge.js';
import '../../shared/style.css';
bootstrap();
const app = createApp(Basket);
app.config.errorHandler = error => send('error', { message: error.message });
app.mount('#app');
