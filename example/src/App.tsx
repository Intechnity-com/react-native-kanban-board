import * as React from 'react';
import { View, Text, Alert, StyleSheet, StatusBar, Button } from 'react-native';
import { KanbanBoard, ColumnModel, CardModel } from '@intechnity/react-native-kanban-board';

type AppState = {
  columns: ColumnModel[];
  cards: CardModel[];
}

class App extends React.Component<{}, AppState> {
  exampleCardNo: number = 1;

  constructor(props: {}) {
    super(props);

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
        [],
        null,
        1
      )
    ];

    this.state = {
      columns: columns,
      cards: cards
    }
  }

  addNewCard = () => {
    const { cards } = this.state;

    const newCard = new CardModel(
      "Generated card",
      "new",
      "New card " + this.exampleCardNo++,
      "Example card",
      "Some description",
      [],
      null,
      1
    );

    let newCards = [
      ...cards,
      newCard
    ];

    this.setState({
      cards: newCards
    });
  }

  onCardDragEnd = (srcColumn: ColumnModel, destColumn: ColumnModel, item: CardModel, cardIdx: number) => {
    Alert.alert(
      'Card finished dragging',
      `Item: ${item.title} \nFrom column: ${srcColumn.id} \nTo column: ${destColumn.id} \nCard index: ${cardIdx}`);
  }

  onCardPress = (card: CardModel) => {
    Alert.alert(`Card '${card.title}' pressed`);
  }

  render() {
    const { columns, cards } = this.state;

    return (
      <View style={styles.container}>
        <Text>Example kanban board</Text>

        <View style={styles.actionsContainer}>
          <Button onPress={this.addNewCard} title='Add new card' />
        </View>

        <KanbanBoard
          columns={columns}
          cards={cards}
          onDragEnd={(srcColumn, destColumn, item, targetIdx) => this.onCardDragEnd(srcColumn, destColumn, item, targetIdx)}
          onCardPress={(item) => this.onCardPress(item)}
          style={styles.kanbanStyle}
        />
      </View>
    );
  }
}

export default App;

const styles = StyleSheet.create({
  container: {
    marginTop: StatusBar.currentHeight,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    marginTop: 20
  },
  kanbanStyle: {
    marginTop: 20,
    flex: 1
  }
});
