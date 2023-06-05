import React, { Component } from "react";
import { StyleSheet, Text, View } from "react-native";
import i18next from "i18next";

import { colors, commonStyles, dimensions } from "@ui/theme";
import { FamulIcon } from "@ui/components/famul-icon.component";

type PropTypes = {
};

export default class EmptyColumn extends Component<PropTypes> {
    render() {
        return (
            <View style={styles.container}>
                <FamulIcon name="columns" color={colors.mutedTextColor} size={50} />
                <Text style={[commonStyles.textStyle, styles.textStyle]}>{i18next.t("dashboard.board.empty")}</Text>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 100
    },
    textStyle: {
        color: colors.mutedTextColor,
        fontSize: dimensions.fontVeryBig,
        marginTop: dimensions.marginBig,
        textAlign: "center"
    }
});