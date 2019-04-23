// @flow
import React, {PureComponent} from 'react'
import {Provider} from 'react-redux'
import ReactDOM from 'react-dom'


import configureStore from './store'
import api from './api'


import App from './components/app'

import 'uikit/dist/css/uikit.min.css'
import 'uikit/dist/js/uikit-icons.min.js'
import './index.css'

const USER_ID = 1;

const store = configureStore(api.schema(), api.client)

const app = (
  <Provider store={store}>
    <App userId={USER_ID}/>
  </Provider>
);

const root = document.getElementById('root');

if(root) {
  ReactDOM.render(app, root);
}

