import React from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, View, ViewToken } from 'react-native';

import EmptyColumn from './empty-column.component';
import { ColumnModel } from '../../models/column-model';
import { CardModel } from '../../models/card-model';
import { GET_COLUMN_WIDTH, GET_ONE_COLUMN_WIDTH } from '../../board-config';
import { Badge } from './badge.component';
import { BoardManager } from '../../utils/board-manager';
import { BoardState } from '../../models/board-state';
import { COLUMN_MARGIN } from 'src/board-consts';

type Props = {
  boardState: BoardState,
  column: ColumnModel;
  renderCardItem: (item: CardModel) => JSX.Element;
  isWithCountBadge: boolean;
  movingMode: boolean;
  oneColumn: boolean;
  onScrollingStarted: () => void;
  onScrollingEnded: () => void;
}

type State = {
}

export class Column extends React.Component<Props, State> {
  scrollingDown: boolean = false;
  flatList: React.RefObject<FlatList<CardModel>> = React.createRef<FlatList<CardModel>>();
  viewabilityConfig: any = {
    itemVisiblePercentThreshold: 1,
    waitForInteraction: false
  };

  setRefColumn = (ref: View | null) => {
    this.props.column.setRef(ref);
  }

  measureColumn = () => {
    this.props.column.measure();
  }

  scrollToOffset = (offset: number) => {
    this.flatList?.current?.scrollToOffset({ animated: true, offset });
  }

  handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      column,
      onScrollingStarted
    } = this.props;

    onScrollingStarted();

    const liveOffset = event.nativeEvent.contentOffset.y;
    this.scrollingDown = liveOffset > column.scrollOffset;
  }

  endScrolling = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      column,
      onScrollingEnded,
    } = this.props;

    const currentOffset = event.nativeEvent.contentOffset.y;
    const scrollingDownEnded = this.scrollingDown && currentOffset >= column.scrollOffset;
    const scrollingUpEnded = !this.scrollingDown && currentOffset <= column.scrollOffset;

    if (scrollingDownEnded || scrollingUpEnded) {
      column.setScrollOffset(currentOffset);
      BoardManager.updateColumnsLayoutAfterVisibilityChanged(this.props.boardState);
      onScrollingEnded();
    }
  }

  onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.endScrolling(event);
  }

  onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { onScrollingEnded } = this.props;

    this.endScrolling(event);
    onScrollingEnded();
  }

  onContentSizeChange = (_: number, contentHeight: number) => {
    const { column } = this.props;
    column.setContentHeight(contentHeight);
  }

  handleChangeVisibleItems = (info: { viewableItems: Array<ViewToken>; changed: Array<ViewToken> }) => {
    const { column } = this.props;
    let visibleItems = info.viewableItems.map(x => x.item);
    BoardManager.updateItemsVisibility(this.props.boardState, column, visibleItems);
  }

  render = () => {
    const {
      column,
      renderCardItem,
      isWithCountBadge,
      oneColumn,
      movingMode,
      boardState
    } = this.props;

    const items = boardState.columnCardsMap.has(column.id) ? boardState.columnCardsMap.get(column.id)! : [];
    const noOfItems = items.length;

    let columnContent;
    if (noOfItems > 0) {
      columnContent = (
        <FlatList
          data={items}
          ref={this.flatList}
          onScroll={this.handleScroll}
          scrollEventThrottle={0}
          onMomentumScrollEnd={this.onMomentumScrollEnd}
          onScrollEndDrag={this.onScrollEndDrag}
          onViewableItemsChanged={this.handleChangeVisibleItems}
          viewabilityConfig={this.viewabilityConfig}
          renderItem={item => (
            <View key={item.item.id}
              ref={ref => item.item.setRef(ref)}
              onLayout={() => item.item.measure(undefined)}>
              {renderCardItem(item.item)}
            </View>
          )}
          keyExtractor={item => item.id ?? ''}
          scrollEnabled={!movingMode}
          onContentSizeChange={this.onContentSizeChange}
          showsVerticalScrollIndicator={false}
        />
      );
    } else {
      columnContent = (
        <EmptyColumn />
      );
    }

    return (
      <View
        ref={this.setRefColumn}
        onLayout={this.measureColumn}
        style={[
          styles.columnContainer, {
            width: oneColumn ? GET_ONE_COLUMN_WIDTH() : GET_COLUMN_WIDTH(),
            marginRight: oneColumn ? 0 : COLUMN_MARGIN
          }]}>
        <View style={styles.columnHeaderContainer}>
          <Text style={styles.columnHeaderTitle}>{column.title}</Text>
          {isWithCountBadge &&
            <View style={styles.columnHeaderRightContainer}>
              <Badge value={noOfItems} />
            </View>
          }
        </View>

        {columnContent}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  columnContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8
  },
  columnHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  columnHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  columnHeaderRightContainer: {
  },
});
