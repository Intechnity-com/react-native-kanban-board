import React, { Component } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';

type Props = {
  value: string | number;
  backgroundColor?: string;
  badgeStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export class Badge extends Component<Props> {
  render() {
    const { value, backgroundColor, badgeStyle, textStyle } = this.props;

    return (
      <View style={[styles.badge, badgeStyle, { backgroundColor: backgroundColor || '#000' }]}>
        <Text style={[styles.text, textStyle]}>{value}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  badge: {
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#000'
  },
  text: {
    color: '#fff',
    fontSize: 12,
  },
});
