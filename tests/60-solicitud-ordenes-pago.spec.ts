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

test.describe('Pruebas con la Solicitud de Ordenes de Pago', () => {
    test.beforeAll(async () => {
        // Crear el browser
        browser = await chromium.launch({
            headless: false
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
        cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
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
        await expect(page.locator('#form_CORREO_SOLICITANTE')).toHaveValue(`${correo}`);

        // Nombre Chequera
        await page.locator('#form_CHECKER_NAME').fill('');

        // Desde, colocar la fecha de inicio de mes
        await page.locator('#form_FROM').fill(`${primerDiaMes}`);
        // Enter
        await page.keyboard.press('Enter');

        // Hasta, colocar la fecha actual
        await page.locator('#form_FROM').fill(`${formatDate(new Date())}`);
        // Enter
        await page.keyboard.press('Enter');

        // Titulo formato de ordenes
        await expect(page.locator('h1').filter({hasText: 'FORMATO DE ORDENES A SOLICITAR'})).toBeVisible();

        // Elegir el formato con logo
        const radioLogo = page.locator('(//INPUT[@type="radio"])[3]');
        await radioLogo.check();
        // Confirmar que el radio este marcado
        await expect(radioLogo).toBeChecked();

        // Tipo de cliente, elegir persona
        const radioPersona = page.locator('(//INPUT[@type="radio"])[5]');
        await radioPersona.check();
        // Confirmar que el radio este marcado
        await expect(radioPersona).toBeChecked();
    });

    test('Generar el reporte', async () => {
        // Boton de Generar Reporte
        const generarReporte = page.getByRole('button', {name: 'Generar Reporte'});
        await expect(generarReporte).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
