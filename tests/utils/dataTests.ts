// Usuario y password para ingresar a la pagina
export const userCorrecto = process.env.REACT_APP_WEB_SERVICE_API_USER;
export const passCorrecto = process.env.REACT_APP_WEB_SERVICE_API_PASS;

// URL de la pagina
export const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Costantes utilizadas con regularidad
export const dataCerrar:string = '[data-icon="close"]';
export const dataPrinter:string = '[data-icon="printer"]';
export const dataExport:string = '[data-icon="export"]';
export const dataFile:string = '[data-icon="file-text"]';
export const dataGuardar:string = '[data-icon="save"]';

export const ariaCerrar:string = '[aria-label="close"]';

export const formBuscar:string = '#form_search';
export const selectBuscar:string = '#select-search';

// Abrir el browser en una pantalla u otra
const browserOneScreen = ['--window-position=0,0'];
const browserSecondScreen = ['--window-position=-1300,100'];

// Configuracion del browser
export const browserConfig = {
    headless: false,
    args: browserOneScreen,
}