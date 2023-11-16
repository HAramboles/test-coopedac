// Abrir el browser en una pantalla u otra
const browserOneScreen = ['--window-position=100,0'];
const browserSecondScreen = ['--window-position=-1500,-100'];

// Tamaño de la pantalla
export const windowSizeLogin = {width: 1366, height: 720};
const windowSizeOneScreen = {width: 1366, height: 720};

// Configuracion del context
export const contextConfig = {
    viewport: windowSizeOneScreen,
    storageState: 'state.json'
};

// Configuracion del browser
export const browserConfig = {
    headless: false,
    args: browserSecondScreen,
};