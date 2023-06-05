import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import {
  GestureEvent,
  HandlerStateChangeEvent,
  LongPressGestureHandlerEventPayload,
  State as rnState
} from 'react-native-gesture-handler';

import { GET_CARD_WIDTH, GET_NO_OF_COLUMNS, MAX_DEG, MAX_RANGE } from '@ui/components/kanban-board/board-config';
import { BoardState } from '@ui/components/kanban-board/actions/reducers';
import { BoardManager } from '@ui/components/kanban-board/actions/board-manager';
import { loadBoardActionCreator, moveCardActionCreator, reloadBoardActionCreator } from '@ui/components/kanban-board/actions/actions';
import { BoardDispatch } from '@ui/components/kanban-board/actions/types';
import { CardModel } from '@domain/models/kanban-board-models/card-model';
import { ColumnModel } from '@domain/models/kanban-board-models/column-model';
import { deviceInfo } from 'src/config';
import { logError } from '@domain/services/log.service';
import ColumnsCarouselContainer from '@ui/components/columns-containers/columns-carousel-container.component';
import Card from './cards/card.component';
import Column from './columns/column.component';
import { dimensions } from '@ui/theme';
import ColumnsScrollContainer from '@ui/components/columns-containers/columns-scroll-container.component';

const mapStateToProps = (state: BoardState) => ({
  board: state
});

const mapDispatchToProps = (dispatch: BoardDispatch<AnyAction>) => ({
  loadBoard: (columns: ColumnModel[], cards: CardModel[]) => dispatch(loadBoardActionCreator(columns, cards)),
  reloadBoard: (columns?: ColumnModel[], cards?: CardModel[]) => dispatch(reloadBoardActionCreator(columns, cards)),
  moveCard: (draggedItem: CardModel, x: number, y: number, targetColumn: ColumnModel | undefined) => dispatch(moveCardActionCreator(draggedItem, x, y, targetColumn))
});

interface ReactTimeoutProps {
  setTimeout: (callback: (...args: any[]) => void, ms: number, ...args: any[]) => any;
  clearTimeout: (timer: any) => void;
  requestAnimationFrame: (callback: (...args: any[]) => void) => number;
}

export type KanbanBoardContainerExternalProps = {
  columns: ColumnModel[];
  cards: CardModel[];
  onDragEnd: (srcColumn: ColumnModel, destColumn: ColumnModel, item: CardModel, targetIdx: number) => void;
  onCardPress: (item: CardModel) => void;
  renderCardContent?(model: CardModel): JSX.Element | null;
}

export type KanbanBoardContainerProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  ReactTimeoutProps &
  KanbanBoardContainerExternalProps;

type State = {
  boardPositionY: number;
  rotate: Animated.Value;
  pan: Animated.ValueXY;
  startingX: number;
  startingY: number;
  movingMode: boolean;
  draggedItem: CardModel | undefined;
  srcColumnId: string | undefined;
  draggedItemWidth: number;
  draggedItemHeight: number;
}

class KanbanBoardContainer extends React.Component<KanbanBoardContainerProps, State> {
  isColumnScrolling: boolean;
  dragX: number = 0;
  dragY: number = 0;
  carouselContainer: ColumnsCarouselContainer<ColumnModel> | null;
  scrollContainer: ColumnsScrollContainer<ColumnModel> | null;
  columnListViewsMap: Map<string, any> = new Map<string, any>(); //any is here Column

  constructor(props) {
    super(props);

    this.state = {
      boardPositionY: 0,
      rotate: new Animated.Value(0),
      pan: new Animated.ValueXY(),
      startingX: 0,
      startingY: 0,
      movingMode: false,
      draggedItem: undefined,
      srcColumnId: undefined,
      draggedItemWidth: 0,
      draggedItemHeight: 0
    }

    this.isColumnScrolling = false;
    this.carouselContainer = null;
    this.scrollContainer = null;
  }

