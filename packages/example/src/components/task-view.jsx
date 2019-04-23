import React from 'react'
import {connect} from 'react-redux'
import {selectors, actions} from '../store'

const mapStateToProps = (state, ownProps) => ({
  isLoading: selectors.tasksUpdateOne_Status.isProcessing(state, ownProps.task.id),
})

type Props = {
  task: Task,
  userId: string,
}

class TaskView extends React.Component<Props> {
  handleChange = (event) => {
    actions.tasksUpdateOne(this.props.task.id, {completed: event.target.checked})
    .then(() => actions.tasksGetOne(this.props.task.id))
  }

  handleDelete = (event) => {
    actions.tasksDeleteOne(this.props.task.id)
    .then(() => actions.tasksGetAll(this.props.userId))
  }

  render() {
    const {task, isLoading} = this.props

    return (
      <div className=" uk-margin-small-bottom">
        {isLoading && <div uk-spinner />}
        <input className="uk-checkbox uk-margin-small-right" type="checkbox" checked={task.completed} onChange={this.handleChange}>
        </input>
        {task.title}

        <button className="uk-button uk-button-default uk-margin-small-left uk-button-small uk-button-danger" onClick={this.handleDelete}>DELETE</button>
      </div>
    )
  }
}

export default connect(mapStateToProps)(TaskView)
