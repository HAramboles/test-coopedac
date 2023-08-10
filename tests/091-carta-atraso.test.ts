import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataFile, browserConfig } from './utils/dataTests';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Prueba con la Carta de Atraso', async () => {
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

        // Ir a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Carta de Saldo', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Carta de Atraso
        await page.getByRole('menuitem', {name: 'Carta de Atraso'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/carta_atraso/01-3-2-6/`);
    });

    test('Generar una Carta de Atraso a un deudor', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CARTA DE ATRASO'})).toBeVisible();

        // Ordenar las solicitudes por fecha de solicitud de la mas reciente a la mas antigua
        await page.getByText('Fecha Solicitud').click();

        // Click al boton de Generar Carta de la primera solicitud que aparece
        await page.locator(`${dataFile}`).first().click();

        // Debe salir un modal para elegir a quien generar la carta
        await expect(page.getByText('GENERAR CARTA A')).toBeVisible();

        // Click al boton de Deudor
        await page.getByText('Deudor', {exact: true}).click();

        // Click al boton de Generar del modal
        await page.getByRole('button', {name: 'Generar'}).click();

        // Se abre una nueva ventana con la carta de atraso
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');

        // Cerrar la pagina con la carta de Atraso
        await page1.close();
        await page2.close();

        // Debe regresar a la pagina de Carta de Atraso
        await expect(page.locator('h1').filter({hasText: 'CARTA DE ATRASO'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
