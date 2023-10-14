// Usuario y password para ingresar a la pagina
export const userCorrecto = process.env.REACT_APP_WEB_SERVICE_API_USER;
export const passCorrecto = process.env.REACT_APP_WEB_SERVICE_API_PASS;

// Usuario y password para realizar el cuadre de caja
export const userCuadreCaja = process.env.REACT_APP_WEB_SERVICE_API_USER_CUADRE_CAJA;
export const passCuadreCaja = process.env.REACT_APP_WEB_SERVICE_API_PASS_CUADRE_CAJA;

// URL de la pagina
export const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Nombre del testigo de los firmantes
export const nombreTestigo:string = 'HECTOR ARAMBOLES';

// Nombre del oficial de cuadre
export const nombreOficialCuadre:string = 'CARLOS GIL';

// Costantes utilizadas con regularidad
export const dataCerrar:string = '[data-icon="close"]';
export const dataPrinter:string = '[data-icon="printer"]';
export const dataExport:string = '[data-icon="export"]';
export const dataFile:string = '[data-icon="file-text"]';
export const dataGuardar:string = '[data-icon="save"]';
export const dataCheck:string = '[data-icon="check-circle"]';
export const dataVer:string = '[data-icon="eye"]';
export const dataEliminar:string = '[data-icon="delete"]';
export const dataEdit:string = '[data-icon="edit"]';

export const ariaCerrar:string = '[aria-label="close"]';
export const ariaCancelar:string = '[aria-label="stop"]';
export const ariaAgregar:string = '[aria-label="plus"]';

export const formBuscar:string = '#form_search';
export const selectBuscar:string = '#select-search';
export const formComentario:string = '#form_COMENTARIO';   

export const fechaInicio = '#form_FECHA_INICIAL';
export const fechaFinal = '#form_FECHA_FINAL';

// Input Dia de pago para tests de Cobros de Oficina
export const inputDiaPago:string = '#form_DIA_PAGO';

// Input Fecha Solicitud y Primer Pago para los tests de Solcitud de Credito
export const inputFechaSolicitud:string = '#loan_form_FECHA_APERTURA';
export const inputPrimerPago:string = '#loan_form_DIA_PAGO';

// Abrir el browser en una pantalla u otra
const browserOneScreen = ['--window-position=100,0'];
const browserSecondScreen = ['--window-position=-1500,-100'];

// Configuracion del context
export const windowSize = {width: 1400, height: 768};
export const contextConfig = {
    viewport: windowSize,
    storageState: 'state.json'
};

// Configuracion del browser
export const browserConfig = {
    headless: false,
    args: browserSecondScreen,
};
