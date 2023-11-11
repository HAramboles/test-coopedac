// Funciones para los test de Registro de Personas

// Funcion para generar numeros de aleatorios para las cedulas
export const generarNumerosAleatorios = (numTotal:number) => { 
    const aleatorios:number[] = []; // Iniciar con un array vacio
    // Generar 11 numeros
    for (let i = 0; i < numTotal; i++) { 
        let random = Math.random(); // Crear una variable que almacene la funcion random
        random = random * 9 + 1; // Los numeros generados tienen que ser dentro de un rango,
        // y se le debe sumar 1 para que tambien cuente el ultimo numero. 
        random = Math.trunc(random); // Funcion para redondear los numeros
        aleatorios[i] = random; // Cada elemento del array va a ser un numero random 
    };
    return (aleatorios.join('')); // Retornar la lista / .join('') para unir los elementos, se eliminan las comas
};

// Funcion para generar un par de letras aleatorias para el pasaporte
export const generarLetrasAleatorias = () => { 
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

// Exportar las funciones como constantes

// 006 - Persona Fisica
export const numerosCedulas = generarNumerosAleatorios(11); 
export const numerosPasaporte = (generarLetrasAleatorias() + generarNumerosAleatorios(11));
export const numerosCorreo = generarNumerosAleatorios(2); 
export const numerosCelular = ('829' + generarNumerosAleatorios(10));

// 007 - Persona Menor de Edad
export const numerosCedulas2 = generarNumerosAleatorios(11);
export const numerosTelefono = ('809' + generarNumerosAleatorios(10));
export const numerosCorreo2 = generarNumerosAleatorios(2); 

// 008 - Persona Juridica
export const numerosCedulas3 = generarNumerosAleatorios(11);
export const numerosRegistroMercantil = generarNumerosAleatorios(15);
export const numerosCorreo3 = generarNumerosAleatorios(2);
export const numerosTelefono2 = ('809' + generarNumerosAleatorios(10));
// 008 - Persona Relacionado - Registro Completo
export const numerosCedulas4 = generarNumerosAleatorios(11);
export const numerosCorreo4 = generarNumerosAleatorios(2);
export const numerosCelular2 = ('829' + generarNumerosAleatorios(10));
export const numerosCelular3 = ('829' + generarNumerosAleatorios(10));
export const numerosPasaporte2 = (generarLetrasAleatorias() + generarNumerosAleatorios(11));
// 008 - Persona Relacionado - Referencia
export const numerosCedulas5 = generarNumerosAleatorios(11);
export const numerosCelular4 = ('829' + generarNumerosAleatorios(10));

// 011 - Persona Casada
export const numerosCedulas6 = generarNumerosAleatorios(11);
export const numerosPasaporte3 = (generarLetrasAleatorias() + generarNumerosAleatorios(11));
export const numerosCorreo5 = generarNumerosAleatorios(2); 
export const numerosCelular5 = ('829' + generarNumerosAleatorios(10));
// 011 - Persona Conyugue
export const numerosCedulas7 = generarNumerosAleatorios(11);
export const numerosCorreo6 = generarNumerosAleatorios(2); 
export const numerosCelular6 = ('829' + generarNumerosAleatorios(10));

export const numerosCheques = generarNumerosAleatorios(4); // Numeros para los cheques

// Valor para la garantia hipotecaria
export const numerosMatriculaHipoteca1 = generarNumerosAleatorios(4);
export const numerosMatriculaHipoteca2 = generarNumerosAleatorios(4);

// Valores para la garantia de vehiculos
export const numerosChasis = (generarLetrasAleatorias() + generarNumerosAleatorios(4)); 
export const numerosPlaca = (generarLetrasAleatorias() + generarNumerosAleatorios(4));
