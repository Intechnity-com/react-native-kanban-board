import React, { Component } from 'react';
import KanbanBoardContainer, { KanbanBoardContainerExternalProps } from './kanban-board-container.component';

export class KanbanBoard extends Component<KanbanBoardContainerExternalProps> {
  render() {
    return (
      <KanbanBoardContainer {...this.props} />
    );
  }
}
