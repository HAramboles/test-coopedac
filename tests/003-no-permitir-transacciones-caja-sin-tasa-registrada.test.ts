import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig } from './utils/dataTests';
import { url_transacciones_caja } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('No debe permitir Transacciones de Caja sin una Tasa Registrada', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Transacciones de Caja', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Transacciones de Caja
        await page.getByRole('menuitem', {name: 'Transacciones de Caja'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_transacciones_caja}`);
    });

    test('No debe permitir realizar ninguna accion en la pagina', async () => {
        // Debe aparecer el mensaje de aviso
        await expect(page.locator('text=Es necesario registrar la tasa del día. Imposible realizar operaciones.')).toBeVisible();

        // Click al boton de Aceptar del mensaje modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // La pagina debe tener deshabilitada todas las opciones del cursor
        await expect(page.locator('(//div[@style="pointer-events: none; opacity: 1; cursor: not-allowed;"])')).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});

