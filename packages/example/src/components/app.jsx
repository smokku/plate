import React from 'react'
import {connect} from 'react-redux'

import {selectors, actions} from '../store'
import TaskView from './task-view'

const mapStateToProps = (state, ownProps) => ({
  tasks: selectors.tasksGetAll(state, ownProps.userId),
  isLoading: selectors.tasksGetOne_Status.isProcessing(state),
})

type Props = {
  userId: string,
  tasks: Task[],
  isLoading: boolean,
}

class App extends React.Component<Props> {

  state = {
    title: ''
  }

  handleChange = (event) => {
    console.log(event.target.value)
    this.setState({title: event.target.value})
  }

  handleSubmit = (event) => {
    event.preventDefault()
    const {userId} = this.props;
    const {title} = this.state;
    actions.tasksCreateOne({title, userId, completed: false})
    .then(() => {
      actions.tasksGetAll(userId)
      this.setState({title: ''})
    })
  }


  render() {
    const {tasks, isLoading, userId} = this.props

    return (
      <div className="uk-container">
        <h1 className="uk-heading-medium">Todo List</h1>

        <p>Add new task</p>
        <form onSubmit={this.handleSubmit} className="uk-margin-medium-bottom">
          <input className="uk-input uk-form-width-medium uk-margin-medium-right" onChange={this.handleChange} value={this.state.title}></input>
          <button type="submit" className="uk-button uk-button-default">ADD</button>
        </form>

        <hr className="uk-divider-icon"></hr>

        {isLoading && <div uk-spinner />}
        {tasks && tasks.map((task) => <TaskView task={task} key={task.id} userId={userId} />) }
      </div>
    )
  }
}

export default connect(mapStateToProps)(App)
