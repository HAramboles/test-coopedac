import { Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { url_base, browserConfig } from './utils/dataTests';
import { url_relacion_prestamos_seguros } from './utils/urls';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Selectores
let botonGenerarReporte: Locator;
let inputCentroCosto: Locator;

// Pruebas
test.describe.serial('Pruebas con la Impresion del Reporte de Relacion Prestamos Seguros', async () => {
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

        // Boton de Generar Reporte
        botonGenerarReporte = page.getByRole('button', {name: 'Generar Reporte'});

        // Input de centro costo
        inputCentroCosto = page.locator('#form_ID_CENTRO_COSTO');
    });

    test.beforeEach(async () => { // Info para el reporte de Allure
        await allure.owner('Hector Aramboles');
        await allure.severity(Severity.MINOR);
    });

    test('Ir a la opcion de Relacion Prestamos Seguros', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Relacion Prestamos Seguros
        await page.getByRole('menuitem', {name: 'Relacion Prestamos Seguros'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_relacion_prestamos_seguros}`);
    });

    test('Los elementos de la pagina deben estar visibles', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'RELACION PRESTAMOS SEGUROS'})).toBeVisible();

        // Centro de Costo
        await expect(page.getByText('Centro de Costo')).toBeVisible();

        // Input de centro costo
        await expect(inputCentroCosto).toBeVisible();

        // Boton de Generar Reporte
        await expect(botonGenerarReporte).toBeVisible();
    });

    test('Generar el Reporte para el Centro de Costo Informes', async () => {
        // Click al input de centro costo
        await inputCentroCosto.click();

        // Elegir el centro de costo Informes
        await page.getByRole('option', {name: 'INFORMES'}).click();

        // Click al boton de generar reporte
        await botonGenerarReporte.click();

        // Se abre una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await page1.close();
    });

    test('Generar el Reporte para el Centro de Costo Oficina Empo', async () => {
        // Click al input de centro costo
        await page.locator('#form').getByText('INFORMES').click();

        // Elegir el centro de costo Informes
        await page.getByRole('option', {name: 'OFICINA EMPO'}).click();

        // Click al boton de generar reporte
        await botonGenerarReporte.click();

        // Se abre una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await page1.close();
    });

    test('Generar el Reporte para el Centro de Costo Oficina Principal', async () => {
        // Click al input de centro costo
        await page.locator('#form').getByText('OFICINA EMPO').click();

        // Elegir el centro de costo Informes
        await page.getByRole('option', {name: 'OFICINA PRINCIPAL'}).click();

        // Click al boton de generar reporte
        await botonGenerarReporte.click();

        // Se abre una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await page1.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
