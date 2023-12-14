import { Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { selectBuscar } from './utils/data/inputsButtons';
import { url_base, url_solicitud_ordenes_pago } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig'

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Inputs de Sec. Desde y Hasta
let secDesde: Locator;
let secHasta: Locator;

// Cedula, nombre, apellido y correo de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;
let correo: string | null;

// Pruebas
test.describe.serial('Pruebas con la Solicitud de Ordenes de Pago', async () => {
    test.beforeAll(async () => {
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre, apellido y correo de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
        correo = await page.evaluate(() => window.localStorage.getItem('correoPersona'));

        // Inputs de Sec. Desde y Hasta
        secDesde = page.locator('#form_SEC_DESDE');
        secHasta = page.locator('#form_SEC_HASTA');
    });

    test('Ir a la opcion de Solicitud ordenes de pago', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Solicitud Ordenes de Pago
        await page.getByRole('menuitem', {name: 'Solicitud Ordenes de Pago'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_ordenes_pago}`);
    });

    test('Llenar los campos de la Solicitud', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD DE ORDENES DE PAGO'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);

        // Solo debe mostrarse la cuenta de Orden de Pago del Socio
        await expect(page.getByRole('option', {name: 'ORDEN DE PAGO'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'AHORROS NORMALES'})).not.toBeVisible();
        await expect(page.getByRole('option', {name: 'AHORROS POR NOMINA'})).not.toBeVisible();
        await expect(page.getByRole('option', {name: 'APORTACIONES'})).not.toBeVisible();

        // Elegir al socio buscado
        await page.getByText(`${nombre} ${apellido}`).click();

        // El correo del socio debe estar visible
        await expect(page.locator('#form_EMAIL')).toHaveValue(`${correo}@GMAIL.COM`);

        // Seccion detalles de la cuenta
        await expect(page.getByText('Detalles de la cuenta:')).toBeVisible();

        // Descripcion de la cuenta
        await expect(page.locator('#form_DESC_CUENTA')).toHaveValue('ORDEN DE PAGO');

        // Nombre Chequera
        await page.locator('#form_NOMBRE_CHEQUERA').fill('Chequera 123');

        // Cantidad Talonarios
        await page.locator('#form_CANTIDAD_TALONARIOS').fill('1');

        // Colocar un numero mayor en Sec. Desde que en Hasta

        // Sec. Desde
        await secDesde.fill('20');

        // Hasta
        await secHasta.fill('10');

        // Titulo formato de ordenes
        await expect(page.locator('text=Formato cheques:')).toBeVisible();

        // Formato Copia
        await expect(page.getByText('Formato Copia')).toBeVisible();

        // Elegir Sin Copia
        await page.locator('text=Sin copia').click();

        // Formato Logo
        await expect(page.getByText('Formato Logo')).toBeVisible();

        // Elegir Con Logo
        await page.locator('text=Con logo').click();

        // Tipo Cliente
        await expect(page.getByText('Tipo de cliente')).toBeVisible();

        // Elegir Fisica
        await page.locator('text=FISICA').click();
    });

    test('Error al Generar el reporte', async () => {
        // Boton Generar Reporte
        const generarReporte = page.getByRole('button', {name: 'Generar reporte'});

        // Click al oton de Generar Reporte
        await expect(generarReporte).toBeVisible();
        await generarReporte.click();

        // Debe mostrarse un mensaje de error en Sec. Desde
        await expect(page.locator('text=El campo "Desde" no puede ser mayor al campo "Hasta"')).toBeVisible();
    });

    test('Generar el reporte', async () => {
        // Colocar los datos correctamente en Sec. Desde y Hasta

        // Sec. Desde
        await secDesde.clear();
        await secDesde.fill('1');

        // El mensaje de error debe desaparecer
        await expect(page.locator('text=El campo "Desde" no puede ser mayor al campo "Hasta"')).not.toBeVisible();

        // Hasta
        await secHasta.clear();
        await secHasta.fill('100');

        // Boton Generar Reporte
        const generarReporte = page.getByRole('button', {name: 'Generar reporte'});

        // Click al boton de Generar Reporte
        await generarReporte.click();

        // Se abre una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await page1.close();

        // Debe regresar a la pagina de Solicitud de Ordenes de Pago
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD DE ORDENES DE PAGO'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
