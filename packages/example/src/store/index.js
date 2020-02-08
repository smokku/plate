// @flow
/* eslint-disable no-underscore-dangle */
import { createStore, combineReducers, applyMiddleware, compose, type Dispatch } from 'redux'
import thunk from 'redux-thunk'
import type { AxiosPromise } from 'axios'
import {
  configure,
  reducer as plateReducer,
  clearStore as clearPlate,
  type PlateSchema,
  type ReduxState,
  type ReduxAction
} from '@smokku/plate'

export {selectors, actions} from '@smokku/plate'

let store

export default function create(
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
