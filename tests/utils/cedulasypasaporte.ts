// Funciones para los test de Registro de Personas

// Funcion para generar numeros de aleatorios para las cedulas
const generarCedulas = () => { 
    const aleatorios:number[] = []; // Iniciar con un array vacio
    // Generar 11 numeros
    for (let i = 0; i < 11; i++) { 
        let random = Math.random(); // Crear una variable que almacene la funcion random
        random = random * 9 + 1; // Los numeros generados tienen que ser dentro de un rango,
        // y se le debe sumar 1 para que tambien cuente el ultimo numero. 
        random = Math.trunc(random); // Funcion para redondear los numeros
        aleatorios[i] = random; // Cada elemento del array va a ser un numero random 
    };
    return (aleatorios.join('')); // Retornar la lista / .join('') para unir los elementos, se eliminan las comas
};

// Funcion para generar 11 numeros aleatorios para el pasaporte 
const generarNumerosPasaporte = () => { 
    const aleatorios:number[] = []; 
    for (let i = 0; i < 11; i++) { 
        let random = Math.random(); 
        random = random * 9 + 1;  
        random = Math.trunc(random); 
        aleatorios[i] = random;  
    };
    return (aleatorios.join('')); 
};

// Funcion para generar un par de letras aleatorias para el pasaporte
const generarLetrasPasaporte = () => { 
    let pasaporte:string = ''; // Variable vacia para almacenar las letras
    const letras:string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Constante con las letras a tomar
    // Generar 2 letras aleatorias
    for (let i = 0; i < 2; i++) { 
        let random = Math.random(); // Crear una variable que almacene la funcion random
        pasaporte += letras.charAt(random * letras.length); /* chartAt = Devuelve el caracter de una ceda correspondiente a la posicion,
        con la funcion random se ordenan aleatoriamente los caracteres y devuelve los primeros dos caracteres de la nueva cadena */
    };
    return pasaporte; // Retornar la variable con las dos letras
};

// Funcion para generar 15 numeros aleatorios para el registro mercantil de la persona juridica
const generarRegistroMercantil = () => { 
    const aleatorios:number[] = []; 
    for (let i = 0; i < 15; i++) { 
        let random = Math.random(); 
        random = random * 9 + 1;  
        random = Math.trunc(random); 
        aleatorios[i] = random;  
    };
    return (aleatorios.join('')); 
};

// Funcion para generar 2 numeros aleatorios para colocarlos en el correo de las personas
const generarNumerosparaCorreo = () => { 
    const aleatorios:number[] = []; 
    for (let i = 0; i < 2; i++) { 
        let random = Math.random(); 
        random = random * 9 + 1; 
        random = Math.trunc(random);
        aleatorios[i] = random; 
    };
    return (aleatorios.join('')); 
};

// Funcion para generar 10 numeros aleatorios para los numeros de telefono celulares
const generarNumerosCelularTelefono = () => { 
    const aleatorios:number[] = []; 
    for (let i = 0; i < 7; i++) { 
        let random = Math.random(); 
        random = random * 9 + 1; 
        random = Math.trunc(random); 
        aleatorios[i] = random; 
    };
    return (aleatorios.join('')); 
};

// Exportar las funciones como constantes

const numerosCedulas = generarCedulas(); // Cedula para la persona fisica
const numerosCedulas2 = generarCedulas(); // Cedula para la persona juridica
const numerosCedulas3 = generarCedulas(); // Cedula para el relacionado de la persona juridica
const numerosCedulas4 = generarCedulas(); // Cedula para el menor de edad

const numerosPasaporte = (generarLetrasPasaporte() + generarNumerosPasaporte()); // Pasaporte para la persona fisica

const numerosRegistroMercantil = generarRegistroMercantil(); // Registro Mercantil de la persona juridica

const numerosCorreo = generarNumerosparaCorreo(); // Numeros para el correo de las personas

const numerosCelular = ('829' + generarNumerosCelularTelefono()); // Numeros para los celulares
const numerosTelefono = ('809' + generarNumerosCelularTelefono()); // Numeros para los telefonos

export {
    numerosCedulas,
    numerosCedulas2,
    numerosCedulas3,
    numerosCedulas4,
    numerosPasaporte,
    numerosRegistroMercantil,
    numerosCorreo,
    numerosCelular,
    numerosTelefono
};
