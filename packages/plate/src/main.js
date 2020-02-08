// @flow
import {
  normalize,
  denormalize,
  type Schema as NormalizrSchema
} from 'normalizr'
import Immutable from 'seamless-immutable'
import type { AxiosPromise, AxiosXHRConfig } from 'axios'
import type { Store } from 'redux'
import _each from 'lodash/each'
import _camelCase from 'lodash/camelCase'
import _upperFirst from 'lodash/upperFirst'
import _mapValues from 'lodash/mapValues'
import {
  addEntities,
  getEntities,
  addResult,
  getResult,
  setStatus,
  getStatus
} from './redux'

import type { ReduxState } from './redux'

export { reducer, clearStore } from './redux'

export type MethodDescription = {
  url: string | ((...Array<any>) => string),
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: string | number | ((*) => *),
  headers?: { [string]: mixed },
  schema?: NormalizrSchema,
  selects?: (*) => *,
  returns?: (*) => *,
  preReq?: (req: AxiosXHRConfig<*>) => AxiosXHRConfig<*>
}

export type EntityName = string
export type EntityDescription = {
  [EntityName]: MethodDescription,
  schema?: NormalizrSchema
}

export type PlateStateSelector = (ReduxState, ...Array<mixed>) => boolean
export type PlateSelector = {
  (ReduxState, ...Array<mixed>): mixed,
  isProcessing: PlateStateSelector,
  isSuccess: PlateStateSelector,
  isError: PlateStateSelector
}
export const selectors: { [string]: PlateSelector } = {}
export type PlateAction = (...Array<mixed>) => Promise<mixed>
export const actions: { [string]: PlateAction } = {}

export type PlateSchema = {
  [entity: string]: {
    [endPoint: string]: MethodDescription,
    schema?: NormalizrSchema
  }
}

const noop = () => {}

