import Delivery from './Delivery.svelte';
import { bootstrap } from '../../shared/bridge.js';
import '../../shared/style.css';
bootstrap();
new Delivery({ target: document.getElementById('app') });
