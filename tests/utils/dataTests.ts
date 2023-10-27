// Usuario y password para ingresar a la pagina
export const userCorrecto = process.env.REACT_APP_WEB_SERVICE_API_USER;
export const passCorrecto = process.env.REACT_APP_WEB_SERVICE_API_PASS;

// Usuario y password para realizar el cuadre de caja
export const userCuadreCaja = process.env.REACT_APP_WEB_SERVICE_API_USER_CUADRE_CAJA;
export const passCuadreCaja = process.env.REACT_APP_WEB_SERVICE_API_PASS_CUADRE_CAJA;

// URL de la pagina
export const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Nombre del testigo de los firmantes
export const nombreTestigoCajero:string = 'HECTOR ARAMBOLES';

// Nombre del oficial de cuadre
export const nombreOficialCuadre:string = 'CARLOS GIL';

// Actividades economicas de las personas
export const actividadPersonaFisica:string = 'Programación informática, consultarías y actividades relacionadas';
export const actividadJuridicayRelacionado:string = 'AGRICULTURA, GANADERÍA, CAZA Y SILVICULTURA';

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
export const formComentarios:string = '#form_COMENTARIOS';

// Diferentes id de los inputs de fecha
export const fechaInicial:string = '#form_FECHA_INICIAL';
export const fechaInicio:string = '#form_FECHA_INICIO';

export const fechaFinal:string = '#form_FECHA_FINAL';
export const fechaFin:string = '#form_FECHA_FIN';

// Tipo Transaccion de los tests de Anular
export const tipoTransaccion:string = '#form_ID_TIPO_TRANS';

export const valorAdmisibleCredito:string = '#form_VALOR_ADMISIBLE';

// Inputs para los tests de Anulacion
export const inputDiaPago:string = '#form_DIA_PAGO';
export const razonAnulacion:string = '#form_CONCEPTO_ANULACION';

// Inputs para los tests de Solicitud de Credito

// Input Fecha Solicitud y Primer Pago para los tests de Solicitud de Credito
export const inputFechaSolicitud:string = '#loan_form_FECHA_APERTURA';
export const inputPrimerPago:string = '#loan_form_DIA_PAGO';
// Fecha solicitud de prestamo
export const fechaSolicitudCredito:string = '#form_FECHA_APERTURA';
// Usuario que aprobo la solicitud
export const usuarioAproboSolicitud:string = '#form_USUARIO_APROBO';

// No hay datos en la pagina
export const noData:string = 'No data';

// Abrir el browser en una pantalla u otra
const browserOneScreen = ['--window-position=100,0'];
const browserSecondScreen = ['--window-position=-1500,-100'];

// Tamaño de la pantalla
export const windowSize = {width: 1400, height: 768};
const windowSizeOneScreen = {width: 1366, height: 720};

// Configuracion del context
export const contextConfig = {
    viewport: windowSizeOneScreen,
    storageState: 'state.json'
};

// Configuracion del browser
export const browserConfig = {
    headless: false,
    args: browserOneScreen,
};
