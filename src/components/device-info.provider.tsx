import React, { Component, ReactNode } from 'react';
import { Dimensions, EmitterSubscription } from 'react-native';
import { isTablet } from 'react-native-device-info';
import { PADDING } from 'src/board-consts';

export type DeviceInfoType = {
  deviceWidth: number;
  isLandscape: boolean;
  columnWidth: number;
  oneColumnWidth: number;
  cardWidth: number;
  noOfColumns: number;
};

function getDeviceInfoContext(): DeviceInfoType {
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

  const deviceInfoContext: DeviceInfoType = {
    deviceWidth: deviceWidth,
    isLandscape: isLandscape,
    columnWidth: columnWidth,
    oneColumnWidth: oneColumnWidth,
    cardWidth: cardWidth,
    noOfColumns: noOfColumns
  };

  return deviceInfoContext;
}

const initialDeviceInfoContext = getDeviceInfoContext();
const DeviceInfoContext = React.createContext<DeviceInfoType>(initialDeviceInfoContext);

type DeviceInfoProps = {
  children: ReactNode;
};

export class DeviceInfoProvider extends Component<DeviceInfoProps, DeviceInfoType> {
  state: DeviceInfoType = initialDeviceInfoContext;
  resizeSubscription: EmitterSubscription | null = null;

  componentDidMount() {
    this.resizeSubscription = Dimensions.addEventListener('change', this.handleOrientationChange);
  }

  componentWillUnmount() {
    this.resizeSubscription?.remove();
  }

  handleOrientationChange = () => {
    const deviceInfoContext = getDeviceInfoContext();
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

export const withDeviceInfoContext = <P extends object>(
  WrappedComponent: React.ComponentType<P & DeviceInfoType>
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

export default DeviceInfoContext;
