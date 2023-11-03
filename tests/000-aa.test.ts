import { APIResponse, Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
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

interface CambiarReferedio {
    PERMITE_CAMBIAR_REFERIDO: 'N' | 'S'
};

const EscenariosVerProcentajeCobros: CambiarReferedio[] = [
    {
        PERMITE_CAMBIAR_REFERIDO: 'N'
    },
    {
        PERMITE_CAMBIAR_REFERIDO: 'S'
    }
];

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

// Pruebas
test.describe.serial('Pruebas Consultando una Persona', async () => {
    for (const escenarios of EscenariosVerProcentajeCobros) {
        test.describe(`Tests cuando el parametro es: ${Object.values(escenarios).toString()}`, async () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch(browserConfig);
            
                // Crear el context
                context = await browser.newContext(contextConfig);
            
                // Crear la page
                page = await context.newPage();

                // Eventos para la request de actividad_parametro
                await page.route(/\/actividad_parametro/, async (route) => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data).length > 1) {
                        body.data = Object.assign(body.data, escenarios);
                        route.fulfill({
                            response, 
                            body: JSON.stringify(body)
                        });
                    } else {
                        route.continue();
                    }
                });
            
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
        
                // La persona debe de aparecer en la tabla
                await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
                
                // Click al boton de Ver Cliente
                const botonVerCliente = page.getByRole('row', {name: `${nombre} ${apellido}`}).locator(`${dataVer}`);
                await expect(botonVerCliente).toBeVisible();
                await botonVerCliente.click();
        
                // La URL debe cambiar al de ver cliente
                await expect(page).toHaveURL(/\/view/);
            });

            if (escenarios.PERMITE_CAMBIAR_REFERIDO === 'N') {
                test('Parametro N - Datos Generales', async () => {
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
            } else if (escenarios.PERMITE_CAMBIAR_REFERIDO === 'S') {
                test('Parametro S - Datos Generales', async () => {
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
            };
        
            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la page
                await page.close();
        
                // Cerrar el context
                await context.close();
            });
        });
    }
});
