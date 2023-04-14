import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Parametros de solicitud de reprogramacion
interface SolicitudReprogramacionParametros {
    AGREGAR_SOLICITUD: 'S' | 'N' | ''
    TIPO_PRODUCTO: 'P' | ''
};

const EscenariosPrueba: SolicitudReprogramacionParametros[] = [
    {
        AGREGAR_SOLICITUD: 'N',
        TIPO_PRODUCTO: ''
    },
    {
        AGREGAR_SOLICITUD: 'N',
        TIPO_PRODUCTO: 'P'
    },
    {
        AGREGAR_SOLICITUD: '',
        TIPO_PRODUCTO: 'P'
    },
    {
        AGREGAR_SOLICITUD: '',
        TIPO_PRODUCTO: ''
    },
    {
        AGREGAR_SOLICITUD: 'S',
        TIPO_PRODUCTO: ''
    },
    {
        AGREGAR_SOLICITUD: 'S',
        TIPO_PRODUCTO: 'P'
    },
];

// Pruebas

test.describe('Solicitud de Reprogramacion - Pruebas con los diferentes parametros', () => {
    for (const escenario of EscenariosPrueba) {
        test.describe(`Test cuando el escenario es: ${Object.values(escenario).toString()}`, () => {
            test.beforeAll(async () => {
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

                // Eventos para la request actividad_parametro
                await page.route(/\/actividad_parametro/, async (route) => {
                    // Fetch con la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data).length > 1) {
                        // Remplazar el body de la response con los datos de los escenarios
                        body.data = Object.assign(body.data, escenario);
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
            });

            test('Ir a la opcion de Solicitud de Reprogramacion', async () => {
                // Negocios
                await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();
        
                // Operaciones
                await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

                // Solicitud Reprogramacion
                await page.getByRole('menuitem', {name: 'Solicitud Reprogramación'}).click();
        
                // La url debe de cambiar
                await expect(page).toHaveURL(`${url_base}/solicitud_reprogramacion/01-3-2-3?filter=pendientes`);

                // El titulo debe estar visible
                await expect(page.locator('h1').filter({hasText: 'SOLICITUD REPROGRAMACIÓN'})).toBeVisible();
            });

            // Escenarios de agregar solicitud '', N o S
            if (escenario.AGREGAR_SOLICITUD === 'N' || '' && escenario.TIPO_PRODUCTO === 'P' || '') {
                // Skip al test
                test.skip();
            } else if (escenario.AGREGAR_SOLICITUD === 'S' && escenario.TIPO_PRODUCTO === '') {
                // Skip al test
                test.skip();
            } else if (escenario.AGREGAR_SOLICITUD === 'S' && escenario.TIPO_PRODUCTO === 'P') {
                // Continuar con el test
                test('Nueva Solicitud', async () => {
                    // Boton Nueva Solicitud
                    const botonSolicitud = page.getByRole('button', {name: 'Nueva Solicitud'});
                    await expect(botonSolicitud).toBeVisible();
                    await botonSolicitud.click();
                });

                test('Buscar un socio y editar su solicitud', async () => {
                    // Nombre y apellido de la persona almacenada en el state
                    const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                    const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                    //
                    await expect(page.locator('h1').filter({hasText: 'REPROGRAMACIÓN DE PRÉSTAMOS'})).toBeVisible();

                    // Buscar a la persona
                    await page.locator('#select-search').fill(`${nombre} ${apellido}`);
                    // Seleccionar a la persona buscada
                    await page.locator(`text=${nombre} ${apellido}`).click();

                    // Se debe mostrar el credito de la persona
                    await expect(page.getByText('CRÉDITO HIPOTECARIO')).toBeVisible();

                    // Editar la solicitud
                    await page.locator('[data-icon="edit"]').click();
                });

                test('Cambiar los datos de la solicitud', async () => {
                    // Cedula, nombre y apellido de la persona almacenada en el state
                    const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
                    const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                    const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                    // Datos del socio
                    await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOCIO'})).toBeVisible();

                    // La cedula del socio debe estar visible
                    await expect(page.locator('#form_DOCUMENTOIDENTIDAD')).toHaveValue(`${cedula}`);

                    // El nombre del socio debe estar visible
                    await expect(page.locator('#form_NOMBRE')).toHaveValue(`${nombre} ${apellido}`);

                    // Datos del credito
                    await expect(page.locator('h1').filter({hasText: 'DATOS DEL CRÉDITO'})).toBeVisible();

                    // Tipo de garantia
                    await expect(page.locator('#form_ID_CLASE_GARANTIA')).toHaveValue('HIPOTECARIAS');

                    // Tipo credito 
                    await expect(page.locator('#form_ID_TIPO_PRESTAMO')).toHaveValue('HIPOTECARIOS');

                    // Oferta
                    await expect(page.locator('#form_DESC_OFERTA')).toHaveValue('CRÉDITO HIPOTECARIO');

                    // Grupo
                    await expect(page.locator('#form_DESC_GRUPO')).toHaveValue('SIN GARANTIA');

                    // Cambios solicitados
                    await expect(page.locator('h1').filter({hasText: 'CAMBIOS SOLICITADOS'})).toBeVisible();

                    // Cambios solicitados

                    // Cambio de Plazo
                    await page.getByLabel('').nth(1).check();

                    // El campo para el cambio de plazo se debe mostrar
                    const campoCambioPlazo = page.locator('#form_CAMB_PLAZO');
                    await expect(campoCambioPlazo).toBeVisible();

                    // Cambiar el plazo
                    await campoCambioPlazo.fill('72');

                    // Cambio de Tasa
                    await page.getByLabel('').nth(2).check();

                    // El campo para el cambio de tasa se debe mostrar
                    const campoCambioTasa = page.locator('#form_CAMB_TASA');
                    await expect(campoCambioTasa).toBeVisible();

                    // Cambiar la tasa
                    await campoCambioTasa.fill('15');

                    // Cambiar la cuota a la sugerida
                    await page.getByRole('radio').nth(1).click();

                    // Razones
                    await page.locator('#form_COMENTARIOS').fill('Necesita mas tiempo para los pagos');

                    // Boton de Aceptar
                    const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
                    // Esperar que se abra una nueva pestaña con los movimientos de la cuenta
                    const [newPage] = await Promise.all([
                        context.waitForEvent('page'),
                        // Click al boton de Aceptar
                        await expect(botonAceptar).toBeVisible(),
                        await botonAceptar.click()
                    ]);

                    // Cerrar la pagina con el reporte
                    await newPage.close();

                    // Se debe regresar a la pagina anterior y debe estar un mensaje de confirmacion
                    await expect(page.locator('text=Solicitud de cambios productos almacenado exitosamente.')).toBeVisible();

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();
                });

                test('Confirmar la Solicitud de Reprogramacion', async () => {
                    // Cedula, nombre y apellido de la persona almacenada en el state
                    const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
                    const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                    const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                    // Ir a la seccion de Reprogramacion Creditos
                    await page.getByRole('menuitem', {name: 'Reprogramación Créditos'}).click();

                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/reprogramacion_prestamos/01-3-2-2?filter=pendientes`);

                    // Buscar al socio
                    await page.locator('#form_search').fill(`${cedula}`);

                    // El estado de la solicitud tiene que estar pediente
                    await expect(page.getByText('PENDIENTE', {exact: true})).toBeVisible();

                    // Boton de confirmar
                    const botonConfirmar = page.getByRole('row', {name: `${nombre} ${apellido}`}).locator('[data-icon="check-circle"]');
                    await expect(botonConfirmar).toBeVisible();
                    // Click al boton
                    await botonConfirmar.click();

                    // Esperar que se muestre el modal con los datos de la solicitud de reprogramacion
                    await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOCIO'})).toBeVisible();

                    // Los cambios solicitados anteriormente deben estar visibles
                    await expect(page.locator('h1').filter({hasText: 'CAMBIOS SOLICITADOS'})).toBeVisible();
                    
                    // Cuota Sugerida
                    // await expect(page.locator('#form_CAMB_CUOTA')).toHaveValue('');

                    // Cambio de Plazo
                    await expect(page.locator('#form_CAMB_PLAZO')).toHaveValue('72');

                    // Cambio de Taza
                    await expect(page.locator('#form_CAMB_TASA')).toHaveValue('15%');

                    // Razones
                    await expect(page.locator('#form_COMENTARIOS')).toHaveValue('Necesita mas tiempo para los pagos');

                    // Click en Aceptar
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // La solicitud no debe estar en pendientes
                    await expect(page.getByRole('row', {name: `${nombre} ${apellido}`})).not.toBeVisible();
                });

                test('Confirmar que la Solicitud de reprogramacion haya sido Aprobada', async () => {
                    // Nombre y apellido de la persona almacenada en el state
                    const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                    const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

                    // Cambiar el estado de las solicitudes de Pendiente a Aprobado
                    await page.getByText('PENDIENTES', {exact: true}).click();
                    // Elegir el estado de aprobadas
                    await page.getByText('APROBADAS', {exact: true}).click();

                    // La URL debe cambiar
                    await expect(page).toHaveURL(`${url_base}/reprogramacion_prestamos/01-3-2-2?filter=aprobadas`);

                    // La solicitud aprobada debe estar visible
                    await expect(page.getByRole('row', {name: `${nombre} ${apellido}`})).toBeVisible();
                });
            };
    
            test.afterAll(async () => {
                // Cerrar la page
                await page.close();
    
                // Cerrar el context
                await context.close();
            });
        });
    };
});