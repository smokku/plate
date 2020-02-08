// @flow
/* eslint-disable unicorn/new-for-builtins */
import Immutable, { type Immutable as ImmutableType } from 'seamless-immutable'
import type { EntityName } from './main'

export type ReduxEntities = ImmutableType<{[EntityName]: ReduxEntities}>
export type ReduxActionType = string
export type ReduxAction = {
  type: ReduxActionType,
  source: string,
  payload: any
}

export type RequestStatus = 'PROCESSING' | 'SUCCESS' | 'ERROR'
export type ReduxStatus = {
  status: RequestStatus,
  updatedAt: number,
  error?: string
}

export type ReduxInternalState = {
  entities: ReduxEntities,
  statuses: ImmutableType<{[string]: ReduxStatus}>,
  results: ImmutableType<{[string]: ImmutableType<{[string]: mixed}>}>
}
export type ReduxState = {
  plate: ReduxInternalState
}

export const CLEAR_STORE: ReduxActionType = '@@plate/clear-store'
export const clearStore = () => ({
  type: CLEAR_STORE,
  source: 'internal',
  payload: null
})

export const ADD_ENTITIES: ReduxActionType = '@@plate/add-entities'
export const addEntities = (source: string, entities: ReduxEntities) => ({
  type: ADD_ENTITIES,
  source,
  payload: entities
})
export const getEntities = (state: ReduxState): ReduxEntities =>
  state.plate.entities

const serialize = JSON.stringify
export const ADD_RESULT: ReduxActionType = '@@plate/add-result'
export const addResult = (source: string, args: Array<*>, result: mixed) => ({
  type: ADD_RESULT,
  source,
  payload: {
    args: serialize(args),
    result
  }
})
export const getResult = (
  state: ReduxState,
  source: string,
  args: Array<*>
) => {
  if (typeof state !== 'object' || !state.plate) {
    throw new TypeError(
      'getResult(state, source, args) requires ReduxState as first argument'
    )
  }
  // $FlowFixMe: Flow does not yet support method or property calls in optional chains.
  return state.plate.results[source]?.[serialize(args)]
}

export const SET_STATUS: ReduxActionType = '@@plate/set-status'
export const setStatus = (
  source: string,
  args: Array<mixed>,
  status: RequestStatus,
  error?: string
) => ({
  type: SET_STATUS,
  source,
  payload: {
    args: serialize(args),
    status,
    error
  }
})
export const getStatus = (
  state: ReduxState,
  source: string,
  args: Array<mixed>
): ?ReduxStatus => {
  if (typeof state !== 'object' || !state.plate) {
    throw new TypeError(
      'getStatus(state, source, args) requires ReduxState as first argument'
    )
  }
  // $FlowFixMe: Flow does not yet support method or property calls in optional chains.
  return state.plate.statuses[source]?.[serialize(args)]
}

export const initialState: ReduxInternalState = {
  entities: Immutable({}),
  statuses: Immutable({}),
  results: Immutable({})
}

export function reducer (
  state: ReduxInternalState = initialState,
  action: ReduxAction
): ReduxInternalState {
  switch (action.type) {
    case CLEAR_STORE:
      return initialState

    case ADD_ENTITIES:
      return {
        ...state,
        entities: state.entities.merge(action.payload, {
          deep: false,
          merger: (oldVal, newVal) => oldVal ? oldVal.merge(newVal, { deep: false }) : newVal
        })
      }

    case ADD_RESULT:
      return {
        ...state,
        results: state.results.merge(
          {
            [action.source]: {
              [action.payload.args]: action.payload.result
            }
          },
          { deep: true }
        )
      }

    case SET_STATUS:
      return {
        ...state,
        statuses: state.statuses.merge(
          {
            [action.source]: {
              [action.payload.args]: {
                status: action.payload.status,
                updatedAt: Date.now(),
                error: action.payload.error
              }
            }
          },
          { deep: true }
        )
      }

    default:
      return state
  }
}
