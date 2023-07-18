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

// Interfaz para Cambiar Estado de Personas
interface CambioEstadoPersonas {
    ID_OPERACION:  "" | 1 | 25
};

const EscenariosCambioEstadoPersonas: CambioEstadoPersonas[] = [
    {
        ID_OPERACION: ""
    },
    {
        ID_OPERACION: 1
    },
    {
        ID_OPERACION: 25
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

// Interfaz para Remover Firmantes
interface RemoverFirmantes {
    ID_OPERACION: '' | 10 | 28
};

const EscenariosPruebaRemoverFirmantes: RemoverFirmantes[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 10
    },
    {
        ID_OPERACION: 28
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

// Interfaz para Agregar pignoracion a cuentas
interface AgregarPignoracion {
    ID_OPERACION: '' | 10 | 29
};

const EscenariosPruebasAgregarEliminarPignoracion: AgregarPignoracion[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 10
    },
    {
        ID_OPERACION: 29
    }
];

export {
    EscenariosPruebaCrearPersonas,
    EscenariosPruebaEditarPersonas,
    EscenariosCambioEstadoPersonas,
    EscenariosPruebaCrearCuentas,
    EscenariosPruebaEditarCuentas,
    EscenariosPruebaRemoverFirmantes,
    EscenariosPruebasActivarInactivarCuentas,
    EscenariosPruebasCajaBoveda,
    EscenariosPruebasAgregarEliminarPignoracion,
}