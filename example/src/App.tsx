import * as React from 'react';
import { View, Text, Alert } from 'react-native';
import { KanbanBoard, ColumnModel, CardModel } from '@intechnity/react-native-kanban-board';

type AppState = {
  columns: ColumnModel[];
  cards: CardModel[];
}

class App extends React.Component<{}, AppState> {
  componentDidMount(): void {
    const columns = [
      new ColumnModel("new", "New", 1),
      new ColumnModel("inProgress", "In Progress", 2),
      new ColumnModel("ready", "Ready", 3),
    ];

    const cards = [
      new CardModel(
        "card1",
        "new",
        "1st Card",
        "Example card",
        "test description",
        [
          {
            text: "Tag1",
            backgroundColor: "#00FF00",
            textColor: "#000000"
          }
        ],
        null,
        1
      ),
      new CardModel(
        "card2",
        "new",
        "2nd Card",
        "Example card",
        "test description",
        [
          {
            text: "Tag2",
            backgroundColor: "#FFA500",
            textColor: "#000000"
          }
        ],
        null,
        2
      ),
      new CardModel(
        "card3",
        "inProgress",
        "3rd Card",
        "Example card",
        "test description",
        [
        ],
        null,
        1
      )
    ];

    this.setState({
      columns: columns,
      cards: cards
    });
  }

  onCardDragEnd = (srcColumn: ColumnModel, destColumn: ColumnModel, item: CardModel, cardIdx: number) => {
    Alert.alert(`Card finished dragging. Item: ${item.title}, from column: ${srcColumn.id}, to column: ${destColumn.id}, card index: ${cardIdx}`);
  }

  onCardPress = (card: CardModel) => {
    Alert.alert(`Card '${card.title}' pressed`);
  }

  render() {
    const { columns, cards } = this.state;

    return (
      <View>
        <Text>Example kanban board</Text>

        <KanbanBoard
          columns={columns}
          cards={cards}
          onDragEnd={(srcColumn, destColumn, item, targetIdx) => this.onCardDragEnd(srcColumn, destColumn, item, targetIdx)}
          onCardPress={(item) => this.onCardPress(item)}
        />
      </View>
    );
  }
}

export default App;
