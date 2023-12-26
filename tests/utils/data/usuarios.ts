// Usuario y password para ingresar a la pagina
export const userCorrecto = process.env.REACT_APP_WEB_SERVICE_API_USER;
export const passCorrecto = process.env.REACT_APP_WEB_SERVICE_API_PASS;

// Usuario en mayusculas
export const userCorrectoUpperCase = userCorrecto?.toLocaleUpperCase();

// Usuario y password para realizar el cuadre de caja
export const userCuadreCaja = process.env.REACT_APP_WEB_SERVICE_API_USER_CUADRE_CAJA;
export const passCuadreCaja = process.env.REACT_APP_WEB_SERVICE_API_PASS_CUADRE_CAJA;

// Nombre del testigo de los firmantes
export const nombreTestigoCajero = process.env.REACT_APP_WEB_SERVICE_API_NAME_USER;

// Nombre del oficial de cuadre
export const nombreOficialCuadre:string = 'CARLOS GIL';