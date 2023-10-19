import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, ariaCerrar, selectBuscar, dataGuardar, dataCerrar, browserConfig, formComentario, contextConfig, noData, actividadPersonaFisica } from './utils/dataTests';
import { diaAnterior } from './utils/fechas';
import { EscenariosPruebasCajaBoveda } from './utils/interfaces';
import { url_transacciones_caja } from './utils/urls';
import { numerosCheques } from './utils/cedulasypasaporte';

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
test.describe.serial('Transacciones de Caja - Deposito con Cheque - Ahorros Normales - Pruebas con los diferentes Parametros', async () => {
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
                    // La actividad economica debe estar visible
                    await expect(page.getByLabel('Depósito a Cuenta AHORROS NORMALES').locator('input[type="text"]').nth(4)).toHaveValue(`${actividadPersonaFisica}`);
                    
                    // Input del monto
                    const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
                    await expect(campoMonto).toBeVisible();
                    await campoMonto.fill('1000');
            
                    // Agregar un comentario
                    await page.locator(`${formComentario}`).fill('Deposito de un cheque de 1000 pesos a la cuenta de Ahorros');
            
                    // Boton Aplicar
                    await page.locator('text=Aplicar').click();
            
                    // Debe salir un mensaje de que la operacion salio correctamente
                    await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();
                });

                test('Modal de Distribucion de Ingresos', async () => {
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
        
                    // Las denominaciones de la caja deben estar visibles
                    const noDenominaciones = page.getByRole('dialog').getByText(`${noData}`);
                    if (await noDenominaciones.isVisible()) {
                        await page.close();
                        await context.close();
                    }
        
                    // Click al boton de Salir
                    await page.getByRole('button', {name: 'Salir'}).click();
        
                    // El modal debe cerrarse
                    await expect(modalDenominaciones).not.toBeVisible();
                });
                
                test('Datos de la Distribucion de Ingresos del Deposito a la Cuenta de Ahorros', async () => {
                    // En detalle distribucion, el monto pendiente a recibir tiene que tener una alerta roja
                    const iconoAlerta = page.getByRole('img', {name: 'close-circle'}).first();
                    await expect(iconoAlerta).toBeVisible();
                });

                test('Agregar un Cheque', async () => {
                    // Click al boton de Incluir Cheques
                    await page.locator('text=Incluir cheque(s)').click();

                    // Aprece una tabla donde se colocan los cheques agregados
                    await expect(page.locator('h1').filter({hasText: 'CHEQUES'})).toBeVisible();

                    // Click al boton de Agrergar Cheque
                    const botonAgregarCheque = page.getByRole('button', {name: 'Agregar Cheque'});
                    await expect(botonAgregarCheque).toBeVisible();
                    await botonAgregarCheque.click();

                    // Aparecen los campos para agregar los datos del cheque

                    // No. documento
                    await page.locator('#form_NO_DOCUMENTO').fill(`${numerosCheques}`);

                    // Banco
                    await page.locator('#form_BANCO').fill('ALAVER');
                    // Click a la opcion del banco buscado
                    await page.locator('text=ALAVER').click();

                    // Fecha
                    await page.locator('#form_FECHA_EMISION').fill(`${diaAnterior}`);

                    // Emisor/Girador
                    await page.locator('#form_EMISOR').fill('Hector');

                    // Beneficiario/Portador
                    await page.locator('#form_BENEFICIARIO').fill(`${nombre} ${apellido}`);

                    // Monto
                    await page.locator('#form_MONTO').fill('1000');

                    // Click al boton de Guardar
                    await page.locator(`${dataGuardar}`).click();

                    // Debe aparecer un mensaje de confirmacion
                    await expect(page.locator('text=¿Deseas guardar la operación?')).toBeVisible();

                    // Click al boton de Aceptar del modal
                    await page.getByRole('button', {name: 'check Aceptar'}).click();

                    // Icono de alerta rojo
                    const iconoAlerta = page.getByRole('img', {name: 'close-circle'}).first();
                    // El icono de la alerta roja ya no debe estar visible al distribuirse correctamente lo recibido
                    await expect(iconoAlerta).not.toBeVisible();
            
                    // Hacer click al boton de Aplicar
                    const botonAplicar = page.getByRole('button', {name: 'check Aplicar'});
                    await expect(botonAplicar).toBeVisible();
                    await botonAplicar.click();

                    // Esperar que se abra una nueva pestaña con el reporte
                    const page1 = await context.waitForEvent('page');

                    // Cerrar la nueva pestaña
                    await page1.close();
                });

                test('Cerrar la sesion', async () => {
                    // Luego de que se cierre la nueva pestaña, se debe regresar a la pagina anterior
                    await expect(page).toHaveURL(`${url_transacciones_caja}`);
            
                    // Debe aparecer un modal con el mensaje de actualizar la libreta
                    await expect(page.locator('text=Actualizar libreta')).toBeVisible();
            
                    // Click en Cancelar
                    const botonCancelar = page.getByRole('button', {name: 'Cancelar'});
                    await expect(botonCancelar).toBeVisible();
                    await botonCancelar.click();

                    // Cerrar las alertas que aparecen
                    await page.locator(`${dataCerrar}`).first().click();
                    await page.locator(`${dataCerrar}`).first().click();
                    await page.locator(`${dataCerrar}`).first().click();;
                });

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
        
            test.afterAll(async () => {
                // Cerrar la pagina
                await page.close();
        
                /* Cerrar el context */
                await context.close();
            });
        });
    };
});
