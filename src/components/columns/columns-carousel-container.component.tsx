import React, { Component } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { COLUMN_MARGIN } from 'src/board-consts';
import { getDeviceWidth } from 'src/utils/device-utils';
import { Dot } from './dot.component';

const INITIAL_ACTIVE_ITEM = 0;
const SNAP_MARGIN = 100;

type Props<ItemT> = {
  data: ItemT[],
  itemWidth: number,
  oneColumn: boolean,
  onScrollEndDrag: () => void,
  renderItem: (item: ItemT) => JSX.Element,
  sliderWidth: number,
  scrollEnabled: boolean
}

type State = {
  activeItemIndex: number;
}

class ColumnsCarouselContainer<ItemT> extends Component<Props<ItemT>, State> {
  previousActiveItem: number;
  previousFirstItem: number;
  previousItemsLength: number;
  mounted: boolean;
  positions: { start: number, end: number }[]
  currentContentOffset: number;
  scrollOffsetRef: any;
  carouselRef: any;
  onLayoutInitDone: boolean;
  itemToSnapTo: number;
  scrollStartOffset: number;
  scrollEndOffset: number;
  scrollStartActive: number;
  scrollEndActive: number;

  constructor(props: Props<ItemT>) {
    super(props)

    this.state = {
      activeItemIndex: INITIAL_ACTIVE_ITEM
    };

    this.previousActiveItem = INITIAL_ACTIVE_ITEM;
    this.previousFirstItem = INITIAL_ACTIVE_ITEM;
    this.previousItemsLength = INITIAL_ACTIVE_ITEM;
    this.mounted = false;
    this.positions = [];
    this.currentContentOffset = 0;
    this.scrollOffsetRef = null;
    this.carouselRef = null;
    this.onLayoutInitDone = false;
    this.itemToSnapTo = 0;
    this.scrollStartOffset = 0;
    this.scrollEndOffset = 0;
    this.scrollStartActive = 0;
    this.scrollEndActive = 0;
  }

  get currentItemIndex() {
    return this.state.activeItemIndex;
  }

  get currentItem(): ItemT | undefined {
    return this.props.data[this.currentItemIndex];
  }

  componentDidMount() {
    this.mounted = true;
    this.setState({ activeItemIndex: 0 });

    this.initPositions(this.props);
  }

  UNSAFE_componentWillUpdate(nextProps: Props<ItemT>) {
    this.initPositions(nextProps);
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  initPositions(props = this.props) {
    const {
      data,
      itemWidth
    } = props;

    if (!data || !data.length) {
      return;
    }

    this.positions = [];

    const firstItemMargin = 0
    data.forEach((_itemData, index) => {
      this.positions[index] = {
        start: firstItemMargin + index * itemWidth + (index * COLUMN_MARGIN),
        end: index * itemWidth + itemWidth + (index * COLUMN_MARGIN)
      }
    });
  }

  getCustomDataLength(props = this.props) {
    const { data } = props;
    const dataLength = data && data.length;

    if (!dataLength) {
      return 0;
    }

    return dataLength;
  }

  getScrollOffset(event: NativeSyntheticEvent<NativeScrollEvent>) {
    return (event && event.nativeEvent && event.nativeEvent.contentOffset && event.nativeEvent.contentOffset.x) || 0;
  }

  getCenter(offset: number) {
    const {
      itemWidth,
      sliderWidth
    } = this.props;

    return offset + sliderWidth / 2 - (sliderWidth - itemWidth) / 2;
  }

  getActiveItemIndex(offset: number) {
    const center = this.getCenter(offset);
    const centerOffset = 20;

    for (let i = 0; i < this.positions.length; i += 1) {
      const { start, end } = this.positions[i]!;
      if (center + centerOffset >= start && center - centerOffset <= end) {
        return i;
      }
    }

    const lastIndex = this.positions.length - 1
    if (this.positions[lastIndex] && center - centerOffset > this.positions[lastIndex]!.end) {
      return lastIndex;
    }

    return 0;
  }

  onScrollBeginDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.scrollStartOffset = this.getScrollOffset(event);
    this.scrollStartActive = this.getActiveItemIndex(this.scrollStartOffset);
  }

  onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { onScrollEndDrag } = this.props;

    if (this.carouselRef) {
      const scrollOffset = this.getScrollOffset(event);
      const nextActiveItem = this.getActiveItemIndex(scrollOffset);

      const itemReached = nextActiveItem === this.itemToSnapTo;
      const scrollConditions = scrollOffset >= this.scrollOffsetRef && scrollOffset <= this.scrollOffsetRef;

      this.currentContentOffset = scrollOffset;

      if (this.state.activeItemIndex !== nextActiveItem && itemReached) {
        if (scrollConditions) {
          this.setState({ activeItemIndex: nextActiveItem });
        }
      }

      this.onScrollEnd();
    }

