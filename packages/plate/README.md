# API-Plate

This is a generic proxy layer to access REST API endpoints via Redux selectors and action creators.

[![CircleCI](https://img.shields.io/circleci/project/github/smokku/plate/master.svg)](https://circleci.com/gh/smokku/plate)

You define a simple schema object describing API endpoints, and Plate generates `selector` functions for use in Redux `connect()` calls.

Then, the magic happens:

1. First time the API endpoint selector is called, Plate finds out that it does not have data loaded - so it triggers the API call and simply returns nothing from the selector.
2. Then when the API call response arrives it is saved to Redux store.
3. Updating the Redux store triggers connect()ed components to re-render.
4. Selector is called again, but this time data _is_ in the Redux store, so the selector returns it.
5. Component displays data loaded from API (its cache in Redux store).

Plate uses [normalizr][1] library under the hood, to keep API objects in normalized (deduplicated) format. This gives Plate another "magical" feature:

- If one of the API calls updates an entity, all selectors refering to the entity get the update.

This means for example, that if you are displaying a table of Users, and you updateOne user, the table data gets updated automatically.

Selectors are parametrized, so you can give IDs and options to the API calls. API calls are cached by the full selector call signature. So `selectors.usersGetAll()` selector triggers API call only once, but `usersGetOne('userid-1')` and `usersGetOne('userid-2')` will trigger separate calls (also just once each).

How can you force an update of a data loaded in store? (When you have some external knowledge that data needs update.) Plate generates two objects actually:

- `selectors` object having all the selectors generated from API schema;
- `actions` object, which mirrors the selectors structure, but gives you functions triggering the API calls directly.

Actions are also used to do entity updates via POST/PUT/DELETE calls (i.e. `actions.usersUpdateOne('id1', {locked: false})`). Here's where another neat thing is integrated:

- If your update call returns updated entity data, it gets integrated into Redux store the same way as in GET call.

This means that you don't have to load updated entity data manually.

_But what do you do while the first API call is in progress and selector returns nothing? Or the API call fails?_

Good question. See below documentation for status selectors, like `isProcessing` or `isError`, which you can use to display some message or a spinner in such case.

[1]: https://github.com/paularmstrong/normalizr

## Installation

1. Add package and dependencies to your project:

```sh
npm install --save @smokku/plate
npm install --save redux normalizr axios seamless-immutable
```

2. Add `plate` reducer to your Redux store:

```js
// store.js
// ...
import {reducer as plate} from '@smokku/plate'

// ...
  const reducers = combineReducers({
    // ...
    plate,
  })

//...
  store = createStore(reducers, middlewares)
```

3. Write API definition file:

```js
// api.js
import {schema} from 'normalizr'

export const task = new schema.Entity('task', {})

export default {
  tasks: {
    getAll: {
      schema: task,
      // ...
}
```

_For full description of the API Schema [see below](#schema)._

4. Create and configure [Axios](https://github.com/axios/axios#axios-api) client:

```js
// api.js
import axios from 'axios'

const timeout = 10000
const baseURL = 'https://your.api/v1',

export const client = axios.create({
  timeout,
  baseURL,
})

// ...
```

5. Configure `plate` during application startup:

```js
// main.js
import {configure} from '@smokku/plate'
import store from './store'
import schema, {client} from './api'

//...
configure(store, schema, client)
```

This will create all functions in `selectors` and `actions` exports.

6. Import `selectors` to your component file and use generated functions:

```js
// component.jsx
import {selectors} from '@smokku/plate'
// ...
@connect(state => ({
  tasks: selectors.tasksGetAll(state)
}))
export default TasksList extends Component {
// ...
```

## Schema

```
{
  entity: {
    endPoint: {
      url: String | Function,
      schema: normalizr.schema.Entity(),
      selects?: Function,
      returns?: Function,
    },
    endPoint2: ...
    [schema: // common schema]
  },
  entity2: ...
}
```

- entity: Defines API/normalizr entity object.
- url: URI path to API endpoint for entity.
- method (optional): HTTP method for request. (defaults to GET)
- data: POST/PUT body data description. `number` tells which action/selector argument to use (counted from 0). `string` gets data from named property of first argument. `function` just returns data to submit.
- schema: normalizr schema of API response.
- selects (optional): Allows to supplant generated result list to select items from already loaded entities, before getting actual API response result.
- returns (optional): Used to mangle denormalized output to some other selector value format.

## Selectors & Actions

Exported `selectors` functions are generated in the camelCased name like `entityNameEndPoint()`.
Action of the same name is generated in `selectors` export.

Generated functions accept any number of parameters, that are passed as-is to schema functions.
(Additionally selectors need to get Redux store state as first parameter.)

The selector submits action under the hood if the result is not already available.
On the other hand, if the selector already called an action, it will not call it again with the same parameters. If you want to reload data for the given selector parameters, you need to manually call the action of the same name. It will dispatch the API call and reload data in Redux store.

### Status selectors

There are additional selectors available, to get the status of specific endpoint request:

- `entityNameEndPoint_Status(state)`: 'PROCESSING' | 'SUCCESS' | 'ERROR'
- `entityNameEndPoint_Status.isProcessing(state)`: boolean
- `entityNameEndPoint_Status.isSuccess(state)`: boolean
- `entityNameEndPoint_Status.isError(state)`: boolean

## Example

schema.js:

```js
import {schema} from 'normalizr'

export const user = new schema.Entity('user', {})

export default {
  users: {
    GetAll: {
      url: '/users',
      schema: {users: [user]},
      returns: ({users} = {}) => users,
    },
    GetOne: {
      url: (id) => `/users/${id}`,
      schema: user,
      selects: (id) => id,
    },
    CreateOne: {
      url: '/users',
      method: 'POST',
      data: 0,
    },
  },
}
```

component.jsx:

```js
import {selectors, actions} from '@smokku/plate'

...

@connect(state => ({
  users: selectors.usersGetAll(state)
}))
export default User extends Component {
  componentDidMount() {
    actions.usersGetOne(this.props.id)
  }
  ...
```
