// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

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
    EditarCuentas
}

