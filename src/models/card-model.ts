import { View } from 'react-native';
import { Rect } from './rect';
import { Tag } from './tag';

export class CardModel {
  private _ref: View | null = null;
  private _hidden: boolean = false;
  private _rect: Rect | undefined;
  private _isLocked: boolean = false;
  private _isRenderedAndVisible: boolean = false;
  private _invalidated: boolean = false;

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

  get isInvalidated(): boolean {
    return this._invalidated;
  }

  /**
   * Creates a new CardModel instance.
   * @param {string | undefined} id - The ID of the card.
   * @param {string} columnId - The ID of the column the card belongs to.
   * @param {string} title - The title of the card.
   * @param {string} subtitle - The subtitle of the card.
   * @param {string | undefined} description - The description of the card (optional).
   * @param {Tag[]} tags - The tags associated with the card.
   * @param {*} item - The item associated with the card.
   * @param {number} sortOrder - The sort order of the card within its column.
   */
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

  validateAndMeasure() {
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

      console.log("Validated card: " + this.id + ", dimensions: " + JSON.stringify(this._rect));

      this._invalidated = false;
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

  invalidate() {
    this._invalidated = true;
  }
}
