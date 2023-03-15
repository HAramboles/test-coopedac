// Funcion para generar numeros de aleatorios, tanto para la cedula como para el pasaporte
const generarNumerosAleatorios = () => { 
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

export const numerosAleatorios = generarNumerosAleatorios(); // Cedula para la persona fisica
export const numerosAleatorios2 = generarNumerosAleatorios(); // Cedula para la persona juridica
export const numerosAleatorios3 = generarNumerosAleatorios(); // Cedula para el relacionado de la persona juridica
export const numerosAleatorios4 = generarNumerosAleatorios(); // Cedula para el menor de edad