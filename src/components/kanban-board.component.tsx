import React, { RefObject } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  LayoutChangeEvent
} from 'react-native';
import {
  GestureEvent,
  GestureHandlerRootView,
  HandlerStateChangeEvent,
  LongPressGestureHandler,
  LongPressGestureHandlerEventPayload,
  State as rnState
} from 'react-native-gesture-handler';
import ReactTimeout, { ReactTimeoutProps } from 'react-timeout';

import { CardModel } from '../models/card-model';
import { ColumnModel } from '../models/column-model';
import WrappedColumnsSnapContainer, { ColumnSnapContainer } from './columns/columns-carousel-container.component';
import { BoardState } from '../models/board-state';
import { BoardManager } from '../utils/board-manager';
import { logError } from '../utils/logger';
import { MAX_DEG, MAX_RANGE } from '../board-consts';
import Card, { CardExternalProps } from './cards/card.component';
import Column, { ColumnExternalProps } from './columns/column.component';
import { KanbanContextProvider, KanbanContext, withKanbanContext } from './kanban-context.provider';

export type KanbanBoardProps =
  CardExternalProps &
  ColumnExternalProps & {
    /**
     * An array of column models representing the columns in the Kanban board.
     */
    columns: ColumnModel[];

    /**
     * An array of card models representing the cards in the Kanban board.
     */
    cards: CardModel[];

    /**
     * Callback function invoked when a card is dragged and dropped onto another column.
     * @param {ColumnModel} srcColumn - The source column from which the card is dragged.
     * @param {ColumnModel} destColumn - The destination column onto which the card is dropped.
     * @param {CardModel} item - The card model that was dragged and dropped.
     * @param {number} targetIdx - The index at which the card was dropped within the destination column.
     */
    onDragEnd: (srcColumn: ColumnModel, destColumn: ColumnModel, item: CardModel, targetIdx: number) => void;
  }


type Props =
  ReactTimeoutProps &
  KanbanContext &
  KanbanBoardProps;

