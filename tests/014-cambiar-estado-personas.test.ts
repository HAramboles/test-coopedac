import { APIResponse, Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { formBuscar } from './utils/data/inputsButtons';
import { url_base, url_registro_persona } from './utils/dataPages/urls';
import { EscenariosPruebaEditarPersonas } from './utils/dataPages/interfaces';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Botones para los tests
let botonEditarCuentaCasada: Locator;
let botonEditarCuentaConyugue: Locator;
let botonSextoPaso: Locator;
let botonFinalizar: Locator;

// Inputs para los tests
let inputNombre: Locator;
let inputApellido: Locator;

// Cedula, nombre y apellido de la persona casada
let cedulaCasada: string | null;
let nombreCasada: string | null;
let apellidoCasada: string | null;

// Cedula, nombre y apellido de la persona conyugue
let cedulaConyugue: string | null;
let nombreConyugue: string | null;
let apellidoConyugue: string | null;

// Pruebas
test.describe.serial('Cambiar Estado de Personas - Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosPruebaEditarPersonas) {
        test.describe.serial(`Tets cuando el parametro es: ${Object.values(escenarios).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch(browserConfig);
        
                // Crear el context
                context = await browser.newContext(contextConfig);
        
                // Crear la page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async route => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data[10]).length > 1) {
                        // Reemplazar el body con la response con los datos de los escenarios
                        body.data[10] = Object.assign(body.data[10], escenarios);
                        route.fulfill({
                            response,
                            body: JSON.stringify(body),
                        });
                    } else {
                        route.continue();
                    };
                });
        
                // Dirigrse a la pagina
                await page.goto(`${url_base}`);

                // Cedula, nombre y apellido de la persona casada almacenados en el state
                cedulaCasada = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaCasada'));
                nombreCasada = await page.evaluate(() => window.localStorage.getItem('nombrePersonaCasada'));
                apellidoCasada = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaCasada'));

                // Cedula, nombre y apellido de la persona conyugue almacenados en el state
                cedulaConyugue = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaConyuge'));
                nombreConyugue = await page.evaluate(() => window.localStorage.getItem('nombrePersonaFisicaConyuge'));
                apellidoConyugue = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaFisicaConyuge'));

                // Botones de Editar Cuenta
                botonEditarCuentaCasada = page.getByRole('row', {name: `${nombreCasada} ${apellidoCasada}`}).getByRole('button', {name: 'edit'});
                // Boton de Editar Cuenta
                botonEditarCuentaConyugue = page.getByRole('row', {name: `${nombreConyugue} ${apellidoConyugue}`}).getByRole('button', {name: 'edit'});

                // Inputs
                inputNombre = page.locator('#person_NOMBRES');
                inputApellido = page.locator('#person_APELLIDOS');

                // Boton del sexto paso
                botonSextoPaso = page.getByRole('button', {name: '6 Relacionados Agregar Relacionados'});

                // Boton de Finalizar
                botonFinalizar = page.getByRole('button', {name: 'Finalizar'});
            });

            // Funcion con el boton de continuar
            const actualizarContinuar = async () => {
                // continuar
                const botonContinuar = page.locator('button:has-text("Actualizar y continuar")');
                await expect(botonContinuar).toBeVisible();
                // presionar el boton
                await botonContinuar.click();
            };

            test('Ir a la opcion de Registro de Persona', async () => {
                // Socios
                await page.getByRole('menuitem', {name: 'SOCIOS'}).click();
        
                // Operaciones
                await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();
        
                // Registrar persona
                await page.getByRole('menuitem', {name: 'Registrar persona'}).click();
        
                // La URL deba cambiar
                await expect(page).toHaveURL(`${url_registro_persona}`);
            });

            test('Buscar la cuenta de la Persona Casada', async () => {
                // El titulo principal debe estar visible
                await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

                // Buscar a la persona
                await page.locator(`${formBuscar}`).fill(`${cedulaCasada}`);
            });

            if (escenarios.ID_OPERACION !== 4) {
                // Test cuando el ID_OPERACION_MODIFICA_PER sea diferente de 4
                test('El boton de Editar no debe estar visible', async () => {
                    // El boton de Editar no debe mostrarse
                    await expect(botonEditarCuentaCasada).not.toBeVisible();
                });
            } else if (escenarios.ID_OPERACION === 4) {
                test('Editar a la Persona Casada', async () => {
                    // El boton de Editar debe estar visible
                    await expect(botonEditarCuentaCasada).toBeVisible();
                    // Click al boton de Editar
                    await botonEditarCuentaCasada.click();

                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/edit/);
                });

                test('Primer Paso - Datos Generales', async () => {
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

                    // El nombre debe estar visible
                    await expect(inputNombre).toHaveValue(`${nombreCasada}`);

                    // El apellido debe estar visible
                    await expect(inputApellido).toHaveValue(`${apellidoCasada}`);
                });

                test('Cambiar el estado de la Persona Casada a Inactivo', async () => {
                    // El estado de la persona debe ser Activo
                    const estadoActivo = page.locator('#person').getByText('ACTIVO', {exact: true});
                    await expect(estadoActivo).toBeVisible();

                    // Click al estado
                    await estadoActivo.click();
                    // Elegir el estado Inactivo
                    await page.getByRole('option', {name: 'INACTIVO'}).click();

                    // Click al boton de Actualizar y continuar
                    actualizarContinuar();

                    // Debe pasar al segundo paso
                    await expect(page).toHaveURL(/\/?step=2/);

                    // El titulo del segundo paso debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'INFORMACIÓN DE INGRESOS'})).toBeVisible();
                });

                test('Salir de la Edicion de la persona casada', async () => {
                    // Seccion de direcciones y contactos
                    await expect(botonSextoPaso).toBeVisible();
                    await botonSextoPaso.click();

                    // Debe dirigirse al sexto paso
                    await expect(page).toHaveURL(/\/?step=6/);

                    // El titulo del sexto paso debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();

                    // Click al boton de Finalizar
                    await botonFinalizar.click();

                    // Esperar que se abran dos nuevas pestañas con los reportes
                    const page1 = await context.waitForEvent('page');
                    const page2 = await context.waitForEvent('page');

                    // Cerrar las dos paginas
                    await page2.close();
                    await page1.close();
                });

                test('Buscar a la persona Casada pero en estado Inactivo', async () => {
                    // Debe regresar a la pagina de registro de personas
                    await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

                    // Cambiar el estado de la lista de personas
                    await page.getByTitle('TODOS').click();
                    // Eelgir el estado Inactivo
                    await page.getByRole('option', {name: 'INACTIVO'}).click();
                    
                    // Buscar a la persona
                    await page.locator(`${formBuscar}`).fill(`${cedulaCasada}`);

                    // Debe mostrase la persona casada en estado Inactivo
                    await expect(page.getByRole('cell', {name: `${nombreCasada} ${apellidoCasada}`})).toBeVisible();
                });

                test('Editar la Persona Conyugue', async () => {
                    // Cambiar el estado de la lista de personas
                    await page.locator('#form').getByText('INACTIVO').click();
                    // Eelgir el estado TODOS
                    await page.getByRole('option', {name: 'ACTIVO', exact: true}).click();

                    // Buscar a la persona conyugue
                    await page.locator(`${formBuscar}`).fill(`${cedulaConyugue}`);

                    // El boton de Editar debe estar visible
                    await expect(botonEditarCuentaConyugue).toBeVisible();
                    // Click al boton de Editar
                    await botonEditarCuentaConyugue.click();

                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/edit/);
                });
                
                test('Colocar los datos de faltantes a la persona', async () => {
                    // Esperar que carguen los datos de la persona
                    await page.waitForTimeout(4000);

                    // Lugar de nacimiento
                    const campoLugar = page.locator('#person_LUGAR_NAC');
                    await campoLugar?.fill('La Vega');

                    // Esperar que se ingrese el lugar de nacimiento
                    await page.waitForTimeout(2000);

                    // Nivel academico
                    const campoAcademico = page.locator('#person_ID_NIVEL_ACA');
                    await campoAcademico?.fill('Universitario');
                    // Hacer click a la opcion que aparece de nivel academico universitario
                    await page.locator('text=UNIVERSITARIO').click();

                    // Cantidad de dependientes
                    const campoDependientes = page.locator('#person_CANT_DEPENDIENTES');
                    await campoDependientes?.fill('0');

                    // Ejecutivo
                    const campoEjecutivo = page.locator('#person_ID_EJECUTIVO');
                    await campoEjecutivo?.fill('Cliente');
                    // Hacer click a la opcion de cliente inactivo
                    await page.locator('text=CLIENTE INACTIVO').click();

                    // Click al boton de no referido
                    await page.locator('#person_NO_REFERIDO').click();

                    // Categoria Solicitada
                    const campoCategoria = page.locator('#person_ID_CATEGORIA_SOLICITADA');
                    await campoCategoria?.fill('ahorra');
                    // Seleccionar la opcion de socio ahorrante
                    await page.locator('text=SOCIO AHORRANTE').click();
                });

                test('Cambiar el estado de la Persona Conyugue a Fallecido', async () => {
                    // El estado de la persona debe ser Activo
                    const estadoActivo = page.locator('#person').getByText('ACTIVO', {exact: true});
                    await expect(estadoActivo).toBeVisible();

                    // Click al estado
                    await estadoActivo.click();
                    // Elegir el estado Inactivo
                    await page.getByRole('option', {name: 'FALLECIDO'}).click();

                    // Click al boton de Actualizar y continuar
                    actualizarContinuar();

                    // Debe pasar al segundo paso
                    await expect(page).toHaveURL(/\/?step=2/);

                    // El titulo del segundo paso debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'INFORMACIÓN DE INGRESOS'})).toBeVisible();
                });

                test('Salir de la Edicion de la persona conyugue', async () => {
                    // Seccion de direcciones y contactos
                    await expect(botonSextoPaso).toBeVisible();
                    await botonSextoPaso.click();

                    // Debe dirigirse al sexto paso
                    await expect(page).toHaveURL(/\/?step=6/);

                    // El titulo del sexto paso debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();

                    // Click al boton de Finalizar
                    await botonFinalizar.click();

                    // Esperar que se abran dos nuevas pestañas con los reportes
                    const page1 = await context.waitForEvent('page');
                    const page2 = await context.waitForEvent('page');

                    // Cerrar las dos paginas
                    await page2.close();
                    await page1.close();
                });

                test('Buscar a la persona Conyugue pero en estado Fallecido', async () => {
                    // Debe regresar a la pagina de registro de personas
                    await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

                    // Cambiar el estado de la lista de personas
                    await page.getByTitle('TODOS').click();
                    // Eelgir el estado Inactivo
                    await page.getByRole('option', {name: 'FALLECIDO'}).click();
                    
                    // Buscar a la persona
                    await page.locator(`${formBuscar}`).fill(`${cedulaConyugue}`);

                    // Debe mostrase la persona casada en estado Inactivo
                    await expect(page.getByRole('cell', {name: `${nombreConyugue} ${apellidoConyugue}`})).toBeVisible();
                });
            };
        
            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la page
                await page.close();
        
                // Cerrar el context
                await context.close();
            });
        });
    };
});
