import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Pruebas con la Solicitud de Reprogramacion de Credito', () => {
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

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REPROGRAMACIÓN DE PRÉSTAMOS'})).toBeVisible();

        // Buscar a la persona
        await page.locator('#select-search').fill(`${nombre} ${apellido}`);
        // Seleccionar a la persona buscada
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Se debe mostrar el credito de la persona
        await expect(page.getByRole('row', {name: 'CRÉDITO HIPOTECARIO edit eye'}).getByRole('cell', {name: 'CRÉDITO HIPOTECARIO'})).toBeVisible();

        // Editar la solicitud
        await page.getByRole('cell', {name: 'edit eye'}).getByRole('button', {name: 'edit'}).click();
    });

    test('Cambiar los datos de la solicitud', async () => {
        // Cedula, nombre y apellido de la persona almacenada en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Datos del socio
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOCIO'})).toBeVisible();

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
        await page.getByLabel('CAMBIO DE PLAZO').check();

        // El campo para el cambio de plazo se debe mostrar
        const campoCambioPlazo = page.locator('#form_CAMB_PLAZO');
        await expect(campoCambioPlazo).toBeVisible();

        // Cambiar el plazo
        await campoCambioPlazo.fill('72');

        // Cambio de Tasa
        await page.getByLabel('CAMBIO DE TASA').check();

        // El campo para el cambio de tasa se debe mostrar
        const campoCambioTasa = page.locator('#form_CAMB_TASA');
        await expect(campoCambioTasa).toBeVisible();

        // Cambiar la tasa
        await campoCambioTasa.fill('15');

        // Cambiar la cuota a la sugerida
        await page.getByLabel('Cuota Sugerida:').click();

        // Razones
        await page.locator('#form_COMENTARIOS').fill('Necesita mas tiempo para los pagos');

        // Boton de Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        // Esperar que se abra una nueva pestaña con el reporte de la reprogramacion
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
        await expect(page.getByText('PENDIENTES', {exact: true})).toBeVisible();

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
        await expect(page.locator('#form_COMENTARIOS')).toHaveValue('NECESITA MAS TIEMPO PARA LOS PAGOS');

        // Click en Aceptar
        await page.getByRole('button', {name: 'Actualizar'}).click();

        // Deben salir dos mensajes de operacion exitosa
        await expect(page.locator('text=Solicitud de cambios productos actualizada exitosamente.')).toBeVisible();
        await expect(page.locator('text=Cambios Solicitados actualizado exitosamente')).toBeVisible();

        // Cerrar los mensajes
        await page.locator('[aria-label="close]').first().click();
        await page.locator('[aria-label="close]').click();

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

    test.afterAll(async () => {
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
    