/* eslint-disable max-len, global-require, no-shadow, sonarjs/no-duplicate-string */
import {createStore, combineReducers} from 'redux'
import mockAxios from 'jest-mock-axios'
import {schema} from 'normalizr'
import {configure, selectors, actions, reducer, clearStore} from '../src/main'

const store = createStore(combineReducers({plate: reducer}))

const fur = new schema.Entity('fur')
const gerbil = new schema.Entity('gerbil', {fur})
configure(
  store,
  {
    gerbils: {
      GetAll: {
        url: '/gerbils',
        schema: {gerbils: [gerbil]},
      },
      GetArray: {
        url: '/gerbils',
        schema: {gerbils: [gerbil]},
        returns: ({gerbils} = {}) => gerbils,
      },
      getOne: {
        url: (id) => `/gerbils/${id}`,
        schema: gerbil,
        selects: (id) => id,
      },
      CreateOne: {
        url: '/gerbils_v2',
        method: 'POST',
        data: 'gerbilDescription',
        headers: {'X-Requested-With': 'Good app'},
      },
      setOne: {
        url: '/v7/gerbils',
        method: 'PUT',
        data: 3,
        schema: gerbil,
      },
      removeOne: {
        url: (id) => `/v7/gerbils/${id}`,
        method: 'DELETE',
        schema: gerbil,
      },
    },
    furs: {
      queryAll: {
        url: (q) => `/furs${q ? `?q=${q}` : ''}`,
        schema: {furs: [fur]},
      },
      getAuthed: {
        url: `/sum/ep`,
        preReq: (req) => ({
          ...req,
          headers: {Authorization: 'Bearer very-sikret-get-hasz'},
        }),
      },
      postAuthed: {
        url: `/sum/ep`,
        method: 'POST',
        preReq: (req) => ({
          ...req,
          headers: {Authorization: 'Bearer very-sikret-post-hasz'},
        }),
        data: () => 'sum data',
      },
      borked: {
        url: '???',
        // $FlowFixMe: testing invalid value
        data: false,
      },
      missing: {
        url: '---',
        // $FlowFixMe: testing invalid value
        method: 'run-forest-run',
      },
      schema: {},
    },
  },
  mockAxios
)

const mockGerbilsAllGet = {
  gerbils: [
    {id: '1', name: 'Jerry', fur: {id: '1', type: 'Fluffy'}},
    {id: '2', name: 'Terry', fur: {id: '1', color: 'White'}},
    {id: '3', name: 'Marry', fur: {id: '2', color: 'Orange'}},
    {id: '4', name: 'Jeshua'},
  ],
}

const mockGerbilOneGet1 = mockGerbilsAllGet.gerbils[0]
const mockGerbilOneGet2 = mockGerbilsAllGet.gerbils[1]

