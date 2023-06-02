import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas

test.describe('Pruebas con el Cambio de Moneda', () => {
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
    });

    test('Ir a la opcion de Cambio de Monedas', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Transacciones fondos de caja
        await page.getByRole('menuitem', {name: 'Transacciones fondos de caja'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/cambio_monedas/01-4-1-2-8/`);
    });

    test('Recibir 500 pesos', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CAMBIO DE MONEDAS'})).toBeVisible();


    });

    test('Probar el boton de Denominaciones', async () => {

    });

    test('Entregar mas de lo que tiene la caja', async () => {

    });

    test('Entregar los 500 pesos con otras monedas', async () => {

    });

    test('', async () => {

    });

    test.afterAll(async () => {
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
