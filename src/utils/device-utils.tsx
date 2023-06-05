import { Dimensions } from 'react-native';

export function isLandscape() {
  var screenSize = Dimensions.get('window');
  return screenSize.width > screenSize.height;
}

export function getDeviceWidth() {
  return Dimensions.get('window').width;
}
