import { createContext } from 'react';

export interface Theme {
}

const defaultTheme: Theme = {
};

const BoardThemeContext = createContext<Theme>(defaultTheme);

export default BoardThemeContext;
