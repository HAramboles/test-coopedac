import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataCerrar, selectBuscar } from './utils/dataTests';
import { EscenariosPruebasCajaBoveda } from './utils/interfaces';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula de la persona juridica
let cedulaEmpresa: string | null;

// Pruebas

test.describe.serial('Deposito a la Cuenta de Ahorros de la Persona Juridica - Pruebas con los diferentes Parametror', async () => {
    for (const escenarios of EscenariosPruebasCajaBoveda) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenarios).toString()}`, () => {
            test.beforeAll(async () => {
                /* Crear el browser, con la propiedad headless */
                browser = await chromium.launch({
                    headless: false
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
        
                // Cedula de la persona juridica almacenada en el state
                cedulaEmpresa = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridica'));
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
                await expect(page).toHaveURL(`${url_base}/transacciones_caja/01-4-1-2-2/`);
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
                    await buscarSocio.fill(`${cedulaEmpresa}`);
                    // Seleccionar la cuenta de ahorros del socio  
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
                    await campoMonto.fill('40000');
            
                    // Agregar un comentario
                    await page.locator('#form_COMENTARIO').fill('Deposito de 40000 pesos a la cuenta de Ahorros');
            
                    // Boton Agregar
                    await page.locator('text=Agregar').click();
            
                    // Debe salir un mensaje de que la operacion salio correctamente
                    await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();
            
                    // Cerrar el mensaje
                    await page.locator(`${dataCerrar}`).click();
                });
            
                test('Probar el Deposito de Centavos - Boton de Deposito de la cuenta de Ahorros', async () => {
                    // Boton de Deposito debe estar visible
                    const botonDeposito = page.getByRole('button', {name: 'DEPOSITO'});
                    await expect(botonDeposito).toBeVisible();
                    // Click al boton 
                    await botonDeposito.click();
            
                    // Debe aparecer un modal con las opciones para el deposito
                    await expect(page.locator('text=DEPÓSITO A CUENTA AHORROS NORMALES')).toBeVisible();
                });
            
                test('Probar el Deposito de Centavos - Datos del Deposito a la Cuenta de Ahorros', async () => {
                    // Input del monto
                    const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
                    await expect(campoMonto).toBeVisible();
                    await campoMonto.fill('200.05');
            
                    // Agregar un comentario
                    await page.locator('#form_COMENTARIO').fill('Deposito de 200.05 pesos a la cuenta de Ahorros');
            
                    // Boton Agregar
                    await page.locator('text=Agregar').click();
            
                    // Debe salir un mensaje de que la operacion salio correctamente
                    await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();
            
                    // Cerrar el mensaje
                    await page.locator(`${dataCerrar}`).click();
                });
            
                test('Datos de la Distribucion de Ingresos del Deposito a la Cuenta de Ahorros', async () => {
                    // Aplicar el deposito de la cuenta de ahorros
                    await page.locator('text=Aplicar').first().click();
            
                    // Debe salir un modal para la distribucion de ingresos
                    await expect(page.locator('text=DISTRIBUCIÓN DE INGRESOS')).toBeVisible();
            
                    // El modal debe contener 4 titulos y todos deben estar visibles
                    await expect(page.locator('h1').filter({hasText: 'RECIBIDO'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'RECOMENDACIÓN DE DISTRIBUCIÓN'})).toBeVisible();
            
                    // En detalle distribucion, el monto pendiente a recibir tiene que tener una alerta roja
                    const iconoAlerta = page.getByRole('img', {name: 'close-circle'});
                    await expect(iconoAlerta).toBeVisible();
            
                    // El monto para el cambio de categoria de Ahorrante a Empresarial es de 25000, colocar un monto mayor
            
                    // Hacer la distribucion del dinero a depositar, en el caso de la prueba RD 40000. Divididos en 1000
                    const cant1000 = page.locator('[id="1"]'); // Campo de RD 1000
            
                    // Cantidad = 40 de 1000
                    await cant1000.click();
                    await cant1000.fill('40');
            
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
            
                    // Click en Cancelar
                    await page.locator('text=Cancelar').click();
                });
            
                test('Probar el Deposito de Centavos - Datos de la Distribucion de Ingresos del Deposito a la Cuenta de Ahorros', async () => {
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
                    const iconoAlerta = page.getByRole('img', {name: 'close-circle'});
                    await expect(iconoAlerta).toBeVisible();
            
                    // Hacer la distribucion del dinero a depositar, en el caso de la prueba RD 200.05
                    // Divididos en 1000
                    const cant200 = page.locator('[id="3"]'); // Campo de RD 200
                    const cant01 = page.locator('[id="10"]'); // Campo de RD 0.1
            
                    // Cantidad = 1 de 10
                    await cant200.click();
                    await cant200.fill('1');
            
                    // Cantidad = 5 de 0.1
                    await cant01.click();
                    await cant01.fill('5');
            
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
            
                    // Click en Cancelar
                    const botonCancelarr = page.getByRole('button', {name: 'Cancelar'});
                    await expect(botonCancelarr).toBeVisible();
                    await botonCancelarr.click();
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