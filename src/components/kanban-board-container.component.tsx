import React from 'react';

import { KanbanContextProvider } from './kanban-context.provider';
import { KanbanBoardProps } from './kanban-board.component';
import KanbanBoard from './kanban-board.component';

class KanbanBoardContainer extends React.Component<KanbanBoardProps> {
  render() {
    return (
      <KanbanContextProvider>
        <KanbanBoard {...this.props} />
      </KanbanContextProvider>
    );
  }
}

export default KanbanBoardContainer;
