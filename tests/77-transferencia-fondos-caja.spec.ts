import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas

test.describe('Pruebas con la Transferencia Fondos de Caja', () => {
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

    test('Ingresar a la opcion de Transferencia Fondos de Caja', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Transacciones fondos de caja
        await page.getByRole('menuitem', {name: 'Transacciones fondos de caja'});

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/transferencias_cajas/01-4-1-2-9/`);
    });

    test('En el Input de Hasta Caja debe mostrarse la Boveda', async () => {
        // El titulopri ncipal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TRANSFERENCIA FONDOS DE CAJA'})).toBeVisible();

        // Desde Caja

        // Hasta Caja

    });

    test('Transferir a Boveda un Monto', async () => {
        // 
        
    });

    test.afterAll(async () => {
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