    return onScrollEndDrag && onScrollEndDrag();
  }

  onScrollEnd() {
    this.scrollEndOffset = this.currentContentOffset;
    this.scrollEndActive = this.getActiveItemIndex(this.scrollEndOffset);

    this.snapScroll(this.scrollEndOffset - this.scrollStartOffset);
  }

  onLayout = () => {
    if (this.onLayoutInitDone) {
      this.initPositions();
      this.snapToItem(this.state.activeItemIndex);
    } else {
      this.onLayoutInitDone = true;
    }
  }

  snapToNext() {
    const { onScrollEndDrag } = this.props;
    const itemsLength = this.getCustomDataLength();

    const newIndex = this.state.activeItemIndex + 1;
    if (newIndex > itemsLength - 1) {
      return;
    }

    this.snapToItem(newIndex)
    onScrollEndDrag();
  }

  snapToPrev() {
    const { onScrollEndDrag } = this.props;
    const newIndex = this.state.activeItemIndex - 1;
    if (newIndex < 0) {
      return;
    }

    this.snapToItem(newIndex)
    onScrollEndDrag();
  }

  snapScroll(delta: number) {
    const { itemWidth } = this.props;
    const itemsLength = this.getCustomDataLength();

    if (!this.scrollEndActive && this.scrollEndActive !== 0) {
      this.scrollEndActive = this.scrollStartActive;
    }

    if (this.scrollStartActive !== this.scrollEndActive) {
      this.snapToItem(this.scrollEndActive);
    } else if (delta > 0 && delta > SNAP_MARGIN) {
      let nextIndex = Math.min(itemsLength - 1, this.scrollStartActive + Math.ceil(delta / itemWidth));
      this.snapToItem(nextIndex);
    } else if (delta < 0 && delta < -SNAP_MARGIN) {
      let previousIndex = Math.max(0, this.scrollStartActive + Math.floor(delta / itemWidth));
      this.snapToItem(previousIndex);
    } else {
      this.snapToItem(this.scrollEndActive);
    }
  }

  snapToItem(index: number) {
    const { itemWidth } = this.props;
    this.setState({ activeItemIndex: index });

    if (index !== this.previousActiveItem) {
      this.previousActiveItem = index;
    }

    this.itemToSnapTo = index;
    this.scrollOffsetRef = this.positions[index]
      && this.positions[index]!.start - ((getDeviceWidth() - itemWidth) / 2) + COLUMN_MARGIN;

    if (!this.scrollOffsetRef && this.scrollOffsetRef !== 0) {
      return;
    }

    this.currentContentOffset = this.scrollOffsetRef < 0 ? 0 : this.scrollOffsetRef;
    this.scrollTo(this.scrollOffsetRef);
  }

  scrollTo(offset: number) {
    const wrappedRef = this.carouselRef;
    if (!wrappedRef) {
      return;
    }

    wrappedRef.scrollTo({ x: offset, y: 0, animated: true });
  }

  getIndex(item: ItemT) {
    return this.props.data.indexOf(item);
  }

  render() {
    const {
      data,
      oneColumn,
      scrollEnabled,
      sliderWidth
    } = this.props;

    const currentIndex = this.state.activeItemIndex;

    return (
      <View style={styles.container}>
        <View style={styles.scrollWrapper}>
          <ScrollView
            ref={c => this.carouselRef = c}
            decelerationRate='fast'
            showsHorizontalScrollIndicator={false}
            overScrollMode='never'
            automaticallyAdjustContentInsets={true}
            directionalLockEnabled={true}
            pinchGestureEnabled={false}
            scrollsToTop={false}
            renderToHardwareTextureAndroid={true}
            scrollEnabled={scrollEnabled && !oneColumn}
            style={[styles.scrollContainer, { width: sliderWidth }]}
            contentContainerStyle={[styles.contentContainer, { paddingLeft: COLUMN_MARGIN }]}
            horizontal={true}
            scrollEventThrottle={1}
            onScrollBeginDrag={this.onScrollBeginDrag}
            onMomentumScrollEnd={this.onScrollEndDrag}
            onLayout={this.onLayout}>
            {data.map((item, _index) => this.props.renderItem(item))}
          </ScrollView>
        </View>

        <View style={styles.positionIndicatorContainer}>
          {this.props.data.map((_, index) => {
            let isVisible = currentIndex == index;
            return (
              <Dot
                key={'caoursel-pos-indicator-' + index.toString()}
                color={isVisible ? '#000000' : '#DDDDDD'}
                style={styles.positionIndicator}
              />
            );
          })}
        </View>
      </View>
    )
  }
}

export default ColumnsCarouselContainer;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollWrapper: {
    flex: 1
  },
  scrollContainer: {
    flexDirection: 'row'
  },
  contentContainer: {
    paddingVertical: 8
  },
  positionIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 20
  },
  positionIndicator: {
    marginHorizontal: 8
  }
});
