import { Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { formBuscar, dataVer, noData, selectBuscar, dataCheck, dataEdit, dataEliminar } from './utils/data/inputsButtons';
import { url_base, url_registro_persona } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Inputs

// Paso 1
let inputCodigo: Locator;
let inputCedula:Locator;
let inputCategoriaActual:Locator;
let inputPasaporte:Locator;
let inputNombre:Locator;
let inputApellido:Locator;
let inputApodo:Locator;
let inputFechaNacimiento:Locator;
let inputLugarNacimiento:Locator;
let inputNumeroDependientes:Locator;

// Paso 2
let inputLugarTrabajo:Locator;
let inputEmailEmpresa:Locator;
let inputTelefonoEmpresa:Locator;
let inputDireccionEmpresa:Locator;
let inputPosicionEmpresa:Locator;
let inputFechaIngresoEmpresa:Locator;
let inputOtraActividad:Locator;
let inputJefeInmediato:Locator;
let inputIngresoPromedio:Locator;
let inputOtrosIngresos:Locator;
let inputJustificacionIngresos:Locator;

// Paso 3
let inputOrigenRecursos:Locator;
let inputProposito:Locator;

// Pruebas
test.describe.serial('Pruebas Consultando una Persona', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);
    
        // Crear el context
        context = await browser.newContext(contextConfig);
    
        // Crear la page
        page = await context.newPage();
    
        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    
        // Cedula, nombre y apellido de la persona alamacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Inputs del paso 1
        inputCodigo = page.locator('#person_ID_PERSONA');
        inputCedula = page.locator('#person_DOCUMENTO_IDENTIDAD');
        inputCategoriaActual = page.locator('#person_DESC_CATEGORIA');
        inputPasaporte = page.locator('#person_NO_PASAPORTE');
        inputNombre = page.locator('#person_NOMBRES');
        inputApellido = page.locator('#person_APELLIDOS');
        inputApodo = page.locator('#person_APODO');
        inputFechaNacimiento = page.locator('#person_FECHA_NAC');
        inputLugarNacimiento = page.locator('#person_LUGAR_NAC');
        inputNumeroDependientes = page.locator('#person_CANT_DEPENDIENTES');

        // Inputs del paso 2
        inputLugarTrabajo = page.locator('#person_NOMBRE_EMPRESA');
        inputEmailEmpresa = page.locator('#person_EMAIL_EMPRESA');
        inputTelefonoEmpresa = page.locator('#person_TELEFONO_EMPRESA');
        inputDireccionEmpresa = page.locator('#person_DIRECCION_EMPRESA');
        inputPosicionEmpresa = page.locator('#person_POSICION_EMPRESA');
        inputFechaIngresoEmpresa = page.locator('#person_FECHA_ENTRADA_EMPRESA');
        inputOtraActividad = page.locator('#person_OTRA_ACTIVIDAD');
        inputJefeInmediato = page.locator('#person_NOMBRE_SUPERVISOR');
        inputIngresoPromedio = page.locator('#person_INGRESO_PROMEDIO');
        inputOtrosIngresos = page.locator('#person_OTROS_INGRESOS');
        inputJustificacionIngresos = page.locator('#person_RAZON_OTROS_INGRESOS');

        // Inputs del paso 3
        inputOrigenRecursos = page.locator('#person_ORIGEN_RECURSOS');
        inputProposito = page.locator('#person_PROPOSITO_TRANSACCION');
    });

    // Funcion con el boton de siguiente, que se repite en cada seccion del registro
    const botonSiguiente = async () => {
        // continuar
        const botonSiguiente = page.locator('button:has-text("Siguiente")');
        await expect(botonSiguiente).toBeVisible();
        // presionar el boton
        await botonSiguiente.click();
    };

    test('Ir a la opcion de Registrar Persona', async () => {
        // Boton de Socios
        await page.getByRole('menuitem', {name: 'SOCIOS'}).click();

        // Boton de Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Boton de Registrar Persona
        await page.getByRole('menuitem', {name: 'Registrar persona'}).click();

        // La url debe de cambiar
        await expect(page).toHaveURL(`${url_registro_persona}`);
    });

    test('Buscar a la persona fisica', async () => {
        // El titulo de registrar persona debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

        // Digitar el nombre de la persona a buscar
        await page.locator(`${formBuscar}`).fill(`${cedula}`);

        // Esperar que la persona buscada se muestre en la tabla
        await page.waitForTimeout(2000);

        // La persona debe de aparecer en la tabla
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
        
        // Click al boton de Ver Cliente
        const botonVerCliente = page.getByRole('row', {name: `${nombre} ${apellido}`}).locator(`${dataVer}`);
        await expect(botonVerCliente).toBeVisible();
        await botonVerCliente.click();

        // La URL debe cambiar al de ver cliente
        await expect(page).toHaveURL(/\/view/);
    });

    test('Paso 1 - Datos Generales', async () => {
        // La url debe cambiar al paso 1
        await expect(page).toHaveURL(/\/?step=1/);

        // Titulo del paso 1
        await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

        // Click al input de codigo y debe estar deshabilitado
        await inputCodigo.click();
        await expect(inputCodigo).toHaveAttribute('readonly', '');

        // El estado de la persoan debe ser Activo
        await expect(page.getByTitle('ACTIVO', {exact: true})).toBeVisible();

        // Click al input de cedula, debe estar deshabilitado
        await expect(inputCedula).toHaveAttribute('readonly', '');
        await inputCedula.click();
        // Click fuera del input 
        await page.locator('h1').filter({hasText: 'DATOS GENERALES'}).click();
        // El input de cedula no puede estar vacio
        await expect(inputCedula).not.toHaveValue('');

        // Click al input de categoria actual, debe estar deshabilitado y tener el valor de Socio Ahorrante
        await expect(inputCategoriaActual).toHaveAttribute('readonly', '');
        await expect(inputCategoriaActual).toHaveValue('SOCIO AHORRANTE');
        await inputCategoriaActual.click();

        // Click al input de pasaporte, debe estar deshabilitado
        await expect(inputPasaporte).toHaveAttribute('readonly', '');
        await inputPasaporte.click();
        // Click fuera del input 
        await page.locator('h1').filter({hasText: 'DATOS GENERALES'}).click();
        // El input de cedula no puede estar vacio
        await expect(inputPasaporte).not.toHaveValue('');

        // Click al input de nombre, debe estar deshabilitado y tener el valor del nombre de la persona
        await expect(inputNombre).toHaveAttribute('readonly', '');
        await expect(inputNombre).toHaveValue(`${nombre}`);
        await inputNombre.click();

        // Click al input de apellido, debe estar deshabilitado y tener el valor del apellido de la persona
        await expect(inputApellido).toHaveAttribute('readonly', '');
        await expect(inputApellido).toHaveValue(`${apellido}`);
        await inputApellido.click();

        // Click al input de apodo, debe estar deshabilitado y tener el valor de apodo
        await expect(inputApodo).toHaveAttribute('readonly', '');
        await expect(inputApodo).toHaveValue('APODO');
        await inputApodo.click();

        // La nacionalidad debe ser Dominicana 
        await expect(page.getByTitle('DOMINICANA')).toBeVisible();

        // Click al input de fecha de nacimiento, debe estar deshabilitado y tener el valor de la fecha de nacimiento de la persona
        await expect(inputFechaNacimiento).toHaveAttribute('readonly', '');
        await expect(inputFechaNacimiento).toHaveValue('17/01/1990');
        await inputFechaNacimiento.click();

        // Click al input de lugar de nacimiento, debe estar deshabilitado y tener el valor de la fecha de nacimiento de la persona
        await expect(inputLugarNacimiento).toHaveAttribute('readonly', '');
        await expect(inputLugarNacimiento).toHaveValue('LA VEGA');
        await inputLugarNacimiento.click();

        // El nivel academico debe ser universitario
        await expect(page.getByTitle('UNIVERSITARIO')).toBeVisible();

        // Click al input de no. dependientes, debe estar deshabilitado y tener el valor de la cantidad de depenmdientes de la persona
        await expect(inputNumeroDependientes).toBeDisabled();
        await expect(inputNumeroDependientes).toHaveValue('4');

        // El ejecutivo debe ser Cliente Inactivo
        await expect(page.getByTitle('CLIENTE INACTIVO')).toBeVisible();

        // El tipo de comprobante debe ser Factura de Consumo Electronica
        await expect(page.getByTitle('FACTURA DE CONSUMO ELECTRONICA')).toBeVisible();

        // El estado civil de la persona debe ser Soltero
        await expect(page.getByTitle('SOLTERO(A)')).toBeVisible();

        // El boton de No referido debe estar deshabilitado

        // La categoria solicitada debe ser Socio Ahorrante
        await expect(page.getByTitle('SOCIO AHORRANTE')).toBeVisible();

        // Click al boton de Siguiente
        botonSiguiente();
    });

    test('Paso 2 - Informacion de Ingresos', async () => {
        // La url debe cambiar al paso 2
        await expect(page).toHaveURL(/\/?step=2/);

        // Titulo del paso 2
        await expect(page.locator('h1').filter({hasText: 'INFORMACIÓN DE INGRESOS'})).toBeVisible();

        // La ocupacion de la persona debe ser Programador
        await expect(page.getByTitle('PROGRAMADOR', {exact: true})).toBeVisible();

        // Click al input de lugar de trabajo, debe estar deshabilitado y tener el valor del lugar de trabajo de la persona
        await expect(inputLugarTrabajo).toHaveAttribute('readonly', '');
        await expect(inputLugarTrabajo).toHaveValue('PROGRAMSUNI');
        await inputLugarTrabajo.click();

        // Click al input de email de la empresa, debe estar deshabilitado y tener el valor del email de la empresa 
        await expect(inputEmailEmpresa).toHaveAttribute('readonly', '');
        await expect(inputEmailEmpresa).toHaveValue('EMPRESAEJEMPLO@HOTMAIL.COM');
        await inputEmailEmpresa.click();

        // Click al input de telefono de la empresa, debe estar deshabilitado y tener el valor del telefono de la empresa
        await expect(inputTelefonoEmpresa).toHaveAttribute('readonly', '');
        await expect(inputTelefonoEmpresa).toHaveValue('(809) 265 3022');
        await inputTelefonoEmpresa.click();

        // Click al input de direccion de la empresa, debe estar deshabilitado y tener el valor de la direccion de la empresa
        await expect(inputDireccionEmpresa).toHaveAttribute('readonly', '');
        await expect(inputDireccionEmpresa).toHaveValue('PALMARITO, LA VEGA');
        await inputDireccionEmpresa.click();

        // await page.pause();

        // La posicion en la empresa debe ser Programador Web
        await expect(inputPosicionEmpresa).toHaveValue('PROGRAMADOR WEB');

        // Click al input de fecha de ingreso a la empresa, debe estar deshabilitado y tener el valor de la fecha de ingreso a la empresa
        await expect(inputFechaIngresoEmpresa).toHaveAttribute('readonly', '');
        await expect(inputFechaIngresoEmpresa).toHaveValue('15/01/2021');
        await inputFechaIngresoEmpresa.click();

        // La actividad economica debe ser Programacion Informatica, etc.
        await expect(page.getByTitle('Programación informática, consultarías y actividades relacionadas')).toBeVisible();

        // Click al input de otra actividad, debe estar deshabilitado y tener el valor de otra actividad
        await expect(inputOtraActividad).toHaveAttribute('readonly', '');
        await expect(inputOtraActividad).toHaveValue('NEGOCIOS');
        await inputOtraActividad.click();

        // Click al input de jefe inmediato, debe estar deshabilitado y tener el valor del jefe inmediato
        await expect(inputJefeInmediato).toHaveAttribute('readonly', '');
        await expect(inputJefeInmediato).toHaveValue('JEFE DE EJEMPLO');
        await inputJefeInmediato.click();

        // El ingreso promedio debe estar deshabilitado y tener el valor del ingreso promedio
        await expect(inputIngresoPromedio).toBeDisabled();
        await expect(inputIngresoPromedio).toHaveValue('RD$ 60,000');

        // El input de otros ingresos debe estar deshabilitado y tener el valor de otros ingresos
        await expect(inputOtrosIngresos).toBeDisabled();
        await expect(inputOtrosIngresos).toHaveValue('US$ 1,200');

        // Click al input de justificacion de ingresos, debe estar deshabilitado y tener el valor de la justificacion de ingresos
        await expect(inputJustificacionIngresos).toHaveAttribute('readonly', '');
        await expect(inputJustificacionIngresos).toHaveValue('INGRESOS RECIBIDOS POR HERENCIA FAMILIAR');
        await inputJustificacionIngresos.click();

        // Click al boton de Siguiente
        botonSiguiente();
    });

    test('Paso 3 - Informacion Adicional de Ingresos', async () => {
        // La url debe cambiar al paso 3
        await expect(page).toHaveURL(/\/?step=3/);

        // Titulo del paso 3
        await expect(page.locator('h1').filter({hasText: 'INFORMACIÓN ADICIONAL DE INGRESOS'})).toBeVisible();

        // Click al input de origen de recursos, debe estar deshabilitado y tener el valor del origen de recursos
        await expect(inputOrigenRecursos).toHaveAttribute('readonly', '');
        await expect(inputOrigenRecursos).toHaveValue('TRABAJO');
        await inputOrigenRecursos.click();

        // Click al input de proposito, debe estar deshabilitado y tener el valor del proposito de los recursos
        await expect(inputProposito).toHaveAttribute('readonly', '');
        await expect(inputProposito).toHaveValue('PARA USO PERSONAL');
        await inputProposito.click();

        // Click al boton de Siguiente
        botonSiguiente();
    });

    test('Paso 4 - Persona Expuesta Politicamente - Peps', async () => {
        // La url debe cambiar al paso 4
        await expect(page).toHaveURL(/\/?step=4/);

        // Titulo del paso 4
        await expect(page.locator('h1').filter({hasText: 'PERSONA EXPUESTA POLÍTICAMENTE'})).toBeVisible();

        // El estado del PEP debe estar en Activo
        await expect(page.getByRole('cell', {name: 'ACTIVO'})).toBeVisible();

        // El boton de Inactivar debe estar deshabilitado
        const botonInhabilitar = page.locator(`${dataCheck}`);
        await expect(botonInhabilitar).toBeDisabled();

        // Click al boton de Siguiente
        botonSiguiente();
    });

    test('Paso 5 - Direcciones, telefonos y redes sociales', async () => {
        // La url debe cambiar al paso 4
        await expect(page).toHaveURL(/\/?step=5/);

        // Los titulos del apso 5 deben estar visibles
        await expect(page.locator('h1').filter({hasText: 'DIRECCIONES'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'TELÉFONOS'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'EMAILS / REDES SOCIALES'})).toBeVisible();

        // Los botones de Editar y Eliminar deben estar deshabilitados
        await expect(page.locator(`${dataEdit}`).first()).toBeDisabled();
        await expect(page.locator(`${dataEliminar}`).first()).toBeDisabled();

        // Click al boton de Siguiente
        botonSiguiente();
    });

    test('Paso 6 - Agregar Relacionados', async () => {
        // La url debe cambiar al paso 6
        await expect(page).toHaveURL(/\/?step=6/);

        // Titulo del paso 6
        await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();

        // El boton de Crear Relacionado debe estar deshabilitado
        await expect(page.getByRole('button', {name: 'Crear Relacionado'})).toBeDisabled();

        // El input para buscar relacionados debe estar deshabilitado
        await expect(page.locator(`${selectBuscar}`)).toBeDisabled();

        // No debe haber ningun relacionado agregado en la tabla
        await expect(page.locator(`text=${noData}`)).toBeVisible();
    });

    test('Finalizar con la Consulta de la Persona', async () => {
        // Hacer click al boton de finalizar
        const botonFinalizar = page.getByRole('button', {name: 'Finalizar'});
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();

        // Debe mostrarse un modal
        await expect(page.getByText('No Registró Relacionado.')).toBeVisible();

        // Contenido del modal
        await expect(page.getByText('¿Desea finalizar el registro sin agregar relacionados?')).toBeVisible();
        
        // Botones del modal
        await expect(page.getByRole('dialog').getByRole('button', {name: 'Cancelar'})).toBeVisible();
        const botonFinalizarModal = page.getByRole('dialog').getByRole('button', {name: 'check Finalizar'});

        await expect(botonFinalizarModal).toBeVisible();
        await botonFinalizarModal.click();

        // Esperar que se abran dos nuevas pestañas con los reportes
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');

        // Cerrar las dos paginas abiertas
        await page2.close();
        await page1.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
