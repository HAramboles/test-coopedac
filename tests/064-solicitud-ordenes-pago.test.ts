import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar } from './utils/dataTests';
import { formatDate, primerDiaMes } from './utils/utils';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre, apellido y correo de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;
let correo: string | null;

// Pruebas

test.describe.serial('Pruebas con la Solicitud de Ordenes de Pago', async () => {
    test.beforeAll(async () => {
        // Crear el browser
        browser = await chromium.launch({
            headless: false,
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre, apellido y correo de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
        correo = await page.evaluate(() => window.localStorage.getItem('correoPersona'));
    });

    test('Ir a la opcion de Solicitud ordenes de pago', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Solicitud Ordenes de Pago
        await page.getByRole('menuitem', {name: 'Solicitud Ordenes de Pago'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_ordenes_pago/01-2-2-112/`);
    });

    test('Llenar los campos de la Solicitud', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD DE ORDENES DE PAGO'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);
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

        // Sec. Desde
        await page.locator('#form_FROM').fill('10');

        // Hasta
        await page.locator('#form_TO').fill('20');

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

        // Elegir Fisicia
        await page.locator('text=FISICA').click();
    });

    test('Generar el reporte', async () => {
        // Boton de Generar Reporte
        const generarReporte = page.getByRole('button', {name: 'Generar reporte'});
        await expect(generarReporte).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
