import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, formBuscar, ariaCerrar, AgregarCargos } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Parametros de relation
const EscenariosPrueba: AgregarCargos[] = [
    {
        ID_OPERACION: ''
    },
    {
        ID_OPERACION: 10
    },
    {
        ID_OPERACION: 32
    },
];

// Pruebas

test.describe('Agregar Cargos a una Prestamo Desembolsado - Pruebas con los diferentes parametros', () => {
    for (const escenario of EscenariosPrueba) {
        test.describe(`Test cuando el escenario es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch({
                    headless: false,
                });
        
                // Crear el context
                context = await browser.newContext({
                    storageState: 'state.json',
                });
        
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
                test.slow();
        
                // Negocios
                await page.locator('text=NEGOCIOS').click();
        
                // Procesos
                await page.locator('text=PROCESOS').click();
                
                // Solicitud de Credito
                await page.locator('text=Solicitud de Crédito').click();
        
                // El titulo debe estar visible
                await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();
        
                // Condicion por si el tipo de solicitud llega sin datos o con datos
                const estadoSolicitud = page.getByTitle('SOLICITADO', {exact: true});
        
                if (await estadoSolicitud.isHidden()) {
                    // Si no llega el tipo de captacion, manualmente dirigise a la url de las aportaciones
                    await page.goto(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);
                } else if (await estadoSolicitud.isVisible()) {
                    // La URL debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);
        
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();
                };
            });
        
            test('Cambiar el estado de las solicitudes a Desembolsado', async () => {
                // Titulo principal
                await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();
        
                // El listado de las solicitudes debe ser solicitado
                const estadoSolicitado = page.locator('text=SOLICITADO');
                await expect(estadoSolicitado).toBeVisible({timeout: 20000});
        
                // Cambiar el estado a desembolsado
                await estadoSolicitado.click();
                const estadoDesembolsado = page.locator('text=DESEMBOLSADO');
                await expect(estadoDesembolsado).toBeVisible();
                await page.locator('text=DESEMBOLSADO').click();
        
                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=desembolsado`);
            });
        
            test('Buscar el Prestamo de un Socio', async () => {
                test.slow();
        
                // Buscar un socio
                await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);
        
                // Click al boton de ver solicitud
                await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();
        
                // Debe dirigirse al prestamo
                await expect(page).toHaveURL(/\/desembolsado/);
        
                // Debe estar en el titulo que la soliciud esta desembolsada
                await expect(page.locator('h1').filter({hasText: '(DESEMBOLSADO)'})).toBeVisible({timeout: 20000});
        
                // Debe mostrarse el nombre de la persona
                await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible({timeout: 20000});
            });

            if (escenario.ID_OPERACION === '') {
                // Tests cuando el escenario es vacio
                test('No debe permitir agregar Cargos a la Solicitud', async () => {
                    test.slow();
            
                    // Ir a la opcion de los cargos
                    const seccionCargos = page.getByRole('button', {name: '3 Cargos Del Préstamo'});
                    await expect(seccionCargos).toBeVisible();
                    await seccionCargos.click();

                    // Boton de agregar cargos 
                    const agregarCuota = page.locator('[aria-label="plus"]');
                    await expect(agregarCuota).toBeDisabled();

                    // Skip al test
                    test.skip();
                });

            } else if (escenario.ID_OPERACION === 10) {
                // Tests cuando el escenario es diferenete a 32
                test('No debe permitir agregar Cargos a la Solicitud', async () => {
                    test.slow();
            
                    // Ir a la opcion de los cargos
                    const seccionCargos = page.getByRole('button', {name: '3 Cargos Del Préstamo'});
                    await expect(seccionCargos).toBeVisible();
                    await seccionCargos.click();

                    // Boton de agregar cargos 
                    const agregarCuota = page.locator('[aria-label="plus"]');
                    await expect(agregarCuota).toBeDisabled();

                    // Skip al test
                    test.skip();
                });

            } else if (escenario.ID_OPERACION === 32) {
                // Tests cuando el escenario es igual a 32
                test('Agregar un cargo a un Solicitud Desembolsada', async () => {
                    test.slow();
            
                    // Ir a la opcion de los cargos
                    const seccionCargos = page.getByRole('button', {name: '3 Cargos Del Préstamo'});
                    await expect(seccionCargos).toBeVisible();
                    await seccionCargos.click();
                
                    // Titulo de la seccion
                    await expect(page.locator('h1').filter({hasText: 'CARGOS'})).toBeVisible();
                    
                    // Boton de agregar cargos 
                    const agregarCuota = page.locator('[aria-label="plus"]');
                    await expect(agregarCuota).toBeVisible();
                    await agregarCuota.click();
                
                    // Debe salir un modal
                    const modal = page.locator('text=AGREGAR CARGO');
                    await expect(modal).toBeVisible();
                
                    // Buscar un seguro
                    await page.locator('#form_DESC_CARGO').fill('SEGURO DE');
                    // Elegir el seguro de vida
                    await page.locator('text=SEGURO DE VIDA').click();
                
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
                
                    // La via de cobro por defecto debe ser cobro en desembolso
                    await expect(page.getByText('FIJO EN CUOTAS')).toBeVisible();
                
                    // Guardar el cargo agregado
                    await page.getByRole('button', {name: 'save Guardar'}).click();
            
                    // El modal se debe cerrar
                    await expect(modal).not.toBeVisible();
            
                    // Se debe mostrar un mensaje de que la operacion fue exitosa
                    await expect(page.locator('text=Cargos del préstamo guardados exitosamente.')).toBeVisible();
            
                    // Cerrar el mensaje
                    await page.locator(`${ariaCerrar}`).click();
                
                    // Click en Siguiente
                    await page.getByRole('button', {name: 'Siguiente'}).click();
                
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
                    await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=desembolsado`);
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
