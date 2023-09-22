import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataCerrar, ariaCerrar, selectBuscar, browserConfig, formComentario } from './utils/dataTests';
import { EscenariosPruebasCajaBoveda } from './utils/interfaces';
import { url_transacciones_caja } from './utils/urls';
import { formatDate } from './utils/fechas';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Nota de la cuenta de aportaciones de la persona
let nota: string | null;

// Pruebas
test.describe.serial('Pruebas con Transacciones de Caja - Retiro - Cuenta de Ahorros Normales', async () => {
    for (const escenarios of EscenariosPruebasCajaBoveda) {
        test.describe(`Tests cuando el parametro es: ${Object.values(escenarios).toString()}`, async () => {
            test.beforeAll(async () => { // Antes de todas las pruebas
                // Crear el browser
                browser = await chromium.launch({
                    headless: browserConfig.headless,
                    args: browserConfig.args
                });
        
                // Crear el context
                context = await browser.newContext({
                    storageState: 'state.json'
                });
        
                // Crear una nueva page
                page = await context.newPage();
        
                // Ingresar a la pagina
                await page.goto(`${url_base}`);

                // Eventos para la request actividad_parameto
                await page.route(/\/actividad_parametro/, async route => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data).length > 1) {
                        // Reemplazar el body con la response con los datos de los escenarios
                        body.data = Object.assign(body.data, escenarios);
                        route.fulfill({
                            response,
                            body: JSON.stringify(body),
                        });
                    } else {
                        route.continue();
                    };
                });
        
                // Cedula, nombre y apellido de la persona alamcenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
        
                // Nota almacenada en el state
                nota = await page.evaluate(() => window.localStorage.getItem('nota'));
            });
        
            test('Ir a la opcion de Transacciones de Caja', async () => {
                // Tesoreria
                await page.getByRole('menuitem', {name: 'TESORERIA'}).click();
        
                // Cajas
                await page.getByRole('menuitem', {name: 'CAJAS'}).click();
        
                // Operaciones
                await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();
        
                // Transacciones de caja
                await page.getByRole('menuitem', {name: 'Transacciones de Caja'}).click();
        
                // La URL debe cambiar
                await expect(page).toHaveURL(`${url_transacciones_caja}`);
            });

            if (escenarios.ES_BOVEDA !== '0') {
                // Test cuando el ES_BOVEDA sea diferente de 0
                test('Debe mostrarse un Modal informando que no puede hacer Transacciones', async () => {
                    // Titulo del modal
                    await expect(page.locator('text=Advertencia')).toBeVisible();

                    // Contenido del modal
                    await expect(page.locator('text=No tiene un turno aperturado o este tipo de caja no permite realizar transacciones de este tipo.')).toBeVisible();

                    // Botones del modal
                    await expect(page.getByRole('button', {name: 'Permanecer en la pagina'})).toBeVisible();
                    const botonInicio = page.getByRole('button', {name: 'Ir a Inicio'});
                    await expect(botonInicio).toBeVisible();

                    // Volver a la pagina de Inicio
                    await botonInicio.click();

                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}`);
                });
            } else if (escenarios.ES_BOVEDA === '0') {
                // Tests cuando el ES_BOVEDA sea igual a 0
                test('Transacciones de Caja - Retiro', async () => {        
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'TRANSACCIONES DE CAJA'})).toBeVisible();
            
                    // Titulo Captaciones
                    await expect(page.locator('h1').filter({hasText: 'CAPTACIONES'})).toBeVisible();
            
                    // Titulo Colocaciones  
                    await expect(page.locator('h1').filter({hasText: 'COLOCACIONES'})).toBeVisible();
            
                    // Ingresos en Transito
                    await expect(page.locator('h1').filter({hasText: 'INGRESOS EN TRÁNSITO'})).toBeVisible();
            
                    // Egresos en Transito
                    await expect(page.locator('h1').filter({hasText: 'EGRESOS EN TRÁNSITO'})).toBeVisible(); 
                });
                
                test('Seleccionar un socio', async () => { 
                    // Input para buscar el socio
                    const buscarSocio = page.locator(`${selectBuscar}`);
                    await expect(buscarSocio).toBeVisible();
            
                    // Ingresar la cedula del socio
                    await buscarSocio.fill(`${cedula}`);
                    // Seleccionar la cuenta de ahorros normales del socio
                    await page.locator('text=AHORROS NORMALES').click();
                });
            
                test('Debe salir un modal con la nota anteriormente creada', async () => {
                    // Titulo del modal
                    await expect(page.locator('h1').filter({hasText: `NOTAS PARA ${nombre} ${apellido}`})).toBeVisible();
            
                    // La nota debe estar visible
                    await expect(page.getByRole('cell', {name: `${nota}`})).toBeVisible();
            
                    // Cerrar el modal
                    await page.locator(`${ariaCerrar}`).click();  
                });
            
                test('Boton de Retiro', async () => {
                    // Debe estar visible la celda de los productos
                    await expect(page.getByText('Producto').first()).toBeVisible();
                    
                    // Boton de Retiro debe estar visible
                    const botonRetiro = page.locator('text=RETIRO');
                    await expect(botonRetiro).toBeVisible();
                    // Click al boton
                    await botonRetiro.click();
            
                    // Debe aparecer un modal con las opciones para el retiro
                    await expect(page.locator('text=RETIRO CUENTAS DE AHORROS')).toBeVisible();
                });
            
                test('Datos del Retiro de la Cuenta de Ahorro', async () => {
                    // Se deben mostrar el titular y el co-propietario
                    await expect(page.locator('text=FIRMANTES')).toBeVisible();
                    // await expect(page.getByRole('cell', {name: 'CO-PROPIETARIO'})).toBeVisible();
                    await expect(page.getByRole('cell', {name: 'TITULAR'})).toBeVisible();
                    
                    // El titulo de las firmas debe estar visible
                    await expect(page.getByRole('heading', {name: 'Firmas Autorizadas'})).toBeVisible();
            
                    // Input del monto
                    const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
                    await expect(campoMonto).toBeVisible();
                    await campoMonto.fill('100');
            
                    // Agregar un comentario
                    await page.locator(`${formComentario}`).fill('Retiro de 100 pesos de la cuenta de Ahorros');
            
                    // Boton Agregar
                    await page.locator('text=Agregar').click();
            
                    // Debe salir un mensaje de que la operacion salio correctamente
                    await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();
            
                    // Cerrar el mensaje
                    await page.locator(`${dataCerrar}`).click();
            
                    // Aplicar el retiro
                    await page.locator('text=Aplicar').click();
                });
            
                test('Datos de la Distribucion de Egresos', async () => {
                    // Debe salir un modal para la distribucion de egresos
                    await expect(page.locator('text=DISTRIBUCIÓN DE EGRESOS')).toBeVisible();
            
                    // El modal debe contener 4 titulos y todos deben estar visibles
                    await expect(page.locator('h1').filter({hasText: 'MIS DENOMINACIONES'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'RECOMENDACIÓN DE DISTRIBUCIÓN'})).toBeVisible();
            
                    // Hacer la distribucion del dinero a retirar, en el caso de la prueba RD 100
                    // Divididos en 50 y 50
                    const cant50 = page.locator('[id="17"]');
            
                    // Cantidad = 2 de 50
                    await cant50.click();
                    await cant50.fill('2');
            
                    // Luego de distribuir la cantidad, debe aparecer una opcion de Guardar Entregado
                    await expect(page.locator('text=Guardar Entregado')).toBeVisible();
            
                    // Hace click en Aceptar
                    const botonAceptar = page.getByRole('button', {name: 'check Aplicar'});
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();

                    // Se abrira una nueva pagina con el reporte del retiro
                    const page1 = await context.waitForEvent('page');

                    // Esperar que el reporte este visible
                    await page1.waitForTimeout(4000);
                    
                    // La pagina abierta con el reporte del retiro se debe cerrar
                    await page1.close();
                });
            
                test('Actualizar la libreta luego de realizar el retiro', async () => {
                    // Luego de que se cierre la nueva pestaña, se debe regresar a la pagina anterior
                    await expect(page).toHaveURL(`${url_transacciones_caja}`);
            
                    // Debe aparecer un modal con el mensaje de actualizar la libreta
                    await expect(page.locator('text=Actualizar libreta')).toBeVisible();
            
                    // Click en Actualizar
                    const botonActualizar = page.getByRole('button', {name: 'check Actualizar'});
                    const [page1] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Aceptar
                        await expect(botonActualizar).toBeVisible(),
                        await botonActualizar.click()
                    ]);
            
                    // El titulo de actualzar libreta debe estar visible
                    await expect(page1.locator('h1').filter({hasText: 'ACTUALIZAR LIBRETA'})).toBeVisible();
            
                    // El boton de imprimir debe estar visible
                    await expect(page1.getByRole('button', {name: 'printer Imprimir'})).toBeVisible();
            
                    // Titulo de Vista Previa
                    await expect(page1.locator('text=VISTA PREVIA')).toBeVisible();

                    // Deben mostrarse las dos transacciones realizadas
                    await expect(page.getByRole('row', {name: `${formatDate(new Date())} 100,100.00			100,000.00	`})).toBeVisible();
                    await expect(page.getByRole('row', {name: `${formatDate(new Date())}			100.00	99,900.00	`})).toBeVisible();
            
                    // La pagina abierta con la vista previa de la libreta se debe cerrar
                    await page1.close();
                });

                test('Liberar la Sesion', async () => {
                    // Se debe regresar a la pagina anterior
                    await expect(page).toHaveURL(`${url_transacciones_caja}`);

                    // Click al boton de Liberar Sesion
                    const botonLiberarSesion = page.getByRole('button', {name: 'Liberar Sesión'});
                    await expect(botonLiberarSesion).toBeVisible();
                    await botonLiberarSesion.click();

                    // Debe salir un mensaje de Confirmacion
                    await expect(page.locator('text=¿Está seguro que desea proceder con esta acción?')).toBeVisible();

                    // Click al boton de Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // Debe salir un mensaje de Operacion Exitosa
                    await expect(page.locator('text=Sesiones en transito actualizada exitosamente.')).toBeVisible();
                });
            };

            test.afterAll(async () => { // Despues de todas las pruebas
                // Cerrar la pagina
                await page.close();
        
                // Cerrar el context
                await context.close();
            });
        });
    };
});