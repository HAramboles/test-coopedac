import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formBuscar, dataCheck } from './utils/data/inputsButtons';
import { browserConfig, contextConfig } from './utils/data/testConfig'
import { url_base, url_recepcion_transferencia_caja } from './utils/dataPages/urls';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Puebas
test.describe.serial('Pruebas con la Recepcion Transferencia Cajas', async () => {
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

    test('Ir a la opciond de Recepcion Transferencia Caja', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Recepcion Transferencia Caja
        await page.getByRole('menuitem', {name: 'Recepción transferencia caja'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_recepcion_transferencia_caja}`);
    });

    test('Aceptar una Transferencia de Boveda', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'RECEPCIÓN TRANSFERENCIA CAJA'})).toBeVisible();

        // Buscar las transferencias realizadas a la caja en uso
        await page.locator(`${formBuscar}`).fill('BPSHARAMBOLES');

        // Debe mostrarse la transferencia desde la Boveda
        const transferencia1000Boveda = page.getByRole('row', {name: 'BOVEDA PRINCIPAL CAJA BPSHARAMBOLES RD$ 1,000.00'});
        await expect(transferencia1000Boveda).toBeVisible();

        // Click al boton de Confirmar
        await transferencia1000Boveda.locator(`${dataCheck}`).click();

        // Debe aparecer un mensaje de confirmacion
        await expect(page.locator('text=¿Está seguro que desea confirmar transferencia?')).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Debe abrirse una nueva ventana con el reporte de transferencia desde caja
        const page1 = await context.waitForEvent('page');

        // Cerrar la nueva pestaña
        await page1.close();
    });
    
    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
