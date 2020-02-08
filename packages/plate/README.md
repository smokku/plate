# API-Plate

This is a generic proxy layer to access REST API endpoints via Redux selectors and action creators.

[![CircleCI](https://img.shields.io/circleci/project/github/smokku/plate/master.svg)](https://circleci.com/gh/smokku/plate)

You define schema describing API endpoints, and Plate generates and exports `selectors` and `actions` objects
to use in Redux `connect()` and `dispatch()`.

Plate uses [normalizr][1] library under the hood, to keep API objects in normalized (deduplicated) format.

[1]: https://github.com/paularmstrong/normalizr

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
import {selectors, actions} from 'plate'

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
