import { PADDING } from './board-consts';
import { getDeviceWidth, isLandscape } from './utils/device-utils';
import { isTablet } from 'react-native-device-info';

export function GET_COLUMN_WIDTH() {
    let noOfColumns = GET_NO_OF_COLUMNS();
    return 0.85 * (getDeviceWidth() / noOfColumns);
}

export function GET_ONE_COLUMN_WIDTH() {
    return getDeviceWidth() - PADDING;
}

export function GET_CARD_WIDTH() {
    let noOfColumns = GET_NO_OF_COLUMNS();
    return 0.85 * (getDeviceWidth() / noOfColumns);
}

export function GET_NO_OF_COLUMNS() {
    if (isTablet()) {
        if (isLandscape()) {
            return 3;
        } else {
            return 2;
        }
    } else {
        if (isLandscape()) {
            return 2;
        }
    }

    return 1;
}
