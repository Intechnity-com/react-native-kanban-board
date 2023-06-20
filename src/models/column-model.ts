import { View } from 'react-native';
import { Rect } from './rect';

export class ColumnModel {
  private _ref: View | null = null;
  private _rect: Rect | undefined;
  private _scrollOffset: number = 0;
  private _contentHeight: number = 0;
  private _isRenderedAndVisible: boolean = false;

  id: string;
  title: string;
  value: any;

  get dimensions(): Rect | undefined {
    return this._rect;
  }

  get scrollOffset(): number {
    return this._scrollOffset;
  }

  get contentHeight(): number {
    return this._contentHeight;
  }

  get isRenderedAndVisible(): boolean {
    return this._isRenderedAndVisible;
  }

  /**
   * Creates a new ColumnModel instance.
   * @param {string} id - The ID of the column.
   * @param {string} title - The title of the column.
   * @param {*} value - The value associated with the column.
   */
  constructor(id: string, title: string, value: any) {
    this.id = id;
    this.title = title;
    this.value = value;
  }

  setRef(ref: View | null) {
    this._ref = ref;
  }

  measure() {
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
    });
  }

  setScrollOffset(scrollOffset: number) {
    this._scrollOffset = scrollOffset;
  }

  setContentHeight(contentHeight: number) {
    this._contentHeight = contentHeight;
  }

  setIsRenderedAndVisible(visible: boolean) {
    this._isRenderedAndVisible = visible;
  }
}