export function configure (
  store: Store<*, *, *>,
  schema: PlateSchema,
  api: { [string]: (string, {}) => AxiosPromise<*> }
) {
  /*
   * This double for-each iterates over schema mapping
   * EntityDescription + MethodDescription to an action + selector
   * of the form `entityNameMethodName(args)` which are exported from this module.
   */
  _each(
    schema,
    (entityDescription: EntityDescription, entityName: EntityName) => {
      _each(
        entityDescription,
        (methodDescription: MethodDescription, methodName: string) => {
          /* skip common schema */
          if (methodName === 'schema') return

          const selectorPrefix = `${_camelCase(entityName)}${_upperFirst(
            _camelCase(methodName)
          )}`
          const methodSchema: NormalizrSchema =
            methodDescription.schema || entityDescription.schema || {}

          /* Maps `args` from MethodDescription */
          function mapArgsDescription (name, prop, args: Array<mixed>) {
            switch (typeof prop) {
              /* No parameter needed. */
              case 'undefined':
                break
              /* If `prop` is a function, just use it to map call arguments to actual value. */
              case 'function':
                return prop(...args)
              /* If `prop` is a string, this means prop is given as a property of
                  a first `args` argument, like: `entityMethod({prop: value})` */
              case 'string':
                if (args[0] && typeof args[0] === 'object') {
                  const [params] = args
                  if (Object.prototype.hasOwnProperty.call(params, prop)) {
                    return params[prop]
                  }
                  throw new TypeError(
                    `${entityName}/${methodName} 'args/${name}' requires '${prop}' property on ${selectorPrefix} argument.`
                  )
                } else {
                  throw new TypeError(
                    `${entityName}/${methodName} 'args/${name}' type 'string' requires ${selectorPrefix} ` +
                      `to be called with Object, but called with ${typeof args[0]}.`
                  )
                }
              /* If `data` is a number, this means data is given as an argument to call,
                  like: `entityMethod(entityId, requestData)` */
              case 'number':
                if (typeof args[prop] !== 'undefined') {
                  return args[prop]
                }
                throw new TypeError(
                  `${entityName}/${methodName} 'args/${name}' type 'number' requires ${selectorPrefix} ` +
                    `to be called with at least ${prop + 1} arguments.`
                )
              default:
                throw new TypeError(
                  `${entityName}/${methodName} 'args/${name}' type '${typeof prop}' not supported.`
                )
            }
            return undefined
          }

          /* Create a function used to do actual Axios request when needed */
          const fetchFunction = (...args) => {
            let {
              url,
              method = 'GET', // eslint-disable-line prefer-const
              headers = {}, // eslint-disable-line prefer-const
              data,
              preReq // eslint-disable-line prefer-const
            } = methodDescription

            /* If `url` is a function use it to map args to a real URL, if not, take url as is. */
            if (typeof url === 'function') {
              url = url(...args)
            }

            /* Axios request data */
            data = mapArgsDescription('data', data, args)

            store.dispatch(setStatus(selectorPrefix, args, 'PROCESSING'))

            /* Finally do an actual Axios call, mapping the response */
            const axiosMethod = method.toLowerCase()
            if (typeof api[axiosMethod] === 'function') {
              let axiosArgs: any = []
              switch (axiosMethod) {
                case 'post':
                case 'put':
                case 'patch':
                  axiosArgs = [data]
                  break
                default:
                // no data to post
              }
              let config = {}
              if (Object.keys(headers).length > 0) {
                config.headers = headers
              }
              if (typeof preReq === 'function') {
                config = preReq(config)
              }
              if (Object.keys(config).length > 0) {
                axiosArgs.push(config)
              }

              return api[axiosMethod](url, ...axiosArgs).then(
                ({ data: responseData }: { data: mixed }) => {
                  if (responseData && typeof responseData === 'object') {
                    const normalized = normalize(responseData, methodSchema)
                    store.dispatch(
                      addEntities(selectorPrefix, normalized.entities)
                    )
                    store.dispatch(
                      addResult(selectorPrefix, args, normalized.result)
                    )
                    store.dispatch(setStatus(selectorPrefix, args, 'SUCCESS'))
                    return normalized.result
                  }
                  // cannot denormalize non-object type - pass on
                  return responseData
                },
                error => {
                  store.dispatch(addResult(selectorPrefix, args, null))
                  store.dispatch(
                    setStatus(
                      selectorPrefix,
                      args,
                      'ERROR',
                      error.response?.data || error.message
                    )
                  )
                  return Promise.reject(error)
                }
              )
            }
            throw new TypeError(
              `${entityName}/${methodName} invalid method '${method}'.`
            )
          }

          /* Export generated fetchFunction(args) as explicit action
           * and wrapped in value selector calling fetchFunction as needed */
          actions[selectorPrefix] = fetchFunction
          selectors[selectorPrefix] = (state: ReduxState, ...args) => {
            const { selects: selector, returns: mangle } = methodDescription

            let result = getResult(state, selectorPrefix, args)

            if (
              typeof result === 'undefined' &&
              getStatus(state, selectorPrefix, args)?.status !== 'PROCESSING'
            ) {
              /* fetch in next tick to prevent state update loops */
              setTimeout(() => {
                if (
                  getStatus(store.getState(), selectorPrefix, args)?.status !==
                  'PROCESSING'
                ) {
                  /* selectors are to be silent */
                  fetchFunction(...args).then(noop, noop)
                }
              }, 0)
            }

            /* support selecting One from queryAll results */
            if (!result && selector) {
              result = selector(...args)
            }

            const entities = getEntities(state)
            const ret = denormalize(result, methodSchema, entities)

            return mangle ? mangle(ret) : ret
          }
          /* Additional selector to get the request status */
          const selectorPrefixStatus = `${selectorPrefix}_Status`
          selectors[selectorPrefixStatus] = (state: ReduxState, ...args) =>
            getStatus(state, selectorPrefix, args)
          selectors[selectorPrefixStatus].isProcessing = (
            state: ReduxState,
            ...args
          ) => getStatus(state, selectorPrefix, args)?.status === 'PROCESSING'
          selectors[selectorPrefixStatus].isSuccess = (
            state: ReduxState,
            ...args
          ) => getStatus(state, selectorPrefix, args)?.status === 'SUCCESS'
          selectors[selectorPrefixStatus].isError = (
            state: ReduxState,
            ...args
          ) => getStatus(state, selectorPrefix, args)?.status === 'ERROR'
        }
      )
    }
  )

  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development') {
    const bindState = f => (...args) => f(store.getState(), ...args)
    const bindObject = v => {
      if (typeof v === 'object') return _mapValues(v, bindObject)
      if (typeof v === 'function') {
        const bound = bindState(v)
        _each(_mapValues(v, bindObject), (s, k) => {
          bound[k] = s
        })
        return bound
      }
      return v
    }
    window.plate = { actions, selectors: _mapValues(selectors, bindObject) }
  }
}
