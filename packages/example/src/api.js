// @flow
/* eslint-disable no-underscore-dangle */

import {schema} from 'normalizr'
import {stringify} from 'qs'
import axios from 'axios'

const timeout = 10000
const client = axios.create({
  timeout,
})

const API_URL = 'https://jsonplaceholder.typicode.com'
/* ************************************************************************** */

export const task = new schema.Entity('task', {})


const APISchema = () => ({
  tasks: {
    GetAll: {
      url: (userId: string) =>
        `${API_URL}/todos?${stringify({
          userId,
        })}`,
      schema: [task],
      returns: (tasks: Array<Task>) => tasks
    },
    GetOne: {
      url: (id: string) =>
        `${API_URL}/todos/${id}`,
      schema: {task},
      selects: (id: *) => id,
      returns: (task: Task = {}) => task,
    },
    CreateOne: {
      url: `${API_URL}/todos`,
      method: 'POST',
      data: 0,
      schema: {task},
    },
    UpdateOne: {
      url: (id: string) =>
      `${API_URL}/todos/${id}`,
      method: 'PUT',
      data: 1,
      schema: {task},
    },
    DeleteOne: {
      url: (id: string) =>
      `${API_URL}/todos/${id}`,
      method: 'DELETE',
      schema: {task},
    },
  }
})

export default {
  client,
  schema: APISchema,
}
