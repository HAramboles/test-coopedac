import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { selectBuscar, formComentario, formBuscar, actividadJuridicayRelacionado } from './utils/data/inputsButtons';
import { EscenariosPruebasCajaBoveda } from './utils/dataPages/interfaces';
import { url_base, url_transacciones_caja } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

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
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
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
                    // Seleccionar la cuenta de ahorros normales del socio  
                    await page.locator('text=AHORROS NORMALES').click();
                });

                test('No debe salir una alerta de Error de la Actividad Economica', async () => {
                    await expect(page.locator("text=Cannot destructure property 'CONCEPTO'")).not.toBeVisible();
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
                    await expect(page.getByLabel('Depósito a Cuenta AHORROS NORMALES').locator('input[type="text"]').nth(4)).toHaveValue(`${actividadJuridicayRelacionado}`);

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
        
                    // La tabla de las denominaciones debe estar visible en el modal 
                    await expect(page.getByLabel('Denominaciones').getByRole('columnheader', {name: 'Moneda'})).toBeVisible();
                    await expect(page.getByLabel('Denominaciones').getByRole('columnheader', {name: 'Cantidad'})).toBeVisible();
                    await expect(page.getByLabel('Denominaciones').getByRole('columnheader', {name: 'Monto'})).toBeVisible();
        
                    // Click al boton de Salir
                    await page.getByRole('button', {name: 'Salir'}).click();
        
                    // El modal debe cerrarse
                    await expect(modalDenominaciones).not.toBeVisible();
                });
            
                test('Datos de la Distribucion de Ingresos del Deposito a la Cuenta de Ahorros', async () => {
                    // En detalle distribucion, el monto pendiente a recibir tiene que tener una alerta roja
                    const iconoAlerta = page.getByLabel('Distribución de Ingresos').getByLabel('close-circle');
                    await expect(iconoAlerta).toBeVisible();
            
                    // Hacer la distribucion del dinero a depositar, en el caso de la prueba RD 1000
                    const cant1000 = page.locator('[id="1"]'); // Campo de RD 1000
            
                    // Cantidad = 100 de 1000
                    await cant1000.click();
                    await cant1000.fill('1');

                    // Esperar dos segundos
                    await page.waitForTimeout(2000);
            
                    // El icono de la alerta roja ya no debe estar visible al distribuirse correctamente lo recibido
                    await expect(iconoAlerta).not.toBeVisible();
            
                    // Hacer click al boton de Aceptar
                    const botonAceptar = page.getByRole('button', {name: 'check Aplicar'});
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();
                });

                test('Datos para el Reporte RTE', async () => {
                    // Debe salir otro modal para colocar la informacion para el reporte RTE
                    await expect(page.locator('text=CAPTURA DE DATOS. LAVADO DE EFECTIVO')).toBeVisible();

                    // El modal debe contener un aviso
                    await expect(page.getByText('Se requiere información de la persona que realiza la transacción. Puede buscar o crear la persona en las opciones de más abajo.')).toBeVisible();

                    // Colocar una explicacion para el Origen de Fondos
                    await page.locator('#form_ORIGEN_FONDOS').fill('Fondos obtenidos del Trabajo');

                    // Subtitulo del modal
                    await expect(page.locator('text=BUSCAR INTERMEDIARIO')).toBeVisible();

                    // Debe mostrarse un input para buscar un intermediario
                    await expect(page.locator(`${formBuscar}`)).toBeVisible();

                    // Debe mostrarse un boton para crear un intermediario
                    const botonCrearIntermediario = page.getByRole('button', {name: 'Crear Intermediario'});
                    await expect(botonCrearIntermediario).toBeVisible();

                    // Boton de Cliente es Intermediario
                    const botonClienteIntermediario = page.getByText('Cliente Intermediario');
                    await expect(botonClienteIntermediario).toBeVisible();

                    // Click al boton de Cliente Intermediario
                    await botonClienteIntermediario.click();

                    // Esperar que los datos de la persona se agreguen
                    await page.waitForTimeout(2000);

                    // Los datos del socio deben agregarse
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`, exact: true})).toBeVisible();

                    // Click al boton de Seleccionar
                    await page.getByText('Seleccionar').click();

                    // Debe salir otro modal para confirmar la informacion
                    await expect(page.locator('text=Confirmar')).toBeVisible();

                    // Contenido del modal
                    await expect(page.locator('text=Asegúrese de haber seleccionado a la persona correcta:')).toBeVisible();
                    await expect(page.getByText(`Nombre: ${nombre} ${apellido}`)).toBeVisible();
                    await expect(page.getByText('Doc. Identidad:')).toBeVisible();

                    // Click al boton de Aceptar del modal
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // Esperar que se abran dos nuevas pestañas con los reportes
                    const page1 = await context.waitForEvent('page');
                    const page2 = await context.waitForEvent('page');

                    // Cerrar las dos paginas
                    await page2.close();
                    await page1.close();

                    // Debe regresar a la pagina
                    await expect(page).toHaveURL(`${url_transacciones_caja}`);

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
                    // La actividad economica debe estar visible
                    await expect(page.getByLabel('RETIRO CUENTAS DE AHORROS').locator('input[type="text"]').nth(6)).toHaveValue(`${actividadJuridicayRelacionado}`);
                    
                    // Input del monto
                    const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
                    await expect(campoMonto).toBeVisible();
                    await campoMonto.fill('500.02');
            
                    // Agregar un comentario
                    await page.locator(`${formComentario}`).fill('Retiro de 500.02 pesos de la cuenta de Ahorros');

                    // Esperar dos segundos antes de hacer click en Aceptar
                    await page.waitForTimeout(2000);
            
                    // Aplicar el retiro
                    await page.getByRole('button', {name: 'check Aplicar'}).click();
                });

                test('Datos de la Distribucion de Egresos', async () => {
                    // Debe salir un modal para la distribucion de egresos
                    await expect(page.locator('text=DISTRIBUCIÓN DE EGRESOS')).toBeVisible();
            
                    // El modal debe contener 4 titulos y todos deben estar visibles
                    await expect(page.locator('h1').filter({hasText: 'MIS DENOMINACIONES'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'RECOMENDACIÓN DE DISTRIBUCIÓN'})).toBeVisible();

                    // Esperar que la tabla de distribucion este visible en el modal
                    await page.waitForTimeout(2000);
            
                    // Hacer la distribucion del dinero a retirar, en el caso de la prueba RD 500.02
                    const cant500 = page.locator('[id="14"]');
                    const cant01Decimal = page.locator('[id="22"]');
            
                    // Cantidad = 1 de 500
                    await cant500.click();
                    await cant500.fill('1');

                    // El input de Pendiente no puede tener 0 en los decimales
                    await expect(page.locator('(//INPUT[@autocomplete="off"])[54]')).toHaveValue('RD$ 0.02');

                    // Cantidad = 2 de 0.01
                    await cant01Decimal.click();
                    await cant01Decimal.fill('2');
            
                    // Luego de distribuir la cantidad, debe aparecer una opcion de Guardar Entregado
                    await expect(page.locator('text=Guardar Entregado')).toBeVisible();
            
                    // Hace click en Aceptar
                    const botonAceptar = page.getByRole('button', {name: 'check Aplicar'});
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();
            
                    // Se abrira una nueva pagina con el reporte del retiro
                    const page1 = await context.newPage();
                    
                    // La pagina abierta con el reporte del retiro se debe cerrar
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