  componentDidMount() {
    this.props.loadBoard(this.props.columns, this.props.cards);
  }

  componentDidUpdate(prevProps: KanbanBoardContainerProps) {
    const { cards, reloadBoard } = this.props;
    if (prevProps.cards != cards) {
      reloadBoard(undefined, cards);
    }
  }

  loadBoardActionCreator(columns: ColumnModel[], cards: CardModel[]) {
    var columnsMap = new Map<string, ColumnModel>();
    var columnCardsMap = new Map<string, CardModel[]>();

    columns.forEach(value => {
      columnsMap.set(value.id, value);
    });

    cards.forEach(value => {
      if (!columnsMap.has(value.columnId)) {
        return;
      }

      if (!columnCardsMap.get(value.columnId)) {
        columnCardsMap.set(value.columnId, []);
      }
      columnCardsMap.get(value.columnId)!.push(value);
    });

    columns.forEach(column => {
      if (!columnCardsMap.get(column.id)) {
        columnCardsMap.set(column.id, []);
      }
    });

    this.setState({
      columnsMap: columnsMap,
      columnCardsMap: columnCardsMap
    });
  };

  reloadBoardActionCreator(columns?: ColumnModel[], cards?: CardModel[]) {

    var columnsMap = new Map<string, ColumnModel>(this.state.columnsMap);
    var columnCardsMap = new Map<string, CardModel[]>(this.state.columnCardsMap);

    if (columns) {
      columnsMap = new Map<string, ColumnModel>();
      columns.forEach(value => {
        columnsMap.set(value.id, value);
      });
    }

    if (cards) {
      columnCardsMap = new Map<string, CardModel[]>();

      cards.forEach(value => {
        if (!columnsMap.has(value.columnId)) {
          return;
        }
        if (!columnCardsMap.get(value.columnId)) {
          columnCardsMap.set(value.columnId, []);
        }
        columnCardsMap.get(value.columnId)!.push(value);
      });
    }

    columnsMap.forEach(column => {
      if (!columnCardsMap.get(column.id)) {
        columnCardsMap.set(column.id, []);
      }
    });

    this.setState({
      columnsMap: columnsMap,
      columnCardsMap: columnCardsMap
    });
  };

  moveCardActionCreator(draggedItem: CardModel, x: number, y: number, targetColumn: ColumnModel) {
    try {
      var state = getState();

      const columns = state.columnsMap;
      const fromColumn = columns.get(draggedItem.columnId);

      if (!targetColumn || !fromColumn) {
        return;
      }

      if (targetColumn.id != fromColumn.id) {
        moveToOtherColumn(fromColumn, targetColumn, draggedItem, dispatch, getState);
        state = getState();
      }

      const items = BoardManager.getVisibleCards(targetColumn, state);
      const itemAtPosition = BoardManager.getCardAtPosition(items, y, draggedItem.dimensions);
      if (!itemAtPosition) {
        return;
      }

      if (draggedItem.id == itemAtPosition.id) {
        return;
      }

      switchItemsInColumn(draggedItem, itemAtPosition, targetColumn, dispatch, getState);
    } catch (error) {
      logError('board actions error:  ' + error)
    }
  };

