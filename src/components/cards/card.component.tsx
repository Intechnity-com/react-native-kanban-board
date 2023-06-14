import React, { Component } from 'react'
import {
  TouchableOpacity,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle
} from 'react-native';

import { CardModel } from '../../models/card-model';
import { Tags } from './tags.component';
import { KanbanContext, withKanbanContext } from '../kanban-context.provider';

export type CardExternalProps = {
  onCardPress?: (mode: CardModel) => void;
  renderCardContent?(model: CardModel): JSX.Element | null;
  cardContainerStyle?: StyleProp<ViewStyle>;
  cardTitleTextStyle?: StyleProp<TextStyle>;
  cardSubtitleTextStyle?: StyleProp<TextStyle>;
  cardContentTextStyle?: StyleProp<TextStyle>;
}

type Props = CardExternalProps &
  KanbanContext & {
    model: CardModel;
    hidden: boolean;
  };

class Card extends Component<Props> {
  onPress = () => {
    const {
      onCardPress,
      model
    } = this.props;

    if (!onCardPress) {
      return;
    }

    onCardPress(model);
  }

  render() {
    const {
      model,
      hidden,
      renderCardContent,
      cardContainerStyle,
      cardTitleTextStyle,
      cardSubtitleTextStyle,
      cardContentTextStyle
    } = this.props;

    return (
      <View style={[styles.container, cardContainerStyle, hidden && { opacity: 0 }]}>
        <TouchableOpacity
          onPress={this.onPress}>
          {renderCardContent &&
            renderCardContent(model)}

          {!renderCardContent &&
            <React.Fragment>
              <View style={styles.cardHeaderContainer}>
                <View style={styles.cardTitleContainer}>
                  <Text style={[cardTitleTextStyle, styles.cardTitleText]}>{model.title}</Text>
                </View>
                <Text style={[cardSubtitleTextStyle, styles.cardSubtitleText]}>{model.subtitle}</Text>
              </View>
              <View style={styles.cardContentContainer}>
                <Text style={[cardContentTextStyle, styles.cardContentText]}>{model.description}</Text>
              </View>
              {model.tags && model.tags.length > 0 && (
                <Tags items={model.tags} />
              )}
            </React.Fragment>}
        </TouchableOpacity>
      </View>
    )
  }
}

export default withKanbanContext(Card);

const styles = StyleSheet.create({
  container: {
    borderColor: '#E3E3E3',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    elevation: 3
  },
  cardHeaderContainer: {
    marginBottom: 16
  },
  cardTitleContainer: {
    marginBottom: 8
  },
  cardTitleText: {
    fontWeight: 'bold',
  },
  cardSubtitleText: {
  },
  cardContentContainer: {
    marginBottom: 16
  },
  cardContentText: {
    fontWeight: 'bold'
  }
});
