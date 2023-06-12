import React, { Component, RefObject } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { COLUMN_MARGIN } from 'src/board-consts';
import { Dot } from './dot.component';
import { DeviceInfoType } from '../device-info.provider';

const INITIAL_ACTIVE_ITEM = 0;

type Props<ItemT> = {
  data: ItemT[];
  itemWidth: number;
  oneColumn: boolean;
  onScrollEndDrag: () => void;
  renderItem: (item: ItemT) => JSX.Element;
  sliderWidth: number;
  scrollEnabled: boolean;
} & DeviceInfoType;

type State = {
  activeItemIndex: number;
};

class ColumnsCarouselContainer<ItemT> extends Component<Props<ItemT>, State> {
  carouselRef: RefObject<ScrollView> = React.createRef<ScrollView>();

  constructor(props: Props<ItemT>) {
    super(props);

    this.state = {
      activeItemIndex: INITIAL_ACTIVE_ITEM,
    };
  }

  componentDidMount() {
    this.scrollToItem(this.state.activeItemIndex);
  }

  componentDidUpdate(prevProps: Props<ItemT>) {
    if (prevProps.itemWidth !== this.props.itemWidth || prevProps.sliderWidth !== this.props.sliderWidth) {
      this.scrollToItem(this.state.activeItemIndex);
    }
  }

  get currentItemIndex() {
    return this.state.activeItemIndex;
  }

  get currentItem(): ItemT | undefined {
    return this.props.data[this.currentItemIndex];
  }

  onScrollEndDrag = () => {
    const { onScrollEndDrag } = this.props;
    onScrollEndDrag && onScrollEndDrag();
  };

  onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const { itemWidth } = this.props;
    const activeItemIndex = Math.round(offsetX / itemWidth);
    this.setState({ activeItemIndex });
    this.scrollToItem(activeItemIndex);
    this.onScrollEndDrag();
  };

  scrollToItem(index: number) {
    const { itemWidth } = this.props;
    const offset = index * itemWidth;
    this.carouselRef.current?.scrollTo({ x: offset, y: 0, animated: true });
  }

  snapToPrev = () => {
    const { activeItemIndex } = this.state;
    if (activeItemIndex > 0) {
      this.scrollToItem(activeItemIndex - 1);
    }
  };

  snapToNext = () => {
    const { activeItemIndex } = this.state;
    const { data } = this.props;
    if (activeItemIndex < data.length - 1) {
      this.scrollToItem(activeItemIndex + 1);
    }
  };

  getIndex(item: ItemT) {
    return this.props.data.indexOf(item);
  }

  render() {
    const { data, oneColumn, scrollEnabled, sliderWidth } = this.props;
    const { activeItemIndex } = this.state;

    return (
      <View style={styles.container}>
        <ScrollView
          ref={this.carouselRef}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          overScrollMode="never"
          automaticallyAdjustContentInsets={true}
          directionalLockEnabled={true}
          pinchGestureEnabled={false}
          scrollsToTop={false}
          renderToHardwareTextureAndroid={true}
          scrollEnabled={scrollEnabled && !oneColumn}
          style={[styles.scrollContainer, { width: sliderWidth }]}
          contentContainerStyle={[styles.contentContainer, { paddingLeft: COLUMN_MARGIN }]}
          horizontal={true}
          scrollEventThrottle={16}
          snapToInterval={this.props.itemWidth + COLUMN_MARGIN}
          onMomentumScrollEnd={this.onMomentumScrollEnd}>
          {data.map((item, index) => (
            <View key={`carousel-item-${index}`} style={{ width: this.props.itemWidth, marginRight: COLUMN_MARGIN }}>
              {this.props.renderItem(item)}
            </View>
          ))}
        </ScrollView>

        <View style={styles.positionIndicatorContainer}>
          {data.map((_, index) => (
            <Dot
              key={`carousel-pos-indicator-${index}`}
              color={activeItemIndex === index ? '#000000' : '#DDDDDD'}
              style={styles.positionIndicator}
            />
          ))}
        </View>
      </View>
    );
  }
}

export default ColumnsCarouselContainer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexDirection: 'row',
  },
  contentContainer: {
    paddingVertical: 8,
  },
  positionIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 20,
  },
  positionIndicator: {
    marginHorizontal: 8,
  },
});
