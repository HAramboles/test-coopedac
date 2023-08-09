import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Tranferir desde Boveda a Caja', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false,
            args: ['--window-position=-1300,100'],
        });

        // Crear el contex
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear la pagina
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Transferir a Cajas', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Boveda
        await page.getByRole('menuitem', {name: 'BOVEDA'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Transferir a cajas
        await page.getByRole('menuitem', {name: 'Transferir a cajas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/transferencias_boveda_caja/01-4-3-2-2/`);
    });

    test('Elegir una Caja', async () => {
        // El titulo de la pagina debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TRANSFERIR A CAJAS'})).toBeVisible();

        // Click al selecor de Desde Caja
        await page.locator('#form_ID_CAJA_DESDE').click();
        // Elegir la boveda principal
        await page.getByRole('option', {name: 'BOVEDA PRINCIPAL'}).click();

        // Desde caja
        // await expect(page.getByText('BOVEDA PRINCIPAL')).toBeVisible();

        // Click a Hasta caja
        const selectorHastaCaja = page.locator('#form_ID_CAJA_HASTA');
        await selectorHastaCaja.click();

        // Digitar el nombre de una caja
        await selectorHastaCaja.fill('CAJA BPSHARAMBOLES');
        // Seleccionar la caja digitada
        await page.getByRole('option', {name: 'CAJA BPSHARAMBOLES'}).click();
    });

    test('Distribuir una cantidad a Transferir', async () => {
        // Tabla de Denominaciones de la boveda principal
        await expect(page.getByText('DENOMINACIONES BOVEDA PRINCIPAL')).toBeVisible();

        // Tabla de entregado
        await expect(page.getByRole('heading', {name: 'Entregado'})).toBeVisible();

        // Transferir 1000 pesos a la caja elegida

        // Campo de RD 1000
        const cant1000 = page.locator('(//input[@id="CANTIDAD_DIGITADA"])[2]'); 

        // Cantidad = 1
        await cant1000.fill('1');
    });

    test('Click al boton de Guardar Transferencia', async () => {
        // Titulo de detalle de distribucion
        await expect(page.getByText('DETALLE DISTRIBUCIÓN')).toBeVisible();

        // Boton de Guardar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();

        // Debe abrirse una nueva ventana con el reporte de transferencia
        const page1 = await context.waitForEvent('page');

        // Cerrar la nueva pestaña
        await page1.close();

        // Debe regresar a la pagina anterior
        await expect(page).toHaveURL(`${url_base}/transferencias_boveda_caja/01-4-3-2-2/`);

        // El titulo de la pagian debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TRANSFERIR A CAJAS'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
