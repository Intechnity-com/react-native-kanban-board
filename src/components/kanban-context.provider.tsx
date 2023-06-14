import React, { Component, ReactNode } from 'react';
import { Dimensions, EmitterSubscription } from 'react-native';
import { isTablet } from 'react-native-device-info';

import { PADDING } from '../board-consts';

export type KanbanContext = {
  deviceWidth: number;
  isLandscape: boolean;
  columnWidth: number;
  oneColumnWidth: number;
  cardWidth: number;
  noOfColumns: number;
};

function getKanbanContext(): KanbanContext {
  const screenSize = Dimensions.get('window');
  const deviceWidth = screenSize.width;
  const isLandscape = screenSize.width > screenSize.height;

  let noOfColumns = 1;
  if (isTablet()) {
    if (isLandscape) {
      noOfColumns = 3;
    } else {
      noOfColumns = 2;
    }
  } else if (isLandscape) {
    noOfColumns = 2;
  }

  const columnWidth = 0.85 * (deviceWidth / noOfColumns);
  const oneColumnWidth = deviceWidth - PADDING;
  const cardWidth = 0.85 * (deviceWidth / noOfColumns);

  const deviceInfoContext: KanbanContext = {
    deviceWidth: deviceWidth,
    isLandscape: isLandscape,
    columnWidth: columnWidth,
    oneColumnWidth: oneColumnWidth,
    cardWidth: cardWidth,
    noOfColumns: noOfColumns
  };

  return deviceInfoContext;
}

const initialDeviceInfoContext = getKanbanContext();
const DeviceInfoContext = React.createContext<KanbanContext>(initialDeviceInfoContext);

type Props = {
  children: ReactNode;
};

export class KanbanContextProvider extends Component<Props, KanbanContext> {
  state: KanbanContext = initialDeviceInfoContext;
  resizeSubscription: EmitterSubscription | null = null;

  componentDidMount() {
    this.resizeSubscription = Dimensions.addEventListener('change', this.handleOrientationChange);
  }

  componentWillUnmount() {
    this.resizeSubscription?.remove();
  }

  handleOrientationChange = () => {
    const deviceInfoContext = getKanbanContext();
    this.setState(deviceInfoContext);
  };

  render() {
    const { children } = this.props;

    return (
      <DeviceInfoContext.Provider value={this.state}>
        {children}
      </DeviceInfoContext.Provider>
    );
  }
}

export const withKanbanContext = <P extends object>(
  WrappedComponent: React.ComponentType<P & KanbanContext>
) => {
  return class extends Component<P> {
    render() {
      return (
        <DeviceInfoContext.Consumer>
          {(context) => <WrappedComponent {...this.props} {...context} />}
        </DeviceInfoContext.Consumer>
      );
    }
  };
};
