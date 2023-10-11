import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, dataCerrar } from './utils/dataTests';
import { url_reimprimir_recibo } from './utils/urls';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Numero del Documento
const numeroRecibo = '419548';

// Pruebas
test.describe.serial('Pruebas con la Reimpresion de un Recibo', () => {
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

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test.beforeEach(async () => { // Info para el reporte de Allure
        await allure.owner('Hector Aramboles');
        await allure.severity(Severity.MINOR);
    });

    test('Ir a la opcion de Reimprimir Recibo', async () => {
        // TESORERIA
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // CAJAS
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // REIMPRESIONES
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir en Libreta
        await page.getByRole('menuitem', {name: 'Reimprimir Recibo'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_reimprimir_recibo}`);
    });

    test('Reimprimir un Recibo', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REIMPRESIÓN DE RECIBO'})).toBeVisible();

        // Colocar el Tipo de Transaccion
        await page.locator('#form_ID_TIPO_TRANS').fill('DE');

        // Colocar el Numero del Documento
        await page.locator('#form_ID_DOCUMENTO').fill(`${numeroRecibo}`);
        
        // Click al boton de Cargar
        const botonCargar = page.getByRole('button', {name: 'Cargar'});
        await expect(botonCargar).toBeVisible();
        await botonCargar.click();

        // Debe abrirse un modal con el recibo buscado
        const modalRecibo = page.getByRole('heading', {name: 'Impresión de Recibo', exact: true});
        await expect(modalRecibo).toBeVisible();

        // Debe estar visible el boton de Imprimir
        await expect(page.getByRole('button', {name: 'Imprimir'})).toBeVisible();

        // Cerrar el modal del recibo
        await page.locator(`${dataCerrar}`).click();

        // Debe aparecer un modal de confirmacion
        await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();

        // Click al boton de Aceptar del modal de confirmacion
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // EL Modal debe desaparecer
        await expect(modalRecibo).not.toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});