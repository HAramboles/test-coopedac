import { nombresMasculinos } from '../persons/nombresMasculinos';
import { nombresFemeninos } from '../persons/nombresFemeninos';
import { apellidosPersonas } from '../persons/apellidos';

// Funciones para generar nombres y apellidos aleatorios

export const generarApellidos = ():string => { // Nombres apellidos
    const apellidos = apellidosPersonas;
    const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
    return `${apellido}`;
};

export const generarNombresMasculinos = ():string => { // Nombres masculinos
    const nombres = nombresMasculinos;
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    return `${nombre}`;
};

export const generarNombresFemeninos = ():string => { // Nombres femeninos
    const nombres = nombresFemeninos;
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    return `${nombre}`;
};

export const generarNombresEmpresas = ():string => { // Nombres para empresas
    const tipoEmpresa = ['AGRONOMOS', 'AGRICULTORES', 'COORPORACION', 'COMERCIAL', 'CAMPOS'];
    const nombre = tipoEmpresa[Math.floor(Math.random() * tipoEmpresa.length)];
    return `${nombre}`;
};