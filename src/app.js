import { h, Component } from 'preact';
import { Router } from 'preact-router';

import Home from './routes/home';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducers from './reducers';

if (module.hot) {
  require('preact/debug');
}

export default class App extends Component {
  /** Gets fired when the route changes.
   *	@param {Object} event		"change" event from [preact-router](http://git.io/preact-router)
   *	@param {string} event.url	The newly routed URL
   */
  handleRoute = e => {
    this.currentUrl = e.url;
  };

  render() {
    let store = createStore(reducers, applyMiddleware(thunk));

    // switch to hash history for routing on github
    const createHashHistory =
      typeof window !== 'undefined' && process.env.PUBLISH_ENV === 'github'
        ? require('history/createHashHistory').default
        : () => null;

    return (
      <Provider store={store}>
        <div id="app">
          <Router history={createHashHistory()} onChange={this.handleRoute}>
            <Home path="/:id?/:term?/:mode?" />
          </Router>
        </div>
      </Provider>
    );
  }
}
