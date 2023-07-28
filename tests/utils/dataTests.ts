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

export const ariaCerrar:string = '[aria-label="close"]';

export const formBuscar:string = '#form_search';
export const selectBuscar:string = '#select-search';

// Para que el browser se abra en la segunda pantalla
// args: ['--window-position=-1300,100'],