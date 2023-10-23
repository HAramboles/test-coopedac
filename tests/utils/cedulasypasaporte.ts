// Funciones para los test de Registro de Personas

// Funcion para generar numeros de aleatorios para las cedulas
const generarNumerosAleatorios = (numTotal:number) => { 
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

// Exportar las funciones como constantes
export const numerosCedulas = generarNumerosAleatorios(11); 
export const numerosCedulas2 = generarNumerosAleatorios(11); 

export const numerosPasaporte = (generarLetrasPasaporte() + generarNumerosAleatorios(11));

export const numerosRegistroMercantil = generarNumerosAleatorios(15); // Registro Mercantil de la persona juridica

export const numerosCorreo = generarNumerosAleatorios(2); // Numeros para el correo de las personas

export const numerosCelular = ('829' + generarNumerosAleatorios(10)); // Numeros para los celulares
export const numerosTelefono = ('809' + generarNumerosAleatorios(10)); // Numeros para los telefonos

export const numerosCheques = generarNumerosAleatorios(4); // Numeros para los cheques
