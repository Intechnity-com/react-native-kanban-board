import { Dimensions, Platform } from 'react-native';

export function isTablet(): boolean {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = height / width;

  if (Platform.OS === 'ios') {
    const tabletAspectRatio = 1.6;
    return aspectRatio < tabletAspectRatio;
  } else {
    const smallestDimension = Math.min(width, height);
    const tabletSmallestDimension = 600;
    return smallestDimension >= tabletSmallestDimension;
  }
};
