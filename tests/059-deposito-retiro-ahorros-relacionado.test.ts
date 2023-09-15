import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataCerrar, ariaCerrar, selectBuscar, browserConfig, formComentario } from './utils/dataTests';
import { EscenariosPruebasCajaBoveda } from './utils/interfaces';
import { url_transacciones_caja } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Transacciones de Caja - Deposito - Cuenta de Aportaciones y Ahorros - Pruebas con los diferentes Parametros', async () => {
    for (const escenarios of EscenariosPruebasCajaBoveda) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenarios).toString()}`, async () => {
            test.beforeAll(async () => {
                /* Crear el browser, con la propiedad headless */
                browser = await chromium.launch({
                    headless: browserConfig.headless,
                    args: browserConfig.args
                });
        
                /* Crear un context con el storageState donde esta guardado el token de la sesion */
                context = await browser.newContext({
                    storageState: 'state.json'
                });
        
                /* Crear una nueva page usando el context */
                page = await context.newPage();

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
        
                /* Ingresar a la pagina */
                await page.goto(`${url_base}`);
        
                // Cedula, ,ombre y apellido de la persona alamcenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePnombrePersonaJuridicaRelacionadaersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
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
                test('Transacciones de Caja - Depositos', async () => {
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'TRANSACCIONES DE CAJA'})).toBeVisible();
            
                    // Titulo Captaciones
                    await expect(page.locator('h1').filter({hasText: 'CAPTACIONES'})).toBeVisible();
            
                    // Titulo Colocaciones 
                    await expect(page.locator('h1').filter({hasText: 'COLOCACIONES'})).toBeVisible();
            
                    // Ingresos en Transito
                    await expect(page.locator('h1').filter({hasText: 'INGRESOS EN TRÁNSITO'})).toBeVisible();
            
                    // Egresos en transito
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
            
                test('Boton de Deposito de la cuenta de Ahorros', async () => {            
                    // Boton de Deposito debe estar visible
                    const botonDeposito = page.getByRole('button', {name: 'DEPOSITO'});
                    await expect(botonDeposito).toBeVisible();
                    // Click al boton 
                    await botonDeposito.click();
            
                    // Debe aparecer un modal con las opciones para el deposito
                    await expect(page.locator('text=DEPÓSITO A CUENTA AHORROS NORMALES')).toBeVisible();
                });
            
                test('Datos del Deposito a la Cuenta de Ahorros', async () => {
                    // Input del monto
                    const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
                    await expect(campoMonto).toBeVisible();
                    await campoMonto.fill('1000');
            
                    // Agregar un comentario
                    await page.locator(`${formComentario}`).fill('Deposito de 1000 pesos a la cuenta de Ahorros');
            
                    // Boton Aplicar
                    await page.locator('text=Aplicar').click();
            
                    // Debe salir un mensaje de que la operacion salio correctamente
                    await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();
                });
            
                test('Datos de la Distribucion de Ingresos del Deposito a la Cuenta de Ahorros', async () => {            
                    // Debe salir un modal para la distribucion de ingresos
                    await expect(page.locator('text=DISTRIBUCIÓN DE INGRESOS')).toBeVisible();
            
                    // El modal debe contener 4 titulos y todos deben estar visibles
                    await expect(page.locator('h1').filter({hasText: 'RECIBIDO'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'RECOMENDACIÓN DE DISTRIBUCIÓN'})).toBeVisible();
            
                    // En detalle distribucion, el monto pendiente a recibir tiene que tener una alerta roja
                    const iconoAlerta = page.getByRole('img', {name: 'close-circle'}).first();
                    await expect(iconoAlerta).toBeVisible();
            
                    // Hacer la distribucion del dinero a depositar, en el caso de la prueba RD 1000
                    const cant1000 = page.locator('[id="1"]'); // Campo de RD 1000
            
                    // Cantidad = 100 de 1000
                    await cant1000.click();
                    await cant1000.fill('1');
            
                    // El icono de la alerta roja ya no debe estar visible al distribuirse correctamente lo recibido
                    await expect(iconoAlerta).not.toBeVisible();
            
                    // Hacer click al boton de Aceptar
                    const botonAceptar = page.getByRole('button', {name: 'check Aplicar'});
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();

                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Esperar que el reporte este visible
                    await page1.waitForTimeout(8000);

                    // Cerrar la nueva pestaña
                    await page1.close();

                    // Debe salir un modal
                    await expect(page.locator('text=¿Desea actualizar la libreta?')).toBeVisible();
            
                    // Click al boton de Cancelar
                    await page.locator('text=Cancelar').click();
                });

                test('Boton de Retiro de la cuenta de Ahorros Normales', async () => {
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
                    // Input del monto
                    const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
                    await expect(campoMonto).toBeVisible();
                    await campoMonto.fill('500');
            
                    // Agregar un comentario
                    await page.locator(`${formComentario}`).fill('Retiro de 500 pesos de la cuenta de Ahorros');
            
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
            
                    // Hacer la distribucion del dinero a retirar, en el caso de la prueba RD 500
                    const cant500 = page.locator('[id="14"]');
            
                    // Cantidad = 2 de 50
                    await cant500.click();
                    await cant500.fill('1');
            
                    // Luego de distribuir la cantidad, debe aparecer una opcion de Guardar Entregado
                    await expect(page.locator('text=Guardar Entregado')).toBeVisible();
            
                    // Hace click en Aceptar
                    const botonAceptar = page.getByRole('button', {name: 'check Aplicar'});
            
                    // Se abrira una nueva pagina con el reporte del retiro
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Finalizar
                        await expect(botonAceptar).toBeVisible(),
                        await botonAceptar.click()
                    ]);

                    // Esperar que el reporte este visible
                    await newPage.waitForTimeout(8000);
                    
                    // La pagina abierta con el reporte del retiro se debe cerrar
                    await newPage.close();

                    // Debe salir un modal
                    await expect(page.locator('text=¿Desea actualizar la libreta?')).toBeVisible();

                    // Click al boton de Cancelar
                    await page.locator('text=Cancelar').click();
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
        
            test.afterAll(async () => {
                // Cerrar la pagina
                await page.close();
        
                /* Cerrar el context */
                await context.close();
            });
        });
    };
});
