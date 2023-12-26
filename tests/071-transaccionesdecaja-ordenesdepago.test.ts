import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { ariaCerrar, selectBuscar, formBuscar, formComentario, actividadPersonaFisica } from './utils/data/inputsButtons';
import { diaActualFormato, diaSiguiente } from './utils/functions/fechas';
import { EscenariosPruebasCajaBoveda } from './utils/dataPages/interfaces';
import { url_base, url_transacciones_caja } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { servicios_datos_persona_orden_pago } from './utils/dataPages/servicios';

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
test.describe.serial('Pruebas con Transacciones de Caja - Orden de Pago', async () => {
    for (const escenarios of EscenariosPruebasCajaBoveda) {
        test.describe(`Tests cuando el parametro es: ${Object.values(escenarios).toString()}`, async () => {
            test.beforeAll(async () => { // Antes de todas las pruebas
                // Crear el browser
                browser = await chromium.launch(browserConfig);
        
                // Crear el context
                context = await browser.newContext(contextConfig);
        
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

            // Funcion para cerrar las paginas que se abren con los diferentes reportes en los pasos de la solicitud de credito
            const CerrarPaginasReportes = async () => {
                context.on('page', async (page) => {
                    await page.waitForTimeout(1000);
                    await page.close();
                });
            };
        
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
                test('Transacciones de Caja - Deposito a la cuenta de Orden de Pago', async () => {        
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
                    await page.locator('text=ORDEN DE PAGO').click();
                });
            
                test('Debe salir un modal con la nota anteriormente creada', async () => {
                    // Titulo del modal
                    await expect(page.locator('h1').filter({hasText: `NOTAS PARA ${nombre} ${apellido}`})).toBeVisible();
            
                    // La nota debe estar visible
                    await expect(page.getByRole('cell', {name: `${nota}`})).toBeVisible();
            
                    // Cerrar el modal
                    await page.locator(`${ariaCerrar}`).click();  
                });

                test('Boton de Deposito', async () => {
                    // Boton de Deposito debe estar visible
                    const botonDeposito = page.getByRole('button', {name: 'DEPOSITO'});
                    await expect(botonDeposito).toBeVisible();
                    // Click al boton
                    await botonDeposito.click();
            
                    // Debe aparecer un modal con las opciones para el Deposito
                    await expect(page.locator('text=DEPÓSITO A CUENTA ORDEN DE PAGO')).toBeVisible();
                });

                test('Colocar el monto del Deposito', async () => {
                    // La actividad economica debe estar visible
                    await expect(page.getByLabel('Depósito a Cuenta ORDEN DE PAGO').locator('input[type="text"]').nth(4)).toHaveValue(`${actividadPersonaFisica}`);

                    // Input del monto
                    const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
                    await expect(campoMonto).toBeVisible();
                    await campoMonto.fill('1500');
            
                    // Agregar un comentario
                    await page.locator(`${formComentario}`).fill('Deposito de 1500 a la cuenta de Orden de Pago');
            
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
                
                test('Datos de la Distribucion de Ingresos del Deposito a la Cuenta de Orden de Pago', async () => {
                    // En detalle distribucion, el monto pendiente a recibir tiene que tener una alerta roja
                    const iconoAlerta = page.getByRole('img', {name: 'close-circle'});
                    await expect(iconoAlerta).toBeVisible();

                    // Hacer la distribucion del dinero a depositar, en el caso de la prueba RD 1500. Divididos en 1000 y 500
                    const cant1000 = page.locator('[id="1"]'); // Campo de RD 1000
                    const cant500 = page.locator('[id="2"]'); // Campo de RD 500
            
                    // Cantidad = 1 de 1000
                    await cant1000.click();
                    await cant1000.fill('1');

                    // Cantidad = 1 de 500
                    await cant500.click();
                    await cant500.fill('1');

                    // Esperar dos segundos
                    await page.waitForTimeout(2000);
            
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
                    // await botonCrearIntermediario.click();

                    // Boton de Cliente es Intermediario
                    const botonClienteIntermediario = page.getByText('Cliente Intermediario');
                    await expect(botonClienteIntermediario).toBeVisible();

                    // Click al boton de Cliente Intermediario
                    await botonClienteIntermediario.click();

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

                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'TRANSACCIONES DE CAJA'})).toBeVisible();
                });
            
                test('Boton de Ordenes', async () => {
                    // Debe estar visible la celda de los productos
                    await expect(page.getByText('Producto').first()).toBeVisible();
                    
                    // Boton de Retiro debe estar visible
                    const botonRetiro = page.getByRole('button', {name: 'ORDENES'});
                    await expect(botonRetiro).toBeVisible();
                    // Click al boton
                    await botonRetiro.click();
            
                    // Debe aparecer un modal con las opciones para el retiro
                    await expect(page.locator('text=ÓRDENES DE PAGO')).toBeVisible();

                    // Esperar a que el servicio datos de la persona cargue
                    await page.waitForResponse(`${servicios_datos_persona_orden_pago}`);
                    await page.waitForTimeout(3000);
                });
            
                test('Datos de la Orden de Pago', async () => {
                    // Se deben mostrar el titular 
                    await expect(page.locator('text=FIRMANTES')).toBeVisible();
                    await expect(page.getByRole('cell', {name: 'TITULAR'})).toBeVisible();
                    
                    // El titulo de las firmas debe estar visible
                    await expect(page.getByRole('heading', {name: 'Firmas Autorizadas'})).toBeVisible();

                    // Numero de orden
                    await page.locator('#form_NUM_ORDEN').fill('59');
            
                    // Input del monto
                    const campoMonto = page.locator('#form_MONTO_MOVIMIENTO');
                    await expect(campoMonto).toBeVisible();
                    await campoMonto.fill('100');

                    // Colocar una fecha de orden invalida
                    const fechaOrden = page.locator('#form_FECHA_ORDEN');
                    await fechaOrden.fill(`${diaSiguiente}`);
                    // Click fuera del input
                    await page.locator('text=FIRMANTES').click();

                    // Debe aparecer un mensaje de error
                    await expect(page.locator('text=Rango de Fecha inválido.')).toBeVisible();

                    // Colocar una fecha de orden valida
                    await fechaOrden.fill(`${diaActualFormato}`);

                    // Click al boton Titular es Beneficiario
                    await page.getByText('Titular es Beneficiario').click();

                    // Click al boton Titular es Portador
                    await page.getByText('Titular es Portador').click();
            
                    // Agregar un comentario
                    await page.locator(`${formComentario}`).fill('Orden de Pago de 100 pesos');
            
                    // Boton Aplicar
                    await page.locator('text=Aplicar').click();
            
                    // Debe salir un mensaje de que la operacion salio correctamente
                    await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();
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
                    const cant100 = page.locator('[id="16"]');
            
                    // Cantidad = 2 de 50
                    await cant100.click();
                    await cant100.fill('1');
            
                    // Luego de distribuir la cantidad, debe aparecer una opcion de Guardar Entregado
                    await expect(page.locator('text=Guardar Entregado')).toBeVisible();
            
                    // Hace click en Aceptar
                    const botonAceptar = page.getByRole('button', {name: 'check Aplicar'});
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();

                    // Aparece un modal para colocar el destino de los fondos retirados
                    await expect(page.locator('h1').filter({hasText: 'CAPTURA DE DATOS. LAVADO DE EFECTIVO'})).toBeVisible();

                    // Mensaje de aviso del modal
                    await expect(page.locator('text=Aviso - Información Requerida')).toBeVisible();

                    // Colocar un destino de los fondos
                    await page.locator('#form_ORIGEN_FONDOS').fill('Retiro para uso personal');

                    // Boton de Cliente es Intermediario
                    const botonClienteIntermediario = page.getByText('Cliente Intermediario');
                    await expect(botonClienteIntermediario).toBeVisible();

                    // Click al boton de Cliente Intermediario
                    await botonClienteIntermediario.click();

                    // Los datos del socio deben agregarse
                    await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

                    // Click al boton de Seleccionar
                    await page.getByText('Seleccionar').click();

                    // Debe salir otro modal para confirmar la informacion
                    await expect(page.locator('text=Confirmar')).toBeVisible();

                    // Contenido del modal
                    await expect(page.locator('text=Asegúrese de haber seleccionado a la persona correcta:')).toBeVisible();
                    await expect(page.getByText(`Nombre: ${nombre} ${apellido}`)).toBeVisible();
                    await expect(page.getByText('Doc. Identidad:')).toBeVisible();

                    // Click al boton de Aceptar del modal
                    await page.getByRole('button', {name: 'check Aceptar'}).click();

                    // Cerrar las paginas que se abren con los diferentes reportes
                    CerrarPaginasReportes();

                    // Debe regresar a la pagina
                    await expect(page.locator('h1').filter({hasText: 'TRANSACCIONES DE CAJA'})).toBeVisible();

                    await page.waitForTimeout(3000);

                    // No deben mostrarse ingresos o egresos en transito
                    await expect(page.getByRole('cell', {name: 'RETIRO', exact: true})).not.toBeVisible();
                    await expect(page.getByRole('button', {name: 'Aplicar'})).not.toBeVisible();
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
