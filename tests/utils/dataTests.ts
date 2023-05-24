// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Costantes utilizadas con regularidad
const dataCerrar:string = '[data-icon="close"]';
const dataPrinter:string = '[data-icon="printer"]';
const dataExport:string = '[data-icon="export"]';
const dataFile:string = '[data-icon="file-text"]';
const ariaCerrar:string = '[aria-label="close"]';

// Intefaces para los tests con parametros, el ultimo numero es el correcto

// Interfaz Registro de Personas
interface CrearPersonas {
    ID_OPERACION: '' | 10 | 3 
};

// Interfaz para Editar Personas
interface EditarPersonas {
    ID_OPERACION: '' | 8 | 4
};

// Interfaz para Crear Cuentas
interface CrearCuentas {
    ID_OPERACION: '' | 10 | 30
}

// Interfaz para Editar Cuentas
interface EditarCuentas {
    ID_OPERACION: '' | 10 | 31
}

export {
    url_base,
    CrearPersonas,
    EditarPersonas,
    CrearCuentas,
    EditarCuentas,
    dataCerrar,
    dataPrinter,
    dataExport,
    dataFile,
    ariaCerrar
};