describe('Plate', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    store.dispatch(clearStore())
    mockAxios.reset()
  })

  it('fetches all', () => {
    let gerbils = selectors.gerbilsGetAll(store.getState())
    expect(gerbils).toBeUndefined()
    expect(setTimeout).toHaveBeenCalledTimes(1)
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 0)
    expect(mockAxios.get).toHaveBeenCalledTimes(0)
    jest.runAllTimers()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('/gerbils')
    mockAxios.mockResponse({data: mockGerbilsAllGet})
    gerbils = selectors.gerbilsGetAll(store.getState())
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(gerbils).toMatchSnapshot()
  })

  it('mangles return', () => {
    selectors.gerbilsGetArray(store.getState())
    jest.runAllTimers()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('/gerbils')
    mockAxios.mockResponse({data: mockGerbilsAllGet})
    const gerbils = selectors.gerbilsGetArray(store.getState())
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(gerbils).toMatchSnapshot()
  })

  it('fetches one', () => {
    let gerbil = selectors.gerbilsGetOne(store.getState(), '1')
    jest.runAllTimers()
    expect(gerbil).toBeUndefined()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('/gerbils/1')
    mockAxios.mockResponse({data: mockGerbilOneGet1})
    gerbil = selectors.gerbilsGetOne(store.getState(), '1')
    jest.runAllTimers()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(gerbil).toEqual(mockGerbilOneGet1)
    gerbil = selectors.gerbilsGetOne(store.getState(), '2')
    jest.runAllTimers()
    expect(gerbil).toBeUndefined()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(mockAxios.get).toHaveBeenCalledWith('/gerbils/2')
    mockAxios.mockResponse({data: mockGerbilOneGet2})
    gerbil = selectors.gerbilsGetOne(store.getState(), '2')
    jest.runAllTimers()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(gerbil).toMatchSnapshot()
  })

  it('gets one from all', () => {
    const gerbils = selectors.gerbilsGetAll(store.getState())
    jest.runAllTimers()
    expect(gerbils).toBeUndefined()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('/gerbils')
    mockAxios.mockResponse({data: mockGerbilsAllGet})
    const gerbil = selectors.gerbilsGetOne(store.getState(), '2')
    jest.runAllTimers()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(gerbil).toMatchSnapshot()
  })

  it('queries all', () => {
    let furs = selectors.fursQueryAll(store.getState(), 'preeeeetyyy')
    furs = selectors.fursQueryAll(store.getState(), 'preeeeetyyy')
    furs = selectors.fursQueryAll(store.getState(), 'preeeeetyyy')
    furs = selectors.fursQueryAll(store.getState(), 'preeeeetyyy')
    jest.runAllTimers()
    expect(furs).toBeUndefined()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(mockAxios.get).toHaveBeenCalledWith('/furs?q=preeeeetyyy')
    actions.fursQueryAll('lame')
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(mockAxios.get).toHaveBeenCalledWith('/furs?q=lame')
  })

  it('queries many', () => {
    let furs1 = selectors.fursQueryAll(store.getState(), 'q1')
    const req1 = mockAxios.lastReqGet()
    let furs2 = selectors.fursQueryAll(store.getState(), 'q2')
    const req2 = mockAxios.lastReqGet()
    jest.runAllTimers()
    expect(furs1).toBeUndefined()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(mockAxios.get).toHaveBeenCalledWith('/furs?q=q1')
    expect(mockAxios.get).toHaveBeenCalledWith('/furs?q=q2')

    const furs = mockGerbilsAllGet.gerbils
      .map((gerbil) => gerbil.fur)
      .filter((fur) => fur)
    mockAxios.mockResponse({data: {furs}}, req1)
    furs1 = selectors.fursQueryAll(store.getState(), 'q1')
    furs2 = selectors.fursQueryAll(store.getState(), 'q2')
    jest.runAllTimers()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(furs1).toMatchSnapshot()
    expect(furs2).toBeUndefined()

    mockAxios.mockResponse({data: {furs: [furs[furs.length - 1]]}}, req2)
    const furs12 = selectors.fursQueryAll(store.getState(), 'q1')
    furs2 = selectors.fursQueryAll(store.getState(), 'q2')
    jest.runAllTimers()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(furs12).toEqual(furs1)
    expect(furs2).toMatchSnapshot()

    const furs13 = selectors.fursQueryAll(store.getState(), 'q1')
    const furs23 = selectors.fursQueryAll(store.getState(), 'q2')
    jest.runAllTimers()
    expect(mockAxios.get).toHaveBeenCalledTimes(2)
    expect(furs13).toEqual(furs1)
    expect(furs23).toEqual(furs2)
  })

  it('creates one', () => {
    expect.assertions(3)
    const create = actions.gerbilsCreateOne({gerbilDescription: 'funny one'})
    expect(mockAxios.post).toHaveBeenCalledTimes(1)
    expect(mockAxios.post).toHaveBeenCalledWith('/gerbils_v2', 'funny one', {
      headers: {'X-Requested-With': 'Good app'},
    })
    mockAxios.mockResponse('OK')
    expect(create).resolves.toEqual({})
  })

  it('sets one', () => {
    expect.assertions(3)
    const create = actions.gerbilsSetOne('one', 'dos', 'trzy', 'blorg')
    expect(mockAxios.put).toHaveBeenCalledTimes(1)
    expect(mockAxios.put).toHaveBeenCalledWith('/v7/gerbils', 'blorg')
    mockAxios.mockResponse({data: mockGerbilOneGet1})
    expect(create).resolves.toEqual('1')
  })

  it('removes one', () => {
    expect.assertions(3)
    const create = actions.gerbilsRemoveOne('one')
    expect(mockAxios.delete).toHaveBeenCalledTimes(1)
    expect(mockAxios.delete).toHaveBeenCalledWith('/v7/gerbils/one')
    mockAxios.mockResponse({data: mockGerbilOneGet1})
    expect(create).resolves.toEqual('1')
  })

  it('manages statuses', () => {
    let status = selectors.gerbilsGetAll_Status(store.getState())
    let statusIsProcessing = selectors.gerbilsGetAll_Status.isProcessing(
      store.getState()
    )
    let statusIsSuccess = selectors.gerbilsGetAll_Status.isSuccess(
      store.getState()
    )
    let statusIsError = selectors.gerbilsGetAll_Status.isError(store.getState())
    expect(status).toBeUndefined()
    expect(statusIsProcessing).toEqual(false)
    expect(statusIsSuccess).toEqual(false)
    expect(statusIsError).toEqual(false)
    actions.gerbilsGetAll()
    status = selectors.gerbilsGetAll_Status(store.getState())
    statusIsProcessing = selectors.gerbilsGetAll_Status.isProcessing(
      store.getState()
    )
    statusIsSuccess = selectors.gerbilsGetAll_Status.isSuccess(store.getState())
    statusIsError = selectors.gerbilsGetAll_Status.isError(store.getState())
    expect(typeof status).toEqual('object')
    expect(status?.status).toBe('PROCESSING')
    expect(typeof status?.updatedAt).toEqual('number')
    expect(statusIsProcessing).toEqual(true)
    expect(statusIsSuccess).toEqual(false)
    expect(statusIsError).toEqual(false)
    mockAxios.mockResponse({data: mockGerbilsAllGet})
    status = selectors.gerbilsGetAll_Status(store.getState())
    statusIsProcessing = selectors.gerbilsGetAll_Status.isProcessing(
      store.getState()
    )
    statusIsSuccess = selectors.gerbilsGetAll_Status.isSuccess(store.getState())
    statusIsError = selectors.gerbilsGetAll_Status.isError(store.getState())
    expect(status?.status).toBe('SUCCESS')
    expect(statusIsProcessing).toEqual(false)
    expect(statusIsSuccess).toEqual(true)
    expect(statusIsError).toEqual(false)
  })

  it('fails selector parameters', () => {
    expect(() => selectors.gerbilsGetAll()).toThrow(
      /getResult\(state, source, args\) requires ReduxState as first argument/
    )
    expect(() => selectors.gerbilsGetAll_Status()).toThrow(
      /getStatus\(state, source, args\) requires ReduxState as first argument/
    )
  })

  it('fails action parameters', () => {
    expect(() => actions.gerbilsCreateOne()).toThrow(
      /gerbils\/CreateOne 'args\/data' type 'string' requires gerbilsCreateOne to be called with Object, but called with undefined/
    )
    expect(() => actions.gerbilsCreateOne({gerbils: ['One', 'Two']})).toThrow(
      /gerbils\/CreateOne 'args\/data' requires 'gerbilDescription' property on gerbilsCreateOne argument/
    )
    expect(() => actions.gerbilsSetOne()).toThrow(
      /gerbils\/setOne 'args\/data' type 'number' requires gerbilsSetOne to be called with at least 4 arguments/
    )
    expect(() => actions.fursBorked()).toThrow(
      /furs\/borked 'args\/data' type 'boolean' not supported/
    )
    expect(() => actions.fursMissing()).toThrow(
      /furs\/missing invalid method 'run-forest-run'/
    )
    jest.runAllTimers()
    expect(mockAxios.get).not.toHaveBeenCalled()
    expect(mockAxios.post).not.toHaveBeenCalled()
    expect(mockAxios.put).not.toHaveBeenCalled()
    expect(mockAxios.delete).not.toHaveBeenCalled()
  })

  it('fails request', () => {
    let gerbils = selectors.gerbilsGetAll(store.getState())
    expect(gerbils).toBeUndefined()
    jest.runAllTimers()
    mockAxios.mockError({message: 'Łolaboga!'})
    gerbils = selectors.gerbilsGetAll(store.getState())
    const status = selectors.gerbilsGetAll_Status(store.getState())
    const error = selectors.gerbilsGetAll_Status.isError(store.getState())
    jest.runAllTimers()
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
    expect(gerbils).toEqual({})
    expect(status).toHaveProperty('status', 'ERROR')
    expect(status).toHaveProperty('error', 'Łolaboga!')
    expect(error).toEqual(true)
  })

  it('passes non-object response', () => {
    const gerbils = actions.gerbilsGetAll()
    mockAxios.mockResponse({data: 'I can has string reply'})
    expect(gerbils).resolves.toEqual('I can has string reply')
  })

  it('handles preReq functions', () => {
    actions.fursGetAuthed()
    expect(mockAxios.get).toHaveBeenCalledWith('/sum/ep', {
      headers: {Authorization: 'Bearer very-sikret-get-hasz'},
    })
    expect(mockAxios.post).toHaveBeenCalledTimes(0)
    actions.fursPostAuthed()
    expect(mockAxios.post).toHaveBeenCalledWith('/sum/ep', 'sum data', {
      headers: {Authorization: 'Bearer very-sikret-post-hasz'},
    })
    expect(mockAxios.get).toHaveBeenCalledTimes(1)
  })
})
