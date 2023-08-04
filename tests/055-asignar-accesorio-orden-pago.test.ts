import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe.serial('Asignar una Secuencia de Orden de Pago a la cuenta de Orden de Pago de la persona', () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false,
            args: ['--window-position=-1300,100'],
        });

        // Crear el contex
        context = await browser.newContext({
            storageState: 'state.json',
        });

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });
    
    test('Ir a la opcion de Asignar Accesorios de Captaciones', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Accesorios
        await page.getByRole('menuitem', {name: 'ACCESORIOS'}).click();

        // Asignar Accesorios
        await page.getByRole('menuitem', {name: 'Asignar Accesorios'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/asignar_accesorios/01-2-8-2/`);
    });

    test('Asignar una Secuencia de Orden de Pago', async () => {
        // El titulo de la pagina debe estar visible
        await expect(page.locator('h1').filter({hasText: 'ASIGNAR ACCESORIOS'})).toBeVisible();

        // Buscar a la persona
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Click a la opcion de la cuenta de Orden de Pago
        await page.getByText('ORDEN DE PAGO').click();

        // El input de cuenta debe tener la cuenta de Orden de Pago elegida
        await expect(page.locator('#form_DESC_TIPO_CTA')).toHaveValue('ORDEN DE PAGO');

        // Por defecto el accesorio es Orden Provisional, click a la opcion para cambiar el accesorio
        await page.getByText('Orden Provisional').click();
        // Elejir la opcion de Talonarios Orden De Pago
        await page.getByText('TALONARIOS ORDEN DE PAGO').click();

        // Id Accesorio
        await page.locator('#form_NUMERO_ACCESORIO').fill('21');

        // Secuencia Inicial
        await page.locator('#form_SEC_INICIAL').fill('1');

        // Secuencia Final
        await page.locator('#form_SEC_FINAL').fill('100');

        // Click al boton de Guardar
        await page.getByRole('button', {name: 'Guardar'}).click();

        // Debe aparece un mensaje
        await expect(page.getByRole('dialog').getByText('Captaciones accesorios almacenada exitosamente.')).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el contex
        await context.close();
    });
});
