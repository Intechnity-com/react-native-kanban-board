import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

type Props = {
  color: string;
  style?: StyleProp<ViewStyle>;
}

export class Dot extends React.Component<Props> {
  render() {
    return (
      <View style={[{
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: this.props.color,
      }, this.props.style]} />
    );
  }
}
