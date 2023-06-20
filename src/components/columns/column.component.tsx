import React from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  Text,
  View,
  TextStyle,
  ViewStyle
} from 'react-native';

import EmptyColumn from './empty-column.component';
import { ColumnModel } from '../../models/column-model';
import { CardModel } from '../../models/card-model';
import { Badge } from './badge.component';
import { BoardTools } from '../../utils/board-tools';
import { BoardState } from '../../models/board-state';
import { COLUMN_MARGIN } from '../../board-consts';
import { KanbanContext } from '../kanban-context.provider';

export type ColumnExternalProps = {
  /**
   * Function that renders the content for an empty column.
   * @param {ColumnModel} item - The column model representing the empty column.
   * @returns {JSX.Element} - The JSX element representing the content for the empty column.
   */
  renderEmptyColumn?: (item: ColumnModel) => JSX.Element;

  /**
   * Custom style for the column header container.
   */
  columnHeaderContainerStyle?: StyleProp<ViewStyle>;

  /**
   * Custom style for the column header title text.
   */
  columnHeaderTitleStyle?: StyleProp<TextStyle>;
}

type Props = KanbanContext &
  ColumnExternalProps & {
    boardState: BoardState;
    column: ColumnModel;
    renderCardItem: (item: CardModel) => JSX.Element;
    isWithCountBadge: boolean;
    movingMode: boolean;
    singleDataColumnAvailable: boolean;
  };

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
      column
    } = this.props;

    const liveOffset = event.nativeEvent.contentOffset.y;
    this.scrollingDown = liveOffset > column.scrollOffset;
  }

  endScrolling = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      column
    } = this.props;

    const currentOffset = event.nativeEvent.contentOffset.y;
    const scrollingDownEnded = this.scrollingDown && currentOffset >= column.scrollOffset;
    const scrollingUpEnded = !this.scrollingDown && currentOffset <= column.scrollOffset;

    if (scrollingDownEnded || scrollingUpEnded) {
      column.setScrollOffset(currentOffset);
      BoardTools.validateAndMeasureBoard(this.props.boardState);
    }
  }

  onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.endScrolling(event);
  }

  onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.endScrolling(event);
  }

  onContentSizeChange = (_: number, contentHeight: number) => {
    const { column } = this.props;
    column.setContentHeight(contentHeight);
  }

  handleChangeVisibleItems = () => {
    const { column } = this.props;
    BoardTools.validateAndMeasureBoard(this.props.boardState, column);
  }

  render = () => {
    const {
      column,
      renderCardItem,
      isWithCountBadge,
      singleDataColumnAvailable,
      movingMode,
      boardState,
      oneColumnWidth,
      columnWidth,

      renderEmptyColumn,
      columnHeaderContainerStyle,
      columnHeaderTitleStyle
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
              onLayout={() => item.item.validateAndMeasure()}>
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
      columnContent = renderEmptyColumn ?
        renderEmptyColumn(column) : (
          <EmptyColumn />
        );
    }

    return (
      <View
        ref={this.setRefColumn}
        onLayout={this.measureColumn}
        style={[
          styles.columnContainer, {
            width: singleDataColumnAvailable ? oneColumnWidth : columnWidth,
            marginRight: singleDataColumnAvailable ? 0 : COLUMN_MARGIN
          }]}>
        <View style={[styles.columnHeaderContainer, columnHeaderContainerStyle]}>
          <Text style={[styles.columnHeaderTitle, columnHeaderTitleStyle]}>{column.title}</Text>
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

export default Column;

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