type State = {
  boardState: BoardState,
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

class KanbanBoard extends React.Component<Props, State> {
  isColumnScrolling: boolean;
  dragX: number = 0;
  dragY: number = 0;
  carouselRef: RefObject<ColumnSnapContainer> = React.createRef<ColumnSnapContainer>();
  columnListViewsMap: Map<string, any> = new Map<string, any>(); //any is here Column

  constructor(props: Props) {
    super(props);

    this.state = {
      boardState: {
        columnCardsMap: new Map(),
        columnsMap: new Map()
      },
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
  }

  componentDidMount() {
    this.loadBoard(this.props.columns, this.props.cards);
  }

  componentDidUpdate(prevProps: Props) {
    const { columns, cards } = this.props;

    let changedColumns: ColumnModel[] | undefined = undefined;
    let changedCards: CardModel[] | undefined = undefined;

    if (prevProps.columns != columns) {
      changedColumns = columns;
    }

    if (prevProps.cards != cards) {
      changedCards = cards;
    }

    if (changedColumns || changedCards) {
      this.refreshBoard(changedColumns, changedCards);
    }
  }

  loadBoard(columns: ColumnModel[], cards: CardModel[]) {
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
      boardState: {
        columnsMap: columnsMap,
        columnCardsMap: columnCardsMap
      }
    });
  };

  refreshBoard(columns?: ColumnModel[], cards?: CardModel[]) {
    const { boardState } = this.state;

    var columnsMap = new Map<string, ColumnModel>(boardState.columnsMap);
    var columnCardsMap = new Map<string, CardModel[]>(boardState.columnCardsMap);

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
      boardState: {
        columnsMap: columnsMap,
        columnCardsMap: columnCardsMap
      }
    });
  };

  moveCard(draggedItem: CardModel, _x: number, y: number, targetColumn: ColumnModel) {
    try {

      const columns = this.state.boardState.columnsMap;
      const fromColumn = columns.get(draggedItem.columnId);

      if (!targetColumn || !fromColumn) {
        return;
      }

      if (targetColumn.id != fromColumn.id) {
        this.moveToOtherColumn(fromColumn, targetColumn, draggedItem);
      }

      const items = BoardManager.getVisibleCards(targetColumn, this.state.boardState);
      const itemAtPosition = BoardManager.getCardAtPosition(items, y, draggedItem.dimensions);
      if (!itemAtPosition) {
        return;
      }

      if (draggedItem.id == itemAtPosition.id) {
        return;
      }

      this.switchItemsInColumn(draggedItem, itemAtPosition, targetColumn);
    } catch (error) {
      logError('board actions error:  ' + error)
    }
  };

  moveToOtherColumn(fromColumn: ColumnModel, toColumn: ColumnModel, item: CardModel) {
    var newColumnsMap = new Map<string, ColumnModel>(this.state.boardState.columnsMap);
    var newColumnCardsMap = new Map<string, CardModel[]>(this.state.boardState.columnCardsMap);

    var itemsFromColumn = newColumnCardsMap.get(fromColumn.id);
    var itemsToColumn = newColumnCardsMap.get(toColumn.id);

    itemsFromColumn = itemsFromColumn!.filter(x => x.id != item.id);
    itemsToColumn = itemsToColumn!.filter(x => x.id != item.id);

    if (itemsFromColumn.find(x => x.invalidatedDimensions) != undefined ||
      itemsToColumn.find(x => x.invalidatedDimensions) != undefined) { // dont do anything if dimensions invalidated - means an move operation was just done
      return;
    }

    itemsToColumn.push(item);
    item.columnId = toColumn.id;

    newColumnCardsMap.set(fromColumn.id, itemsFromColumn);
    newColumnCardsMap.set(toColumn.id, itemsToColumn);

    this.setState({
      boardState: {
        columnsMap: newColumnsMap,
        columnCardsMap: newColumnCardsMap
      }
    });

    item.setIsRenderedAndVisible(true);
    item.invalidateDimensions();

    BoardManager.updateColumnsLayoutAfterVisibilityChanged(this.state.boardState);
  }

  switchItemsInColumn(draggedItem: CardModel, itemAtPosition: CardModel, toColumn: ColumnModel) {
    var newColumnsMap = new Map<string, ColumnModel>(this.state.boardState.columnsMap);
    var newColumnCardsMap = new Map<string, CardModel[]>(this.state.boardState.columnCardsMap);
    var cardsForCurrentColumn = newColumnCardsMap.get(toColumn.id)!;

    if (!cardsForCurrentColumn || cardsForCurrentColumn.find(x => x.invalidatedDimensions)) {
      return;
    }

    draggedItem.setIsRenderedAndVisible(true);

    let visibleItems = BoardManager.getVisibleCards(toColumn, this.state.boardState);

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

      firstItem.setDimensions({ ...firstItem.dimensions!, y: secondY });
      secondItem.setDimensions({ ...secondItem.dimensions!, y: firstY });

      firstItem.setRef(secondRef);
      secondItem.setRef(firstRef);

      firstItem.invalidateDimensions();
      secondItem.invalidateDimensions();
    });

    this.setState({
      boardState: {
        columnsMap: newColumnsMap,
        columnCardsMap: newColumnCardsMap
      }
    });

    BoardManager.updateColumnsLayoutAfterVisibilityChanged(this.state.boardState, toColumn);
  }

  snapTimeout: NodeJS.Timeout | undefined = undefined;
  onGestureEvent = (event: GestureEvent<LongPressGestureHandlerEventPayload>) => {
    try {
      const {
        deviceWidth
      } = this.props;
      const {
        draggedItem,
        movingMode,
        draggedItemWidth,
        draggedItemHeight
      } = this.state;

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

      let shouldSnapPrevOrScrollLeft = false;
      let shouldSnapNextOrScrollRight = false;

      if (event.nativeEvent.absoluteX < snapMargin) {
        shouldSnapPrevOrScrollLeft = true;
      }
      if (event.nativeEvent.absoluteX > deviceWidth - snapMargin) {
        shouldSnapNextOrScrollRight = true;
      }

      if (!shouldSnapPrevOrScrollLeft && !shouldSnapNextOrScrollRight && this.snapTimeout) {
        clearTimeout(this.snapTimeout);
        this.snapTimeout = undefined;
      }

      if (!this.snapTimeout && shouldSnapPrevOrScrollLeft) {
        this.snapTimeout = setTimeout(() => {
          this.carouselRef.current?.snapToPrev();
          this.snapTimeout = undefined;
        }, snapAfterTimeout);
      } else if (!this.snapTimeout && shouldSnapNextOrScrollRight) {
        this.snapTimeout = setTimeout(() => {
          this.carouselRef.current?.snapToNext();
          this.snapTimeout = undefined;
        }, snapAfterTimeout);
      }

      let targetColumn: ColumnModel | undefined;

      targetColumn = this.carouselRef.current!.getCurrentItem();

      if (targetColumn) {
        this.moveCard(draggedItem!, this.dragX, this.dragY, targetColumn);
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

  onHandlerStateChange = (event: HandlerStateChangeEvent<LongPressGestureHandlerEventPayload>) => {
    const { state } = event.nativeEvent;

    if (state === rnState.ACTIVE) {
      this.onDragStart(event);
    } else if (state === rnState.END || state === rnState.CANCELLED) {
      this.onDragEnd();
    }
  }

  shouldScroll(scrolling: boolean, offset: number, column: ColumnModel) {
    const placeToScroll = ((offset < 0 && column.scrollOffset > 0) || (offset > 0 && column.scrollOffset < column.contentHeight))

    return scrolling && offset !== 0 && placeToScroll;
  }

  onColumnScrollingStarted = () => {
    this.isColumnScrolling = true;
  }

  onColumnScrollingEnded = () => {
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
    const { onDragEnd } = this.props;

    if (!draggedItem) {
      return;
    }

    try {
      draggedItem.show();
      this.refreshBoard();

      const destColumnId = draggedItem.columnId;
      pan.setValue({ x: 0, y: 0 });
      this.setState({ startingX: 0, startingY: 0 });

      var srcColumn = this.state.boardState.columnsMap.get(srcColumnId!)!;
      var destColumn = this.state.boardState.columnsMap.get(destColumnId)!;

      var targetCards = this.state.boardState.columnCardsMap.get(destColumn.id);
      var targetCardIndex = targetCards?.indexOf(draggedItem) ?? 0;

      if (onDragEnd) {
        onDragEnd(srcColumn, destColumn, draggedItem!, targetCardIndex);
      }

      this.setState({
        draggedItem: undefined
      });

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

    column = this.carouselRef.current?.getCurrentItem();
    if (!column) {
      return;
    }
    item = BoardManager.findCardInColumn(column, this.state.boardState, event.nativeEvent.absoluteY);

    if (!item || !item.dimensions) {
      return;
    }

    const columnIndex = this.carouselRef.current?.getIndex(column);
    const currentCarouselColumnIndex = this.carouselRef.current?.getCurrentItemIndex() ?? 0;

    shouldStartDragging = columnIndex === currentCarouselColumnIndex;

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

  cardPressed = (card: CardModel) => {
    const { onCardPress } = this.props;
    const { movingMode } = this.state;

    if (movingMode || !onCardPress) {
      return;
    }

    onCardPress(card);
  }

  onScrollEnd = () => {
    BoardManager.updateColumnsLayoutAfterVisibilityChanged(this.state.boardState);
  }

  setBoardPositionY = (e: LayoutChangeEvent) => {
    this.setState({ boardPositionY: e.nativeEvent.layout.y })
  }

  renderDragCard() {
    const { cardWidth } = this.props;
    const {
      draggedItem,
      movingMode,
      pan,
      rotate,
      startingX,
      startingY } = this.state;
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
          width: cardWidth - 16,
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

  renderCard = (item: CardModel) => {
    const {
      renderCardContent,
      cardContainerStyle,
      cardTitleTextStyle,
      cardSubtitleTextStyle,
      cardContentTextStyle
    } = this.props;

    return (
      <Card
        key={item.id}
        model={item}
        hidden={item.isHidden}
        onCardPress={this.cardPressed}
        renderCardContent={renderCardContent}
        cardContainerStyle={cardContainerStyle}
        cardTitleTextStyle={cardTitleTextStyle}
        cardSubtitleTextStyle={cardSubtitleTextStyle}
        cardContentTextStyle={cardContentTextStyle}
      />
    );
  }

  renderColumn = (columnModel: ColumnModel, oneColumn: boolean) => {
    const {
      renderEmptyColumn,
      columnHeaderContainerStyle,
      columnHeaderTitleStyle
    } = this.props;
    const {
      movingMode,
      boardState
    } = this.state;

    return (
      <Column
        ref={ref => this.columnListViewsMap.set(columnModel.id, ref)}
        key={columnModel.id}
        boardState={boardState}
        column={columnModel}
        renderCardItem={this.renderCard}
        isWithCountBadge={true}
        movingMode={movingMode}
        oneColumn={oneColumn}
        onScrollingStarted={this.onColumnScrollingStarted}
        onScrollingEnded={this.onColumnScrollingEnded}
        renderEmptyColumn={renderEmptyColumn}
        columnHeaderContainerStyle={columnHeaderContainerStyle}
        columnHeaderTitleStyle={columnHeaderTitleStyle}
      />
    )
  }

  render() {
    const {
      deviceWidth,
      cardWidth
    } = this.props;
    const {
      boardState,
      movingMode
    } = this.state;

    const columns = Array.from(boardState.columnsMap.values());
    const oneColumn = columns.length === 1;

    return (
      <GestureHandlerRootView style={styles.boardContainer}>
        <KanbanContextProvider>
          <LongPressGestureHandler
            maxDist={Number.MAX_SAFE_INTEGER}
            onGestureEvent={this.onGestureEvent}
            onHandlerStateChange={this.onHandlerStateChange}>
            <View
              style={styles.boardContainer}
              onLayout={this.setBoardPositionY}>

              <WrappedColumnsSnapContainer
                ref={this.carouselRef}
                data={columns}
                onScrollEndDrag={this.onScrollEnd}
                scrollEnabled={!movingMode}
                renderItem={this.renderColumn}
                sliderWidth={deviceWidth}
                itemWidth={cardWidth}
                oneColumn={oneColumn}
                deviceWidth={this.props.deviceWidth}
                isLandscape={this.props.isLandscape}
                columnWidth={this.props.columnWidth}
                oneColumnWidth={this.props.oneColumnWidth}
                cardWidth={this.props.cardWidth}
                noOfColumns={this.props.noOfColumns}
              />

              {this.renderDragCard()}
            </View >
          </LongPressGestureHandler>
        </KanbanContextProvider>
      </GestureHandlerRootView>
    )
  }
}

const styles = StyleSheet.create({
  boardContainer: {
    flex: 1
  }
});

export default withKanbanContext(ReactTimeout(KanbanBoard));
