import { ColumnModel } from '../models/column-model';
import { BoardState } from '../models/board-state';
import { CardModel } from '../models/card-model';
import { Rect } from '../models/rect';

export class BoardManager {
  static SCROLL_TRESHOLD = 100;

  static updateItemsVisibility(boardState: BoardState, column: ColumnModel, visibleItems: CardModel[]) {
    const allItemsForCard = boardState.columnCardsMap.get(column.id);
    if (!allItemsForCard) {
      return;
    }

    this.updateColumnsLayoutAfterVisibilityChanged(boardState, column);

    // todo is this needed?
    allItemsForCard.forEach(item => {
      const isVisible = visibleItems?.some(x => x.id === item.id) ?? false;
      item.setIsRenderedAndVisible(isVisible);
    });
  }

  // Function to update column layout after visibility change
  static updateColumnsLayoutAfterVisibilityChanged(boardState: BoardState, column: ColumnModel | undefined = undefined) {
    let columns = column ? [column] : Array.from(boardState.columnsMap.values());

    columns.forEach(column => {
      column.measure();

      const cards = boardState.columnCardsMap.get(column.id);
      if (!cards) {
        return;
      }

      cards.forEach((card) => {
        card.validateAndMeasure();
      });
    });
  };

  static getScrollingDirection(column: ColumnModel, scrollY: number | undefined): { offset: number, scrolling: boolean } | undefined {
    const layout = column.dimensions;
    if (!layout) {
      return undefined;
    }

    if (!scrollY)
      scrollY = 0;

    const upperEnd = layout.y;
    const upper = scrollY > upperEnd - this.SCROLL_TRESHOLD && scrollY < upperEnd + this.SCROLL_TRESHOLD;

    const lowerEnd = layout.y + layout.height;
    const lower = scrollY > lowerEnd - this.SCROLL_TRESHOLD && scrollY < lowerEnd + this.SCROLL_TRESHOLD;

    const offset = lower ? 1 : (upper ? -1 : 0);

    return {
      offset,
      scrolling: (lower || upper)
    }
  }

  static findColumn(boardState: BoardState, x: number): ColumnModel | undefined {
    let visibleColumns = this.getVisibleColumns(boardState);
    let column = visibleColumns.filter(col => col.dimensions && x >= col.dimensions.x && x <= col.dimensions.x + col.dimensions.width);

    if (column.length > 0) {
      return column[0];
    }

    return undefined;
  }

  static findCardInColumn(column: ColumnModel, boardState: BoardState, y: number): CardModel | undefined {
    const visibleItems = this.getVisibleCards(column, boardState);
    if (!visibleItems || visibleItems.length == 0) {
      return undefined;
    }

    let dimensions = visibleItems[0]!.dimensions!; //just get height of first dimension as 'template'
    dimensions = { ...dimensions, y: y };

    return this.getCardAtPosition(visibleItems, y, dimensions);
  }

  static getCardAtPosition(items: CardModel[], y: number, dimensions: Rect | undefined): CardModel | undefined {
    if (items.length == 0) {
      return undefined;
    }
    let item = items.find(i => this.isItemWithinY(y, dimensions, i));

    //if Y higher than first item, then select 1 item
    const firstItem = items[0];
    if (!item && firstItem && firstItem.dimensions && y <= firstItem.dimensions.y) {
      item = firstItem;
    }

    //if Y lower than last item, then select last item
    const lastItem = items[items.length - 1];
    if (!item && lastItem && lastItem.dimensions && y >= lastItem.dimensions.y) {
      item = lastItem;
    }

    return item;
  }

  static isItemWithinY(y: number, dimensions: Rect | undefined, item: CardModel): boolean {
    if (!item.dimensions || !dimensions) {
      return false;
    }

    const itemDimensions = item.dimensions;
    const heightDiff = Math.abs(dimensions.height - itemDimensions.height);

    let isUp;
    let isDown;

    if (heightDiff > itemDimensions.height) {
      isUp = y > itemDimensions.y;
      isDown = y < itemDimensions.y + itemDimensions.height;
    } else if (y < dimensions.y) {
      isUp = y > itemDimensions.y;
      isDown = y < itemDimensions.y + itemDimensions.height - heightDiff;
    } else {
      isUp = y > itemDimensions.y + heightDiff;
      isDown = y < itemDimensions.y + itemDimensions.height;
    }

    return isUp && isDown;
  }

  static getVisibleCards(column: ColumnModel, boardState: BoardState): CardModel[] {
    var cards = boardState.columnCardsMap.get(column.id);
    if (!cards) {
      return [];
    }

    const visibleCards = cards.filter(x => x.isRenderedAndVisible);
    return visibleCards;
  }

  static getVisibleColumns(boardState: BoardState): ColumnModel[] {
    return Array.from(boardState.columnsMap.values()).filter(column => column.isRenderedAndVisible);
  }
}
