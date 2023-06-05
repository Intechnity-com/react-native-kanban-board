import React, { Component } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Tag } from "../../models/tag";

export interface PropTypes {
    items: Tag[]
}

export class Tags extends Component<PropTypes> {
    render() {
        return (
            <View style={styles.swiperContainer}>
                <FlatList horizontal={true}
                    keyExtractor={(item) => item.text}
                    data={this.props.items}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={[styles.listItem, { backgroundColor: item.backgroundColor, borderColor: item.backgroundColor }]}>
                            <Text
                                style={[styles.tagText, { color: item.textColor }]}>{item.text}</Text>
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
        paddingHorizontal: dimensions.paddingSmall,
        marginRight: dimensions.marginSmall,
        borderRadius: dimensions.borderRadiusSmall,
        backgroundColor: colors.white,
        borderWidth: 1
    },
    tagText: {
        ...commonStyles.textStyle,
        fontSize: dimensions.fontSmall
    }
});
