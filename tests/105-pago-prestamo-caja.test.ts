import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, selectBuscar, ariaCerrar } from './utils/dataTests';
import { url_transacciones_caja } from './utils/urls';
import { EscenariosPruebasCajaBoveda } from './utils/interfaces';

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
test.describe.serial('Pago a Prestamo desde Caja = Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosPruebasCajaBoveda) {
        test.describe(`Tests cuando el escenario es: ${Object.values(escenarios).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch({
                    headless: browserConfig.headless,
                    args: browserConfig.args
                });

                // Crear el context
                context = await browser.newContext({
                    storageState: 'state.json'
                });

                // Crear la page
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

                // Ingresar a la pagina
                await page.goto(`${url_base}`);

                // Cedula, nombre y apellido de la persona almacenada en el state
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                // Nota almacendad en el state
                nota = await page.evaluate(() => window.localStorage.getItem('nota'));
            });

            test('Ir a la opcion de Transacciones de Caja', async () => {
                // Tesoreria
                await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

                // Cajas
                await page.getByRole('menuitem', {name: 'CAJAS'}).click();

                // Operaciones
                await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

                // Transacciones de Caja
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
                    await buscarSocio.fill('JADE JOHNSON');
                    // Seleccionar la cuenta de aportaciones del socio  
                    await page.locator('text=APORTACIONES').click();
                });

                test.skip('Debe salir un modal con la nota anteriormente creada', async () => {        
                    // Titulo del modal
                    await expect(page.locator('h1').filter({hasText: `NOTAS PARA ${nombre} ${apellido}`})).toBeVisible();
            
                    // La nota debe estar visible
                    await expect(page.getByRole('cell', {name: `${nota}`})).toBeVisible();
            
                    // Cerrar el modal
                    await page.locator(`${ariaCerrar}`).click();  
                });

                test('Boton de Pagos del Prestamo', async () => {
                    // Debe estar visible el prestamo de la persona
                    await expect(page.getByRole('cell', {name: 'CRÉDITO GERENCIAL / AHORROS'})).toBeVisible();

                    // Click al boton de expandir del prestamo
                    await page.getByRole('row', {name: 'Expandir fila CRÉDITO GERENCIAL / AHORROS'}).getByRole('button', {name: 'Expandir fila'}).click();

                    // Boton de Pagos
                    const botonPagos = page.getByRole('button', {name: 'Pagos'});
                    await expect(botonPagos).toBeVisible();

                    // Click al boton de Pagos
                    await botonPagos.click();
                });

                test('Hacer un Abono a Capital al Prestamo', async () => {
                    // Debe aparecer el modal de pagos
                    const modalPagos = page.locator('h1').filter({hasText: 'PAGO A PRÉSTAMO'});
                    await expect(modalPagos).toBeVisible();

                    // Seccion Datos Generales
                    await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

                    // Socio
                    // await expect(page.locator('#form_NOMBREPERSONA')).toHaveValue(`${nombre} ${apellido}`);
                    await expect(page.locator('#form_NOMBREPERSONA')).toHaveValue('JADE JOHNSON');

                    // Prestamo
                    await expect(page.locator('#form_DESCOFERTA')).toHaveValue('CRÉDITO GERENCIAL / AHORROS');

                    // Seccion Opciones de Pago
                    await expect(page.locator('h1').filter({hasText: 'OPCIONES DE PAGO'})).toBeVisible();

                    // Colocar un monto en Abono a Capital
                    const inputAbonoCapital = page.locator('#form_MONTO_ABONO_CAPITAL');
                    await inputAbonoCapital.fill('5000');

                    // Debe colocarse el monto en el campo de Abono a Capital
                    await expect(inputAbonoCapital).toHaveValue('RD$ 5,000');

                    // Click al boton de Aplicar
                    const botonAplicar = page.locator('button').filter({hasText: 'Aplicar'});
                    await expect(botonAplicar).toBeVisible();
                    await botonAplicar.click();
                });

                test('Realizar la Distribucion de Ingresos para el Pago a Prestamo', async () => {
                    // Se abre un modal para la distribucion de ingresos
                    const modalDistribucion = page.locator('h1').filter({hasText: 'DISTRIBUCIÓN DE INGRESOS'});
                    await expect(modalDistribucion).toBeVisible();

                    // El modal debe contener 4 titulos y todos deben estar visibles
                    await expect(page.locator('h1').filter({hasText: 'RECIBIDO'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'RECOMENDACIÓN DE DISTRIBUCIÓN'})).toBeVisible();

                    // En detalle distribucion, el monto pendiente a recibir tiene que tener una alerta roja
                    const iconoAlerta = page.getByRole('img', {name: 'close-circle'});
                    await expect(iconoAlerta).toBeVisible();

                    // Hacer la distribucion del dinero para el pago, en el caso de la prueba RD 5000
                    const cant1000 = page.locator('[id="1"]'); // Campo de RD 1000

                    // Cantidad = 100 de 1000
                    await cant1000.click();
                    await cant1000.fill('5');

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
            
                    // Se abrira una nueva pagina con el reporte del pago al prestamo
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Finalizar
                        await expect(botonAceptar).toBeVisible(),
                        await botonAceptar.click()
                    ]);
                    
                    // La pagina abierta con el reporte del pago al prestamo
                    await newPage.close();
                });

                test('Realizar otro Pago al Prestamo', async () => {
                    // Boton de Pagos
                    const botonPagos = page.getByRole('button', {name: 'Pagos'});
                    await expect(botonPagos).toBeVisible();

                    // Click al boton de Pagos
                    await botonPagos.click();

                    // Debe aparecer el modal de pagos
                    const modalPagos = page.locator('h1').filter({hasText: 'PAGO A PRÉSTAMO'});
                    await expect(modalPagos).toBeVisible();

                    // Seccion Datos Generales
                    await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

                    // Socio
                    // await expect(page.locator('#form_NOMBREPERSONA')).toHaveValue(`${nombre} ${apellido}`);
                    await expect(page.locator('#form_NOMBREPERSONA')).toHaveValue('JADE JOHNSON');

                    // Prestamo
                    await expect(page.locator('#form_DESCOFERTA')).toHaveValue('CRÉDITO GERENCIAL / AHORROS');

                    // Seccion Opciones de Pago
                    await expect(page.locator('h1').filter({hasText: 'OPCIONES DE PAGO'})).toBeVisible();

                    // Colocar un monto en Abono a Capital
                    const inputAbonoCapital = page.locator('#form_MONTO_ABONO_CAPITAL');
                    await inputAbonoCapital.fill('5000');

                    // Debe colocarse el monto en el campo de Abono a Capital
                    await expect(inputAbonoCapital).toHaveValue('RD$ 5,000');

                    // Click al boton de Aplicar
                    const botonAplicar = page.locator('button').filter({hasText: 'Aplicar'});
                    await expect(botonAplicar).toBeVisible();
                    await botonAplicar.click();
                });

                test('Realizar la distribucion del segundo Pago al Prestamo', async () => {
                    // Se abre un modal para la distribucion de ingresos
                    const modalDistribucion = page.locator('h1').filter({hasText: 'DISTRIBUCIÓN DE INGRESOS'});
                    await expect(modalDistribucion).toBeVisible();

                    // El modal debe contener 4 titulos y todos deben estar visibles
                    await expect(page.locator('h1').filter({hasText: 'RECIBIDO'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'RECOMENDACIÓN DE DISTRIBUCIÓN'})).toBeVisible();

                    // En detalle distribucion, el monto pendiente a recibir tiene que tener una alerta roja
                    const iconoAlerta = page.getByRole('img', {name: 'close-circle'});
                    await expect(iconoAlerta).toBeVisible();

                    // Hacer la distribucion del dinero para el pago, en el caso de la prueba RD 5000
                    const cant1000 = page.locator('[id="1"]'); // Campo de RD 1000

                    // Cantidad = 100 de 1000
                    await cant1000.click();
                    await cant1000.fill('5');

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
            
                    // Se abrira una nueva pagina con el reporte del pago al prestamo
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Finalizar
                        await expect(botonAceptar).toBeVisible(),
                        await botonAceptar.click()
                    ]);
                    
                    // La pagina abierta con el reporte del pago al prestamo
                    await newPage.close();
                })

                test('Liberar la Sesion', async () => {
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

            test.afterAll(async () => { // Despues de las pruebas
                // Cerrar la page
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});