  moveToOtherColumn(fromColumn: ColumnModel,
    toColumn: ColumnModel,
    item: CardModel,
    dispatch: BoardDispatch<AnyAction>,
    getState: () => BoardState
  ) {
    let state = getState();

    var newColumnsMap = new Map<string, ColumnModel>(state.columnsMap);
    var newColumnCardsMap = new Map<string, CardModel[]>(state.columnCardsMap);

    var itemsFromColumn = newColumnCardsMap.get(fromColumn.id);
    var itemsToColumn = newColumnCardsMap.get(toColumn.id);

    itemsFromColumn = itemsFromColumn!.filter(x => x.id != item.id);
    itemsToColumn = itemsToColumn!.filter(x => x.id != item.id);

    if (itemsFromColumn.find(x => x.invalidatedDimensions) != undefined ||
      itemsToColumn.find(x => x.invalidatedDimensions) != undefined) { //dont do anything if dimensions invalidated - means an move operation was just done
      return;
    }

    itemsToColumn.push(item);
    item.columnId = toColumn.id;

    newColumnCardsMap.set(fromColumn.id, itemsFromColumn);
    newColumnCardsMap.set(toColumn.id, itemsToColumn);

    const action: ILoadBoardAction = {
      type: BOARD_ACTION_TYPES.LOAD_BOARD,
      columnsMap: newColumnsMap,
      columnCardsMap: newColumnCardsMap
    };
    dispatch(action);
    state = getState();

    item.setIsRenderedAndVisible(true);
    item.invalidateDimensions();

    BoardManager.updateColumnsLayoutAfterVisibilityChanged(state);
  }

function switchItemsInColumn(draggedItem: CardModel,
    itemAtPosition: CardModel,
    toColumn: ColumnModel,
    dispatch: BoardDispatch<AnyAction>,
    getState: () => BoardState) {
  let state = getState();

  var newColumnsMap = new Map<string, ColumnModel>(state.columnsMap);
  var newColumnCardsMap = new Map<string, CardModel[]>(state.columnCardsMap);
  var cardsForCurrentColumn = newColumnCardsMap.get(toColumn.id)!;

  if (!cardsForCurrentColumn || cardsForCurrentColumn.find(x => x.invalidatedDimensions)) {
    return;
  }

  draggedItem.setIsRenderedAndVisible(true);

  let visibleItems = BoardManager.getVisibleCards(toColumn, state);

  const draggedItemIndex = (visibleItems).findIndex(item => item.id === draggedItem.id);
  const itemAtPositionIndex = (visibleItems).findIndex(item => item.id === itemAtPosition.id);
  let itemsRange: CardModel[];
  if (draggedItemIndex < itemAtPositionIndex) {
    itemsRange = visibleItems.filter((_, index) => draggedItemIndex <= index && index <= itemAtPositionIndex);
  } else {
    itemsRange = visibleItems.filter((_, index) => itemAtPositionIndex <= index && index <= draggedItemIndex);
  }

  itemsRange.forEach((_, index) => {
    const firstItem = itemsRange[index];
    const secondItem = itemsRange[index + 1];
    if (!firstItem || !secondItem) {
      return;
    }

    const firstIndex = cardsForCurrentColumn!.indexOf(firstItem);
    const secondIndex = cardsForCurrentColumn!.indexOf(secondItem);
    const firstY = firstItem.dimensions?.y ?? 0;
    const secondY = secondItem.dimensions?.y ?? 0;
    const firstRef = firstItem.ref;
    const secondRef = secondItem.ref;

    cardsForCurrentColumn![firstIndex] = secondItem;
    cardsForCurrentColumn![secondIndex] = firstItem;

    firstItem.setDimensions(Object.assign(firstItem.dimensions, { y: secondY }));
    secondItem.setDimensions(Object.assign(secondItem.dimensions, { y: firstY }));

    firstItem.setRef(secondRef);
    secondItem.setRef(firstRef);

    firstItem.invalidateDimensions();
    secondItem.invalidateDimensions();
  });

  const action: ILoadBoardAction = {
    type: BOARD_ACTION_TYPES.LOAD_BOARD,
    columnsMap: newColumnsMap,
    columnCardsMap: newColumnCardsMap
  };
  dispatch(action);

  BoardManager.updateColumnsLayoutAfterVisibilityChanged(state, toColumn);
}

snapTimeout: NodeJS.Timeout | undefined = undefined;
onGestureEvent(event: GestureEvent<LongPressGestureHandlerEventPayload>) {
  try {
    const {
      draggedItem,
      movingMode,
      draggedItemWidth,
      draggedItemHeight
    } = this.state;

    const {
      board
    } = this.props;

    if (!movingMode || !draggedItem) {
      return;
    }

    this.dragX = event.nativeEvent.absoluteX;
    this.dragY = event.nativeEvent.absoluteY;

    //move dragged item
    this.state.pan.setValue({
      x: this.dragX - this.state.startingX - draggedItemWidth / 2,
      y: this.dragY - this.state.startingY - draggedItemHeight / 2
    });

    const snapMargin = 50;
    const snapAfterTimeout = 500;
    const scrollAfterTimeout = 500;

    let shouldSnapPrevOrScrollLeft = false;
    let shouldSnapNextOrScrollRight = false;

    if (event.nativeEvent.absoluteX < snapMargin) {
      shouldSnapPrevOrScrollLeft = true;
    }
    if (event.nativeEvent.absoluteX > deviceInfo.getDeviceWidth() - snapMargin) {
      shouldSnapNextOrScrollRight = true;
    }

    if (!shouldSnapPrevOrScrollLeft && !shouldSnapNextOrScrollRight && this.snapTimeout) {
      clearTimeout(this.snapTimeout);
      this.snapTimeout = undefined;
    }

    if (this.carouselContainer) {
      if (!this.snapTimeout && shouldSnapPrevOrScrollLeft) {
        this.snapTimeout = setTimeout(() => {
          this.carouselContainer?.snapToPrev();
          this.snapTimeout = undefined;
        }, snapAfterTimeout);
      } else if (!this.snapTimeout && shouldSnapNextOrScrollRight) {
        this.snapTimeout = setTimeout(() => {
          this.carouselContainer?.snapToNext();
          this.snapTimeout = undefined;
        }, snapAfterTimeout);
      }
    } else if (this.scrollContainer) {
      if (shouldSnapPrevOrScrollLeft) {
        this.snapTimeout = setTimeout(() => {
          this.scrollContainer?.snapToPrev();
          this.snapTimeout = undefined;
        }, scrollAfterTimeout);
      } else if (shouldSnapNextOrScrollRight) {
        this.snapTimeout = setTimeout(() => {
          this.scrollContainer?.snapToNext();
          this.snapTimeout = undefined;
        }, scrollAfterTimeout);
      }
    }

    let targetColumn: ColumnModel | undefined;

    if (this.carouselContainer) {
      targetColumn = this.carouselContainer!.currentItem;
    } else if (this.scrollContainer) {
      targetColumn = BoardManager.findColumn(board, this.dragX);
    }

    if (targetColumn) {
      this.props.moveCard(draggedItem!, this.dragX, this.dragY, targetColumn);
      const scrollResult = BoardManager.getScrollingDirection(targetColumn, this.dragY);

      if (!scrollResult) {
        return;
      }

      if (this.shouldScroll(scrollResult.scrolling, scrollResult.offset, targetColumn)) {
        this.scroll(targetColumn, scrollResult.offset);
      }
    }
  } catch (error) {
    logError('onGestureEvent: ' + error);
  }
}

onHandlerStateChange(event: HandlerStateChangeEvent<LongPressGestureHandlerEventPayload>) {
  const { state } = event.nativeEvent;

  if (state === rnState.ACTIVE) {
    this.onDragStart(event);
  }
  else if (state === rnState.END || state === rnState.CANCELLED) {
    this.onDragEnd();
  }
}

shouldScroll(scrolling: boolean, offset: number, column: ColumnModel) {
  const placeToScroll = ((offset < 0 && column.scrollOffset > 0) || (offset > 0 && column.scrollOffset < column.contentHeight))

  return scrolling && offset !== 0 && placeToScroll;
}

onColumnScrollingStarted() {
  this.isColumnScrolling = true;
}

onColumnScrollingEnded() {
  this.isColumnScrolling = false;
}

scrollTimeout: NodeJS.Timeout | undefined = undefined;
scroll(column: ColumnModel, anOffset: number) {
  const { movingMode } = this.state;

  if (this.scrollTimeout || !movingMode) {
    return;
  }

  this.onColumnScrollingStarted();
  const scrollOffset = column.scrollOffset + 40 * anOffset;
  column.setScrollOffset(scrollOffset);
  const columnComponent = this.columnListViewsMap.get(column.id);
  columnComponent?.scrollToOffset(scrollOffset);

  const scrollResult = BoardManager.getScrollingDirection(column, this.dragY);
  if (!scrollResult) {
    return;
  }

  this.scrollTimeout = setTimeout(() => {
    this.scrollTimeout = undefined;
  }, 50);
}

onDragEnd() {
  this.setState({ movingMode: false });
  const { draggedItem, pan, srcColumnId } = this.state;
  const { onDragEnd, board } = this.props;

  if (!draggedItem) {
    return;
  }

  try {
    draggedItem.show();
    this.props.reloadBoard();

    const destColumnId = draggedItem.columnId;
    pan.setValue({ x: 0, y: 0 });
    this.setState({ startingX: 0, startingY: 0 });

    var srcColumn = board.columnsMap.get(srcColumnId!)!;
    var destColumn = board.columnsMap.get(destColumnId)!;

    var targetCards = board.columnCardsMap.get(destColumn.id);
    var targetCardIndex = targetCards?.indexOf(draggedItem) ?? 0;

    return onDragEnd && onDragEnd(srcColumn, destColumn, draggedItem!, targetCardIndex);

  } catch (error) {
    logError('onDragEnd: ' + error);
  }
}

rotate(toValue: number) {
  const { rotate } = this.state;

  Animated.spring(
    rotate,
    {
      toValue,
      friction: 5,
      useNativeDriver: true
    }
  ).start();
}

onDragStart(event: HandlerStateChangeEvent<LongPressGestureHandlerEventPayload>) {
  const { movingMode } = this.state;

  if (movingMode) {
    return;
  }

  let column: ColumnModel | undefined;
  let item: CardModel | undefined;
  let shouldStartDragging = false;

  if (this.carouselContainer) {
    column = this.carouselContainer?.currentItem;
    if (!column) {
      return;
    }
    item = BoardManager.findCardInColumn(column, this.props.board, event.nativeEvent.absoluteY);

    if (!item || !item.dimensions) {
      return;
    }

    const columnIndex = this.carouselContainer?.getIndex(column);
    const currentCarouselColumnIndex = this.carouselContainer?.currentItemIndex ?? 0;

    shouldStartDragging = columnIndex === currentCarouselColumnIndex;
  } else if (this.scrollContainer) {
    column = BoardManager.findColumn(this.props.board, event.nativeEvent.absoluteX);
    if (!column) {
      return;
    }
    item = BoardManager.findCardInColumn(column, this.props.board, event.nativeEvent.absoluteY);

    if (!item || !item.dimensions) {
      return;
    }

    shouldStartDragging = true;
  }

  if (shouldStartDragging) {
    const draggedItemWidth = item!.dimensions!.width;
    const draggedItemHeight = item!.dimensions!.height;

    this.state.pan.setValue({
      x: this.state.startingX - draggedItemWidth / 2,
      y: this.state.startingY - draggedItemHeight / 2
    });

    item!.hide();
    this.setState({
      movingMode: true,
      draggedItem: item,
      srcColumnId: item!.columnId,
      startingX: event.nativeEvent.absoluteX,
      startingY: event.nativeEvent.absoluteY,
      draggedItemWidth: draggedItemWidth,
      draggedItemHeight: draggedItemHeight
    });
    this.rotate(MAX_DEG);
  }
}

onPress(card: CardModel) {
  const { onCardPress } = this.props;
  const { movingMode } = this.state;

  if (movingMode) {
    return;
  }

  if (this.carouselContainer) {
    const activeColumn = this.carouselContainer.currentItem;

    if (activeColumn?.id == card.columnId) {
      onCardPress(card);
    }
  } else {
    onCardPress(card);
  }
}

onScrollEnd() {
  BoardManager.updateColumnsLayoutAfterVisibilityChanged(this.props.board);
}

setBoardPositionY = (y) => {
  this.setState({ boardPositionY: y })
}

renderDragCard() {
  const { draggedItem, movingMode, pan, rotate, startingX, startingY } = this.state;
  const { renderCardContent } = this.props;
  if (!draggedItem || !movingMode) {
    return;
  }

  const interpolatedRotateAnimation = rotate.interpolate({
    inputRange: [-MAX_RANGE, 0, MAX_RANGE],
    outputRange: [`-${MAX_DEG}deg`, '0deg', `${MAX_DEG}deg`]
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startingX,
        top: startingY,
        width: GET_CARD_WIDTH() - dimensions.padding,
        transform: [
          { translateX: pan.x },
          { translateY: pan.y },
          { rotate: interpolatedRotateAnimation }
        ]
      }}>
      <Card
        model={draggedItem!}
        hidden={false}
        renderCardContent={renderCardContent}
      />
    </Animated.View>
  );
}

