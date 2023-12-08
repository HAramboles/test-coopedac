// Abrir el browser en una pantalla u otra

// Variables de posicionamiento de la pantalla
const posX:string = '-1500';
const posY:string = '-100';

const browserScreenPosition = [`--window-position=${posX},${posY}`];

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
    args: browserScreenPosition,
};