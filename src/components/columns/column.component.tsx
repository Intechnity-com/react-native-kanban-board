import React from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, View, ViewToken } from "react-native";
import { Badge } from "react-native-elements";
import { connect } from "react-redux";
import { AnyAction } from "redux";

import { BoardState } from "@ui/components/kanban-board/actions/reducers";
import { BoardDispatch } from "@ui/components/kanban-board/actions/types";
import { CardModel } from "@domain/models/kanban-board-models/card-model";
import { ColumnModel } from "@domain/models/kanban-board-models/column-model";
import { GET_COLUMN_WIDTH, GET_ONE_COLUMN_WIDTH } from "@ui/components/kanban-board/board-config";
import { BoardManager } from "@ui/components/kanban-board/actions/board-manager";

import EmptyColumn from "./empty-column.component";
import { colors, dimensions, textStyles } from "@ui/theme";

const mapStateToProps = (state: BoardState) => ({
    board: state
});

const mapDispatchToProps = (dispatch: BoardDispatch<AnyAction>) => ({
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        column: ColumnModel;
        renderCardItem: (item: CardModel) => JSX.Element;
        isWithCountBadge: boolean;
        movingMode: boolean;
        oneColumn: boolean;
        onScrollingStarted: () => void;
        onScrollingEnded: () => void;
    }

type State = {
}

class Column extends React.Component<Props, State> {
    scrollingDown: boolean;
    flatList: FlatList<CardModel> | null = null;
    viewabilityConfig: any;
    viewabilityConfigCallbackPairs: any;

    constructor(props) {
        super(props);
        this.scrollingDown = false;

        this.viewabilityConfig = {
            itemVisiblePercentThreshold: 1,
            waitForInteraction: false
        };
        this.handleChangeVisibleItems = this.handleChangeVisibleItems.bind(this);
    }

    setRefColumn(ref: View | null) {
        this.props.column.setRef(ref);
    }

    measureColumn() {
        this.props.column.measure();
    }

    scrollToOffset(offset: number) {
        this.flatList?.scrollToOffset({ animated: true, offset });
    }

    handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
        const {
            column,
            onScrollingStarted
        } = this.props;

        onScrollingStarted();

        const liveOffset = event.nativeEvent.contentOffset.y;
        this.scrollingDown = liveOffset > column.scrollOffset;
    }

    endScrolling(event) {
        const {
            column,
            onScrollingEnded,
        } = this.props;

        const currentOffset = event.nativeEvent.contentOffset.y;
        const scrollingDownEnded = this.scrollingDown && currentOffset >= column.scrollOffset;
        const scrollingUpEnded = !this.scrollingDown && currentOffset <= column.scrollOffset;

        if (scrollingDownEnded || scrollingUpEnded) {
            column.setScrollOffset(currentOffset);
            BoardManager.updateColumnsLayoutAfterVisibilityChanged(this.props.board);
            onScrollingEnded();
        }
    }

    onScrollEndDrag(event) {
        this.endScrolling(event);
    }

    onMomentumScrollEnd(event) {
        const { onScrollingEnded } = this.props;

        this.endScrolling(event);
        onScrollingEnded();
    }

    onContentSizeChange(_, contentHeight) {
        const { column } = this.props;
        column.setContentHeight(contentHeight);
    }

    handleChangeVisibleItems(info: { viewableItems: Array<ViewToken>; changed: Array<ViewToken> }) {
        const { column } = this.props;
        let visibleItems = info.viewableItems.map(x => x.item);
        BoardManager.updateItemsVisibility(this.props.board, column, visibleItems);
    }

    render() {
        const {
            column,
            renderCardItem,
            isWithCountBadge,
            oneColumn,
            movingMode,
            board
        } = this.props;

        const items = board.columnCardsMap.has(column.id) ? board.columnCardsMap.get(column.id)! : [];
        const noOfItems = items.length;

        let columnContent;
        if (noOfItems > 0) {
            columnContent = (
                <FlatList
                    data={items}
                    ref={ref => this.flatList = ref}
                    onScroll={event => this.handleScroll(event)}
                    scrollEventThrottle={0}
                    onMomentumScrollEnd={event => this.onMomentumScrollEnd(event)}
                    onScrollEndDrag={event => this.onScrollEndDrag(event)}
                    onViewableItemsChanged={this.handleChangeVisibleItems}
                    viewabilityConfig={this.viewabilityConfig}
                    renderItem={item => (
                        <View key={item.item.id}
                            ref={ref => item.item.setRef(ref)}
                            onLayout={event => item.item.measure(undefined)}>
                            {renderCardItem(item.item)}
                        </View>
                    )}
                    keyExtractor={item => item.id ?? ""}
                    scrollEnabled={!movingMode}
                    onContentSizeChange={(w: number, h: number) => this.onContentSizeChange(w, h)}
                    showsVerticalScrollIndicator={false}
                />
            );
        } else {
            columnContent = (
                <EmptyColumn />
            );
        }

        return (
            <View
                ref={ref => this.setRefColumn(ref)}
                onLayout={() => this.measureColumn()}
                style={[
                    styles.columnContainer, {
                        width: oneColumn ? GET_ONE_COLUMN_WIDTH() : GET_COLUMN_WIDTH(),
                        marginRight: oneColumn ? 0 : dimensions.paddingSmall
                    }]}>
                <View style={styles.columnHeaderContainer}>
                    <Text style={styles.columnHeaderTitle}>{column.title}</Text>
                    {isWithCountBadge &&
                        <View style={styles.columnHeaderRightContainer}>
                            <Badge value={noOfItems} badgeStyle={{backgroundColor: colors.primaryDarkColor}} />
                        </View>
                    }
                </View>

                {columnContent}
            </View>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(Column)

const styles = StyleSheet.create({
    columnContainer: {
        backgroundColor: colors.white,
        borderRadius: dimensions.borderRadiusSmall,
        padding: dimensions.paddingSmall
    },
    columnHeaderContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: dimensions.marginBig
    },
    columnHeaderTitle: {
        ...textStyles.boldText,
        fontSize: dimensions.fontVeryBig
    },
    columnHeaderRightContainer: {
    },
});