renderCard(item: CardModel) {
  const { renderCardContent } = this.props;
  return (
    <Card
      key={item.id}
      model={item}
      onPress={() => this.onPress(item)}
      hidden={item.isHidden}
      renderCardContent={renderCardContent}
    />
  );
}

renderColumn(columnModel: ColumnModel, oneColumn: boolean) {
  const { movingMode } = this.state;

  return (
    <Column
      ref={ref => this.columnListViewsMap.set(columnModel.id, ref)}
      key={columnModel.id}
      column={columnModel}
      renderCardItem={(item) => this.renderCard(item)}
      isWithCountBadge={true}
      movingMode={movingMode}
      oneColumn={oneColumn}
      onScrollingStarted={() => this.onColumnScrollingStarted()}
      onScrollingEnded={() => this.onColumnScrollingEnded()}
    />
  )
}

render() {
  const { movingMode } = this.state;
  const {
    board
  } = this.props;

  const columns = Array.from(board.columnsMap.values());
  const oneColumn = columns.length === 1;
  const noOfDisplayedColumns = GET_NO_OF_COLUMNS();

  let columnsContainer;
  if (noOfDisplayedColumns == 1) {
    this.scrollContainer = null;

    columnsContainer = (

      <ColumnsCarouselContainer
        ref={(c) => { this.carouselContainer = c }}
        data={columns}
        onScrollEndDrag={() => this.onScrollEnd()}
        scrollEnabled={!movingMode}
        renderItem={columnModel => this.renderColumn(columnModel, oneColumn)}
        sliderWidth={deviceInfo.getDeviceWidth()}
        itemWidth={GET_CARD_WIDTH()}
        oneColumn={oneColumn}
      />
    );
  } else {
    this.carouselContainer = null;

    columnsContainer = (
      <ColumnsScrollContainer
        ref={(c) => { this.scrollContainer = c }}
        data={columns}
        onScrollEndDrag={() => this.onScrollEnd()}
        renderItem={columnModel => this.renderColumn(columnModel, oneColumn)}
        itemWidth={GET_CARD_WIDTH()}
      />
    );
  }

  return (
    <LongPressGestureHandler
      maxDist={Number.MAX_SAFE_INTEGER}
      onGestureEvent={event => this.onGestureEvent(event)}
      onHandlerStateChange={event => this.onHandlerStateChange(event)}>
      <View
        style={styles.boardContainer}
        onLayout={(evt) => this.setBoardPositionY(evt.nativeEvent.layout.y)}>

        {columnsContainer}

        {this.renderDragCard()}
      </View >
    </LongPressGestureHandler>
  )
}
}

export default connect(mapStateToProps, mapDispatchToProps)(ReactTimeout(KanbanBoardContainer))

const styles = StyleSheet.create({
  boardContainer: {
    flex: 1
  }
});
