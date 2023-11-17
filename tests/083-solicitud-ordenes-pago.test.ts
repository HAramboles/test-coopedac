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
        secDesde = page.locator('#form_FROM');
        secHasta = page.locator('#form_TO');
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

        // Elegir al socio buscado
        await page.getByText(`${nombre} ${apellido}`).click();

        // La cedula del socio debe estar visible
        await expect(page.locator('#form_DOCUMENTO_IDENTIDAD_SOLICITANTE')).toHaveValue(`${cedula}`);

        // El correo del socio debe estar visible
        await expect(page.locator('#form_CORREO_SOLICITANTE')).toHaveValue(`${correo}@GMAIL.COM`);

        // Nombre Chequera
        await page.locator('#form_CHECKER_NAME').fill('Chequera 123');

        // Cantidad Talonarios
        await page.locator('#form_talonario_cantidad').fill('1');

        // Colocar un numero mayor en Sec. Desde que en Hasta

        // Sec. Desde
        await secDesde.fill('20');

        // Hasta
        await secHasta.fill('10');

        // Titulo formato de ordenes
        await expect(page.locator('h1').filter({hasText: 'FORMATO DE ORDENES A SOLICITAR'})).toBeVisible();

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
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
