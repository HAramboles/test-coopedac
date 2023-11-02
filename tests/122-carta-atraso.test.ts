import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataFile, browserConfig, dataVer, contextConfig } from './utils/dataTests';
import { url_carta_atraso } from './utils/urls';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Prueba con la Carta de Atraso', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

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
        await expect(page).toHaveURL(`${url_carta_atraso}`);
    });

    test('Ver una Solicitud y no debe estar en estado undefined', async () => {
        
        await page.waitForTimeout(9000);

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CARTA DE ATRASO'})).toBeVisible();

        // Ordenar las solicitudes por fecha de solicitud de la mas reciente a la mas antigua
        await page.getByText('Fecha Solicitud').click();

        // Click al boton de Ver Prestamo de la primera solicitud que aparece
        await page.locator(`${dataVer}`).first().click();

        // Debe salir un modal con la solicitud
        const modal = page.locator('h1').filter({hasText: 'SOLICITUD DE CREDITO'}).first();
        await expect(modal).toBeVisible();

        // El estado del pestamo no debe ser undefined
        await expect(page.locator('text=(UNDEFINED)')).not.toBeVisible();
    });

    test('Generar una Carta de Atraso a un deudor', async () => {
        // Click al boton de Generar Carta de la primera solicitud que aparece
        await page.locator(`${dataFile}`).first().click();

        // Debe salir un modal para elegir a quien generar la carta
        await expect(page.getByText('GENERAR CARTA A')).toBeVisible();

        // Click al boton de Deudor
        await page.getByText('Deudor', {exact: true}).click();

        // Click al boton de Generar del modal
        await page.getByRole('button', {name: 'Generar'}).click();

        // Esperar que se abra una nueva ventana con el reporte de la Carta de Atraso
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la segunda pagina
        await page1.close();

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
