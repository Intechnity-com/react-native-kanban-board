import { CardModel } from "./card-model";
import { ColumnModel } from "./column-model";

export interface BoardState {
  columnCardsMap: Map<string, CardModel[]>;
  columnsMap: Map<string, ColumnModel>;
}
