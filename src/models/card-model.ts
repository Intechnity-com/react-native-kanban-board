import { View } from 'react-native';
import { Rect } from './rect';
import { Tag } from './tag';

export class CardModel {
  private _ref: View | null = null;
  private _hidden: boolean = false;
  private _rect: Rect | undefined;
  private _isLocked: boolean = false;
  private _isRenderedAndVisible: boolean = false;
  private _invalidatedDimensions: boolean = false;

  id: string | undefined;
  columnId: string;
  title: string;
  subtitle: string;
  description: string | undefined;
  tags: Tag[];
  item: any;
  sortOrder: number;

  get ref(): View | null {
    return this._ref;
  }

  get isHidden(): boolean {
    return this._hidden;
  }

  get dimensions(): Rect | undefined {
    return this._rect;
  }

  get isLocked(): boolean {
    return this._isLocked;
  }

  get isRenderedAndVisible(): boolean {
    return this._isRenderedAndVisible;
  }

  get invalidatedDimensions(): boolean {
    return this._invalidatedDimensions;
  }

  constructor(id: string | undefined,
    columnId: string,
    title: string,
    subtitle: string,
    description: string | undefined,
    tags: Tag[],
    item: any,
    sortOrder: number) {

    this.id = id;
    this.columnId = columnId;
    this.title = title;
    this.subtitle = subtitle;
    this.description = description;
    this.tags = tags;
    this.item = item;
    this.sortOrder = sortOrder;
  }

  setRef(ref: View | null) {
    this._ref = ref;
  }

  measure(previousItem: CardModel | undefined) {
    if (!this._ref) {
      this._rect = undefined;
      return;
    }

    this._ref.measure((_x, _y, width, height, pageX, pageY) => {
      this._rect = { x: pageX, y: pageY, width, height };
      if (!this._isRenderedAndVisible && this._rect.x && this._rect.y && this._rect.width && this._rect.height) {
        this.setIsRenderedAndVisible(true);
      } else if (this._isRenderedAndVisible && !this._rect.x && !this._rect.y && !this._rect.width && !this._rect.height) {
        this.setIsRenderedAndVisible(false);
      }
      if (previousItem?.dimensions && previousItem.dimensions.y > this._rect.y) {
        this.setIsRenderedAndVisible(false);
      }

      this._invalidatedDimensions = false;
    });
  }

  setDimensions(dimensions: Rect | undefined) {
    this._rect = dimensions;
  }

  setIsRenderedAndVisible(visible: boolean) {
    this._isRenderedAndVisible = visible;
  }

  hide() {
    this._hidden = true;
  }

  show() {
    this._hidden = false;
  }

  invalidateDimensions() {
    this._invalidatedDimensions = true;
  }
}
