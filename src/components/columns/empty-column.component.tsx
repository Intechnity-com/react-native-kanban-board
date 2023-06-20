import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
};

export default class EmptyColumn extends Component<Props> {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.textStyle}>{'Empty'}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100
  },
  textStyle: {
    color: '#DDDDDD',
    fontSize: 24,
    marginTop: 24,
    textAlign: 'center'
  }
});
