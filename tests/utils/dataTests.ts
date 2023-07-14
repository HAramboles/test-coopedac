// Usuario y password para ingresar a la pagina
const userCorrecto = process.env.REACT_APP_WEB_SERVICE_API_USER;
const passCorrecto = process.env.REACT_APP_WEB_SERVICE_API_PASS;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Costantes utilizadas con regularidad
const dataCerrar:string = '[data-icon="close"]';
const dataPrinter:string = '[data-icon="printer"]';
const dataExport:string = '[data-icon="export"]';
const dataFile:string = '[data-icon="file-text"]';

const ariaCerrar:string = '[aria-label="close"]';

const formBuscar:string = '#form_search';
const selectBuscar:string = '#select-search';

// Intefaces para los tests con parametros, el ultimo numero es el correcto

// Interfaz Registro de Personas
interface CrearPersonas {
    ID_OPERACION: '' | 10 | 3 
};

const EscenariosPruebaCrearPersonas: CrearPersonas[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 10
    },
    {
        ID_OPERACION: 3
    }
];

// Interfaz para Editar Personas
interface EditarPersonas {
    ID_OPERACION: '' | 8 | 4
};

const EscenariosPruebaEditarPersonas: EditarPersonas[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 8
    },
    {
        ID_OPERACION: 4
    }
];

// Interfaz para Crear Cuentas
interface CrearCuentas {
    ID_OPERACION: '' | 10 | 30
}

const EscenariosPruebaCrearCuentas: CrearCuentas[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 10
    }, 
    {
        ID_OPERACION: 30
    }
];

// Interfaz para Editar Cuentas
interface EditarCuentas {
    ID_OPERACION: '' | 10 | 31
}

const EscenariosPruebaEditarCuentas: EditarCuentas[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 10
    },
    {
        ID_OPERACION: 31
    }
];

// Interfaz para Activar e Inactivar Cuentas
interface ActivarInactivarCuentas {
    ID_OPERACION: '' | 15 | 23
};

const EscenariosPruebasActivarInactivarCuentas: ActivarInactivarCuentas[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 15
    },
    {
        ID_OPERACION: 23
    }
];

// Interfaz para cuando la Caja sea Boveda o Caja, si es boveda no debe poder transacciones de ningun tipo
interface CajaBoveda {
    ES_BOVEDA: '1' | '0'
};

const EscenariosPruebasCajaBoveda: CajaBoveda[] = [
    {
        ES_BOVEDA: '1' // Permite hacer transacciones
    }, 
    {
        ES_BOVEDA: '0' // No permite hacer transacciones
    }
];

// Interfaz para Agregar Cargos a Prestamos Desembolsados
interface AgregarCargos {
    ID_OPERACION: '' | 10 | 32
}

export {
    userCorrecto,
    passCorrecto,
    url_base,
    dataCerrar,
    dataPrinter,
    dataExport,
    dataFile,
    ariaCerrar,
    formBuscar,
    selectBuscar,
    AgregarCargos,
    EscenariosPruebaCrearPersonas,
    EscenariosPruebaEditarPersonas,
    EscenariosPruebaCrearCuentas,
    EscenariosPruebaEditarCuentas,
    EscenariosPruebasActivarInactivarCuentas,
    EscenariosPruebasCajaBoveda
};

