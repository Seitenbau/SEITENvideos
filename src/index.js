import './style/index.scss';
import App from './app';

if (typeof window !== 'undefined') {
  require('smoothscroll-polyfill').polyfill();
}

export default App;
