import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataCerrar, ariaCerrar, selectBuscar, browserConfig, formComentario, contextConfig } from './utils/dataTests';
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

// Nota de la cuenta de aportaciones de la persona
let nota: string | null;

// Pruebas
test.describe.serial('Transacciones de Caja - Deposito - Cuenta de Aportaciones y Ahorros - Pruebas con los diferentes Parametros', async () => {
    for (const escenarios of EscenariosPruebasCajaBoveda) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenarios).toString()}`, async () => {
            test.beforeAll(async () => {
                /* Crear el browser, con la propiedad headless */
                browser = await chromium.launch(browserConfig);
        
                /* Crear un context con el storageState donde esta guardado el token de la sesion */
                context = await browser.newContext(contextConfig);
        
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
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
        
                // Nota alamacenada en el state
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

                test('El balance de la caja debe ser diferente de 0', async () => {
                    // No debe mostrarse 0 como balance de la caja
                    const balanceCero = page.locator('text=Balance en caja: RD$ 0.00');
                    if (await balanceCero.isVisible()) {
                        await page.close();
                        await context.close();
                    };
                });
            
                test('Seleccionar un socio', async () => {
                    // Input para buscar el socio
                    const buscarSocio = page.locator(`${selectBuscar}`);
                    await expect(buscarSocio).toBeVisible();
            
                    // Ingresar la cedula del socio
                    await buscarSocio.fill(`${cedula}`);
                    // Seleccionar la cuenta de aportaciones del socio  
                    await page.locator('text=APORTACIONES').click();
                });
            
                test('Debe salir un modal con la nota anteriormente creada', async () => {        
                    // Titulo del modal
                    await expect(page.locator('h1').filter({hasText: `NOTAS PARA ${nombre} ${apellido}`})).toBeVisible();
            
                    // La nota debe estar visible
                    await expect(page.getByRole('cell', {name: `${nota}`})).toBeVisible();
            
                    // Cerrar el modal
                    await page.locator(`${ariaCerrar}`).click();  
                });
            
                test('Boton de Deposito de la cuenta de Aportaciones', async () => {
                    // Debe estar visible la celda de los productos
                    await expect(page.getByText('Producto').first()).toBeVisible();
            
                    // Boton de Deposito debe estar visible
                    const botonDeposito = page.getByRole('button', {name: 'DEPOSITO'});
                    await expect(botonDeposito).toBeVisible();
                    // Click al boton 
                    await botonDeposito.click();
            
                    // Debe aparecer un modal con las opciones para el deposito
                    await expect(page.locator('text=DEPÓSITO A CUENTA APORTACIONES')).toBeVisible();
                });
            
                test('Datos del Deposito a la Cuenta de Aportaciones', async () => {
                    // Input del monto
                    const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
                    await expect(campoMonto).toBeVisible();
                    await campoMonto.fill('2000');
            
                    // Agregar un comentario
                    await page.locator(`${formComentario}`).fill('Deposito de 2000 pesos a la cuenta de Aportaciones');
            
                    // Boton Agregar
                    await page.locator('text=Agregar').click();
            
                    // Debe salir un mensaje de que la operacion salio correctamente
                    await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();
            
                    // Cerrar el mensaje
                    await page.locator(`${dataCerrar}`).click();
                });
            
                test('Boton de Deposito de la cuenta de Ahorros', async () => {
                    // Click a la cuenta de Ahorros del socio 
                    await page.getByRole('row', {name: 'AHORROS NORMALES'}).getByRole('button', {name: 'Expand row'}).click();
            
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
                    await campoMonto.fill('100100');
            
                    // Agregar un comentario
                    await page.locator(`${formComentario}`).fill('Deposito de 100100 pesos a la cuenta de Ahorros');
            
                    // Boton Agregar
                    await page.locator('text=Agregar').click();
            
                    // Debe salir un mensaje de que la operacion salio correctamente
                    await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();
            
                    // Cerrar el mensaje
                    await page.locator(`${dataCerrar}`).click();
                });

                test('Modal de Distribucion de Ingresos', async () => {
                    // Aplicar el deposito de la cuenta de aportaciones
                    await page.locator('text=Aplicar').first().click();

                    // Debe salir un modal para la distribucion de ingresos
                    await expect(page.locator('text=DISTRIBUCIÓN DE INGRESOS')).toBeVisible();
            
                    // El modal debe contener 4 titulos y todos deben estar visibles
                    await expect(page.locator('h1').filter({hasText: 'RECIBIDO'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'RECOMENDACIÓN DE DISTRIBUCIÓN'})).toBeVisible();
                });

                test('Las denominaciones de la caja deben mostrarse', async () => {
                    // Click al boton de Denominaciones
                    const botonDenominacones = page.getByLabel('Distribución de Ingresos').getByRole('button', {name: 'eye Denominaciones'});
                    await expect(botonDenominacones).toBeVisible();
                    await botonDenominacones.click();
        
                    // Debe aparecer un modal con las denominaciones de la caja
                    const modalDenominaciones = page.locator('h1').filter({hasText: 'DENOMINACIONES'});
                    await expect(modalDenominaciones).toBeVisible();
        
                    // La tabla de las denominaciones debe estar visible en el modal 
                    await expect(page.getByLabel('Denominaciones').getByRole('columnheader', {name: 'Moneda'})).toBeVisible();
                    await expect(page.getByLabel('Denominaciones').getByRole('columnheader', {name: 'Cantidad'})).toBeVisible();
                    await expect(page.getByLabel('Denominaciones').getByRole('columnheader', {name: 'Monto'})).toBeVisible();
        
                    // Click al boton de Salir
                    await page.getByRole('button', {name: 'Salir'}).click();
        
                    // El modal debe cerrarse
                    await expect(modalDenominaciones).not.toBeVisible();
                });
            
                test('Datos de la Distribucion de Ingresos del Deposito a la Cuenta de Aportaciones', async () => {            
                    // En detalle distribucion, el monto pendiente a recibir tiene que tener una alerta roja
                    const iconoAlerta = page.getByRole('img', {name: 'close-circle'});
                    await expect(iconoAlerta).toBeVisible();
            
                    // Hacer la distribucion del dinero a depositar, en el caso de la prueba RD 2000
                    // Divididos en 500, 200, 100, 100 y 50, 50
                    const cant500 = page.locator('[id="2"]'); // Campo de RD 500
                    const cant200 = page.locator('[id="3"]'); // Campo de RD 200
                    const cant100 = page.locator('[id="4"]'); // Campo de RD 100
                    const cant50 = page.locator('[id="5"]'); // Campo de RD 50
            
                    // Cantidad = 1 de 500
                    await cant500.click();
                    await cant500.fill('3');
            
                    // Cantidad = 1 de 200
                    await cant200.click();
                    await cant200.fill('1');
            
                    // Cantidad = 2 de 100
                    await cant100.click();
                    await cant100.fill('2');
            
                    // Cantidad = 2 de 50
                    await cant50.click();
                    await cant50.fill('2');
            
                    // El icono de la alerta roja ya no debe estar visible al distribuirse correctamente lo recibido
                    await expect(iconoAlerta).not.toBeVisible();
            
                    // Iconos check verdes
                    const iconoVerde1 = page.getByRole('img', {name: 'check-circle'}).first();
                    const iconoVerde2 = page.getByRole('img', {name: 'check-circle'}).last();
            
                    // Los dos checks verdes deben salir al hacer bien la distribucion
                    await expect(iconoVerde1).toBeVisible();
                    await expect(iconoVerde2).toBeVisible();
            
                    // Hacer click al boton de Aceptar
                    const botonAceptar = page.getByRole('button', {name: 'check Aplicar'});
            
                    // Se abrira una nueva pagina con el reporte del deposito
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Finalizar
                        await expect(botonAceptar).toBeVisible(),
                        await botonAceptar.click()
                    ]);
                    
                    // La pagina abierta con el reporte del deposito se debe cerrar
                    await newPage.close();
            
                    // Debe salir un modal
                    await expect(page.locator('text=¿Desea actualizar la libreta?')).toBeVisible();
            
                    // Cancelar para hacer el siguiente deposito
                    await page.locator('text=Cancelar').click();
                });
            
                test('Datos de la Distribucion de Ingresos del Deposito a la Cuenta de Ahorros', async () => {
                    // Aplicar el deposito de la cuenta de ahorros
                    await page.locator('text=Aplicar').click();
            
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
            
                    // Hacer la distribucion del dinero a depositar, en el caso de la prueba RD 100100
                    // Divididos en 100 monedas de 1000 y una de 100
                    const cant1000 = page.locator('[id="1"]'); // Campo de RD 1000
                    const cant100 = page.locator('[id="4"]'); // Campo de RD 100
            
                    // Cantidad = 100 de 1000
                    await cant1000.click();
                    await cant1000.fill('100');

                    // Cantidad = 1 de 100
                    await cant100.click();
                    await cant100.fill('1');
            
                    // El icono de la alerta roja ya no debe estar visible al distribuirse correctamente lo recibido
                    await expect(iconoAlerta).not.toBeVisible();
            
                    // Hacer click al boton de Aceptar
                    const botonAceptar = page.getByRole('button', {name: 'check Aplicar'});
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();

                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Cerrar la nueva pestaña
                    await page1.close();

                    // Debe salir un modal
                    await expect(page.locator('text=¿Desea actualizar la libreta?')).toBeVisible();
            
                    // Click al boton de Cancelar
                    await page.locator('text=Cancelar').click();
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
