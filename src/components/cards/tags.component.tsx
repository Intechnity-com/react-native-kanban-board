import React, { Component } from 'react';
import { FlatList, StyleSheet, Text, View, StyleProp, ViewStyle, TextStyle } from 'react-native';

import { Tag } from '../../models/tag';

type Props = {
  items: Tag[];
  swiperContainerStyle?: StyleProp<ViewStyle>;
  listItemStyle?: StyleProp<ViewStyle>;
  tagTextStyle?: StyleProp<TextStyle>;
}

export class Tags extends Component<Props> {
  render() {
    const { swiperContainerStyle, listItemStyle, tagTextStyle } = this.props;

    return (
      <View style={[styles.swiperContainer, swiperContainerStyle]}>
        <FlatList
          horizontal={true}
          keyExtractor={(item) => item.text}
          data={this.props.items}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.listItem, { backgroundColor: item.backgroundColor }, listItemStyle]}>
              <Text
                style={[styles.tagText, { color: item.textColor }, tagTextStyle]}>{item.text}</Text>
            </View>
          )} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  swiperContainer: {
  },
  listItem: {
    paddingHorizontal: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1
  },
  tagText: {
    fontSize: 8
  }
});
