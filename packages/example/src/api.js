// @flow
/* eslint-disable no-underscore-dangle */

import {schema} from 'normalizr'
import {stringify} from 'qs'
import axios from 'axios'

const timeout = 10000
const client = axios.create({
  timeout,
})

const API_URL = ''
/* ************************************************************************** */

export const asset = new schema.Entity('asset', {}) // IAR asset


const APISchema = () => ({
  assets: {
    GetAll: {
      url: (query: AssetQuery) =>
        `${API_URL}/assets?${stringify({
          q: query,
        })}`,
      schema: {assets: [asset]},
      returns: ({assets}: {assets: Array<{}>} = {}) => assets,
      // preReq: token,
    },
    GetOne: {
      url: (id: string) =>
        `${API_URL}/assets/${id}`,
      schema: {asset},
      selects: (id: *) => id,
      returns: (result: {asset: Asset} = {}) => result.asset,
      // preReq: token,
    },
    CreateOne: {
      url: `${API_URL}/assets`,
      method: 'POST',
      data: 0,
      schema: {asset},
      // preReq: token,
    },
  }
})

export default {
  client,
  schema: APISchema,
}
