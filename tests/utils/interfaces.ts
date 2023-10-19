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

interface AcividadParametro {
    ID_OPERACION_MODIFICA_PER: '' | '4',
    ID_OPERACION_EDITAR_DIRECCION: '' | '6',
    ID_OPERACION_EDITAR_TEL: '' | '7',
    ID_OPERACION_EDITAR_EMAIL: '' | '8',
    ID_OPERACION_EDITAR_NOMBRE: '' | '24'
};

const EscenariosActividadParametrosEditarPersona: AcividadParametro[] = [
    {
        ID_OPERACION_MODIFICA_PER: '',
        ID_OPERACION_EDITAR_DIRECCION: '',
        ID_OPERACION_EDITAR_TEL: '',
        ID_OPERACION_EDITAR_EMAIL: '',
        ID_OPERACION_EDITAR_NOMBRE: ''
    },
    {
        ID_OPERACION_MODIFICA_PER: '',
        ID_OPERACION_EDITAR_DIRECCION: '6',
        ID_OPERACION_EDITAR_TEL: '7',
        ID_OPERACION_EDITAR_EMAIL: '8',
        ID_OPERACION_EDITAR_NOMBRE: '24'
    },
    {
        ID_OPERACION_MODIFICA_PER: '4',
        ID_OPERACION_EDITAR_DIRECCION: '',
        ID_OPERACION_EDITAR_TEL: '',
        ID_OPERACION_EDITAR_EMAIL: '',
        ID_OPERACION_EDITAR_NOMBRE: ''
    },
    {
        ID_OPERACION_MODIFICA_PER: '4',
        ID_OPERACION_EDITAR_DIRECCION: '6',
        ID_OPERACION_EDITAR_TEL: '7',
        ID_OPERACION_EDITAR_EMAIL: '8',
        ID_OPERACION_EDITAR_NOMBRE: '24'
    }
];

// Interfaz para Crear Cuentas
interface CrearCuentas {
    ID_OPERACION: '' | 10 | 30
};

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
};

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

// Interfaz para Eliminar Solicitudes de Creditos
interface EliminarSolicitudCredito {
    ID_OPERACION: '' | 10 | 18
};

const EscenariosEliminarSolicitudCredito: EliminarSolicitudCredito[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 10
    },
    {
        ID_OPERACION: 18
    }
];

// Interfaz para Agregar Cargos a Prestamos Desembolsados
interface AgregarCargos {
    ID_OPERACION: '' | 10 | 32
};

const EscenariosAgregarCargosPrestamoDesembolsado: AgregarCargos[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 10
    },
    {
        ID_OPERACION: 32
    },
];

// Interfaz para la Reimpresion de la Resolucion Aprobatoria
interface ReimpresionResolucionAprobatoria {
    ESTADO_DEFECTO: 'A' | 'D'
};

const EscenariosReimpresionResolucionAprobatoria: ReimpresionResolucionAprobatoria[] = [
    {
        ESTADO_DEFECTO: 'A'
    },
    {
        ESTADO_DEFECTO: 'D'
    }
];

// Interfaz para Ver el Porcentaje de Cuentas de Cobros en Solicitud de Credito
interface VerProcentajeCobros {
    VER_PORC_COBRO: 'N' | 'S'
};

const EscenariosVerProcentajeCobros: VerProcentajeCobros[] = [
    {
        VER_PORC_COBRO: 'N'
    },
    {
        VER_PORC_COBRO: 'S'
    }
];

// Interfaz para Eliminar Movimientos en Consulta Movimientos Cuentas
interface EliminarMovimiento {
    ID_OPERACION: '' | 10 | 34
}

const EscenariosEliminarMovimientos: EliminarMovimiento[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 10
    },
    {
        ID_OPERACION: 34

    }
];

export {
    EscenariosPruebaCrearPersonas,
    EscenariosPruebaEditarPersonas,
    EscenariosActividadParametrosEditarPersona,
    EscenariosPruebaCrearCuentas,
    EscenariosPruebaEditarCuentas,
    EscenariosPruebaRemoverFirmantes,
    EscenariosPruebasActivarInactivarCuentas,
    EscenariosPruebasCajaBoveda,
    EscenariosPruebasAgregarEliminarPignoracion,
    EscenariosEliminarSolicitudCredito,
    EscenariosAgregarCargosPrestamoDesembolsado,
    EscenariosReimpresionResolucionAprobatoria,
    EscenariosVerProcentajeCobros,
    EscenariosEliminarMovimientos
};
