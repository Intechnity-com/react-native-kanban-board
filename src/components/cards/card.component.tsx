import React, { Component } from 'react'
import {
  TouchableOpacity,
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle
} from 'react-native';
import { CardModel } from '../../models/card-model';
import BoardThemeContext, { Theme } from '../../theme';
import { Tags } from './tags.component';

interface PropTypes {
  model: CardModel,
  onPress?: () => void,
  onPressIn?: (event: GestureResponderEvent) => void,
  hidden: boolean,
  style?: StyleProp<ViewStyle>,
  renderCardContent?(model: CardModel): JSX.Element | null;
  cardContainer?: StyleProp<ViewStyle>;
  cardTitleText?: StyleProp<TextStyle>;
  cardSubtitleText?: StyleProp<TextStyle>;
  cardContentText?: StyleProp<TextStyle>;
};

export class Card extends Component<PropTypes> {
  render() {
    const {
      model,
      onPress,
      onPressIn,
      hidden,
      renderCardContent,
      cardContainer,
      cardTitleText,
      cardSubtitleText,
      cardContentText
    } = this.props;

    return (
      <BoardThemeContext.Consumer>
        {(theme: Theme) => (
          <View style={[styles.container, cardContainer, hidden && { opacity: 0 }]}>
            <TouchableOpacity
              onPress={onPress}
              onPressIn={onPressIn}>
              {renderCardContent &&
                renderCardContent(model)}

              {!renderCardContent &&
                <React.Fragment>
                  <View style={styles.cardHeaderContainer}>
                    <View style={styles.cardTitleContainer}>
                      <Text style={[cardTitleText, styles.cardTitleText]}>{model.title}</Text>
                    </View>
                    <Text style={[cardSubtitleText, styles.cardSubtitleText]}>{model.subtitle}</Text>
                  </View>
                  <View style={styles.cardContentContainer}>
                    <Text style={[cardContentText, styles.cardContentText]}>{model.description}</Text>
                  </View>
                  {model.tags && model.tags.length > 0 && (
                    <Tags items={model.tags} />
                  )}
                </React.Fragment>}
            </TouchableOpacity>
          </View>
        )}
      </BoardThemeContext.Consumer>
    )
  }
}

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
