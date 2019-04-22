// @flow
import React, {PureComponent} from 'react'
import {Provider} from 'react-redux'
import ReactDOM from 'react-dom'


import configureStore from './store'
import api from './api'


import App from './components/app'

// import styles from './component.scss'


const store = configureStore(history, api.schema(), api.client)

const app = (
  <Provider store={store}>
    <App />
  </Provider>
);

const root = document.getElementById('root');

ReactDOM.render(app, root);
