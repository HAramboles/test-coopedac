import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { ariaCerrar } from './utils/data/inputsButtons';
import { url_base, url_transferencia_fondos_caja } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con la Transferencia Fondos de Caja', () => {
    test.beforeAll(async () => {
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

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

        // Transferencia fondos de caja
        await page.getByRole('menuitem', {name: 'Transferencia fondos de caja'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_transferencia_fondos_caja}`);
    });

    test('En el Input de Hasta Caja debe mostrarse la Boveda', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TRANSFERENCIA FONDOS DE CAJA'})).toBeVisible();

        // Hasta Caja
        await expect(page.getByText('BOVEDA PRINCIPAL')).toBeVisible();
    });

    test('Transferir a Boveda un Monto', async () => {
        // Titulos de la transferencia a boveda
        await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();

        // Transferir una gran cantidad de monedas de 1000 y de 2000
        const cant2000 = page.locator('(//input[@id="CANTIDAD_DIGITADA"])[1]'); // Campo de RD 2000
        const cant1000 = page.locator('(//input[@id="CANTIDAD_DIGITADA"])[2]'); // Campo de RD 1000

        // Cantidad = 500 de 2000
        await cant2000.click();
        await cant2000.fill('500');

        // Cantidad = 1800 de 1000
        await cant1000.click();
        await cant1000.fill('1800');

        // Boton Guardar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();

        // Esperar que se abra una nueva ventana
        const page1 = await context.waitForEvent('page');

        // Cerrar la ventana
        await page1.close();

        // Debe regresar a la pagina y debe aparecer un mensaje
        await expect(page.locator('text=Transacción caja almacenada exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator(`${ariaCerrar}`).click();
    });

    test('Transferir otro Monto a Boveda', async () => {
        // La Boveda Principal debe estar seleccionada
        await expect(page.getByText('BOVEDA PRINCIPAL')).toBeVisible();

        // Transferir mil pesos desde la caja a la boveda
        const cant1000 = page.locator('(//input[@id="CANTIDAD_DIGITADA"])[2]'); // Campo de RD 1000

        // Cantidad = 1 de 1000
        await cant1000.click();
        await cant1000.fill('1');

        // Boton Guardar
        const botonGuardar =  page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();

        // Esperar que se abra una nueva ventana
        const page1 = await context.waitForEvent('page');

        // Cerrar la ventana
        await page1.close();

        // Debe regresar a la pagina y debe aparecer un mensaje
        await expect(page.locator('text=Transacción caja almacenada exitosamente.')).toBeVisible();
    });

    test.afterAll(async () => {
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
