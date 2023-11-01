import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, formBuscar, browserConfig, ariaAgregar, contextConfig } from './utils/dataTests';
import { EscenariosAgregarCargosPrestamoDesembolsado } from './utils/interfaces';
import { url_solicitud_credito } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Agregar Cargos a una Prestamo Desembolsado - Pruebas con los diferentes parametros', () => {
    for (const escenario of EscenariosAgregarCargosPrestamoDesembolsado) {
        test.describe(`Test cuando el escenario es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch(browserConfig);
        
                // Crear el context
                context = await browser.newContext(contextConfig);
        
                // Crear una nueva page
                page = await context.newPage();
        
                // Eventos para la request relation
                await page.route(/\/relation/, async route => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());
        
                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data[35]).length > 1) {
                        // Remplazar el body con la response con los datos del escenario
                        body.data[35] = Object.assign(body.data[35], escenario);
                        route.fulfill({
                            response, 
                            body: JSON.stringify(body)
                        })
                    } else {
                        route.continue();
                    };
                });
        
                // Ingresar a la pagina
                await page.goto(`${url_base}`);
        
                // Nombre y apellidos de la persona almacenada en el state
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
            });
        
            test('Ir a la opcion de Solicitud de Credito', async () => {
                // Negocios
                await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();
        
                // Procesos
                await page.getByRole('menuitem', {name: 'PROCESOS'}).click();
                
                // Solicitud de Credito
                await page.getByRole('menuitem', {name: 'Solicitud de Crédito'}).click();
        
                // La URL debe de cambiar
                await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);
        
                // El titulo debe estar visible
                await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();
            });
        
            test('Cambiar el estado de las solicitudes a Desembolsado', async () => {
                // Titulo principal
                await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();
        
                // El listado de las solicitudes debe ser solicitado
                const estadoSolicitado = page.locator('text=SOLICITADO');
                await expect(estadoSolicitado).toBeVisible();
        
                // Cambiar el estado a desembolsado
                await estadoSolicitado.click();
                const estadoDesembolsado = page.locator('text=DESEMBOLSADO');
                await expect(estadoDesembolsado).toBeVisible();
                await page.locator('text=DESEMBOLSADO').click();
        
                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_solicitud_credito}?filter=desembolsado`);
            });
        
            test('Buscar el Prestamo de un Socio', async () => {
                // Buscar un socio
                await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);
        
                // Click al boton de ver solicitud
                await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();
        
                // Debe dirigirse al prestamo
                await expect(page).toHaveURL(/\/desembolsado/);
        
                // Debe estar en el titulo que la soliciud esta desembolsada
                await expect(page.locator('h1').filter({hasText: '(DESEMBOLSADO)'})).toBeVisible();
        
                // Debe mostrarse el nombre de la persona
                await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();
            });

            if (escenario.ID_OPERACION !== 32) {
                // Tests cuando el escenario es vacio
                test('No debe permitir agregar Cargos a la Solicitud', async () => {
                    // Ir a la opcion de los cargos
                    const seccionCargos = page.getByRole('button', {name: '3 Cargos Del Préstamo'});
                    await expect(seccionCargos).toBeVisible();
                    await seccionCargos.click();

                    await page.waitForTimeout(3000);

                    // Boton de agregar cargos 
                    const agregarCargos = page.locator(`${ariaAgregar}`);
                    await expect(agregarCargos).toBeDisabled();
                });

            } else if (escenario.ID_OPERACION === 32) {
                // Tests cuando el escenario es igual a 32
                test('Agregar un cargo a un Solicitud Desembolsada', async () => {
                    // Ir a la opcion de los cargos
                    const seccionCargos = page.getByRole('button', {name: '3 Cargos Del Préstamo'});
                    await expect(seccionCargos).toBeVisible();
                    await seccionCargos.click();
                
                    // Titulo de la seccion
                    await expect(page.locator('h1').filter({hasText: 'CARGOS'})).toBeVisible();

                    // Deben estar visibles los tres cargos de la solicitud de credito
                    await expect(page.getByRole('cell', {name: 'CONTRATO'})).toBeVisible();
                    await expect(page.getByRole('cell', {name: 'SEGURO DE VIDA'})).toBeVisible();
                    await expect(page.getByRole('cell', {name: 'BURO DE CREDITO (DATACREDITO)'})).toBeVisible();
                    
                    // Boton de agregar cargos 
                    const agregarCuota = page.locator(`${ariaAgregar}`);
                    await expect(agregarCuota).toBeVisible();
                    await agregarCuota.click();
                
                    // Debe salir un modal
                    const modal = page.locator('text=AGREGAR CARGO');
                    await expect(modal).toBeVisible();
                
                    // Buscar un seguro
                    await page.locator('#form_DESC_CARGO').fill('SEGURO DE');
                    // Elegir el seguro de incendio
                    await page.getByRole('option', {name: 'SEGURO DE INCENDIO'}).click();
                
                    // Debe de colocarse automaticamente que es un seguro
                    await expect(page.locator('(//INPUT[@type="radio"])[1]')).toBeChecked();
                
                    // Elegir una aseguradora
                    await page.locator('#form_ID_ASEGURADORA').fill('SEGUROS');
                    // Elegir seguros mapfre
                    await page.locator('text=SEGUROS MAPFRE').click();
                
                    // Colocar un valor
                    const campoValor = page.locator('#form_VALOR');
                    await campoValor.clear();
                    await campoValor.fill('50');

                    // Cambiar la via de cobro
                    await page.getByText('FIJO EN CUOTAS').click();
                    // Elegir cobro en desembolso
                    await page.getByText('COBRO EN DESEMBOLSO').click();
                
                    // Guardar el cargo agregado
                    await page.getByRole('button', {name: 'save Guardar'}).click();
            
                    // El modal se debe cerrar
                    await expect(modal).not.toBeVisible();
            
                    // Se debe mostrar un mensaje de que la operacion fue exitosa
                    await expect(page.locator('text=Cargos del préstamo guardados exitosamente.')).toBeVisible();

                    // Ahora la solicitud debe tener 4 cargos
                    await expect(page.getByRole('cell', {name: 'CONTRATO'})).toBeVisible();
                    await expect(page.getByRole('cell', {name: 'SEGURO DE VIDA'})).toBeVisible();
                    await expect(page.getByRole('cell', {name: 'BURO DE CREDITO (DATACREDITO)'})).toBeVisible();
                    await expect(page.getByRole('cell', {name: 'SEGURO DE INCENDIO'})).toBeVisible();
                
                    // Click en Actualizar y continuar
                    await page.getByRole('button', {name: 'Actualizar y continuar'}).click();
                
                    // Debe mostrarse el titulo de la siguiente seccion
                    await expect(page.locator('h1').filter({hasText: 'DEUDAS PENDIENTES'})).toBeVisible();
                });
                
                test('Ir a la opcion de Desembolso para terminar el proceso', async () => {
                    // Opcion de desembolso
                    const seccionDesembolso = page.getByRole('button', {name: '10 Desembolso'});
                    await expect(seccionDesembolso).toBeVisible();
                    await seccionDesembolso.click();
            
                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=10/);
            
                    // Titulo de la seccion
                    await expect(page.locator('h1').filter({hasText: 'DESEMBOLSO DE PRÉSTAMO'})).toBeVisible();
                
                    // Finalizar el proceso
                    const botonFinalizar = page.getByRole('button', {name: 'Finalizar'});
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();
            
                    // Debe salir un modal de confirmacion
                    await expect(page.locator('text=¿Seguro que desea finalizar la operación?')).toBeVisible();
            
                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
            
                    // Debe regresar a la pagina de las solicitudes
                    await expect(page).toHaveURL(`${url_solicitud_credito}?filter=desembolsado`);
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
