// @flow
/* eslint-disable no-underscore-dangle */
import {createStore, combineReducers, applyMiddleware, compose} from 'redux'
import thunk from 'redux-thunk'

import type {AxiosPromise} from 'axios'
import type {Dispatch} from 'redux'

import configure from '../../'
import type {PlateSchema} from '../../'
import {
  reducer as plateReducer,
  clearStore as clearPlate,
} from '../../redux'
import type {ReduxState, ReduxAction} from '../../redux'


export {selectors, actions} from '../../'

let store

export default function create(
  history: BrowserHistory,
  schema: PlateSchema,
  client: {[string]: (string, {}) => AxiosPromise<*>}
) {
  const reducers = combineReducers({
    plate: plateReducer,
  })

  const middleware = applyMiddleware(thunk)
  const composer =
    (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
      /* istanbul ignore next */
      window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({name: 'plate-example'})) ||
    compose
  store = createStore<
    ReduxState,
    ReduxAction,
    Dispatch<ReduxAction>
  >(reducers, composer(middleware))

  configure(store, schema, client)

  return store
}

export function getStore() {
  return store
}

export function clear() {
  store.dispatch(clearPlate())
}
