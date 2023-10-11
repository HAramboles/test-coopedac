import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig } from './utils/dataTests';
import { url_cuadre_caja } from './utils/urls';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con el Mensaje de Aviso cuando hay Recepciones Pendientes en Cuadre de Caja', async () => {
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

        // Ir a la pagina
        await page.goto(`${url_base}`);
    });

    test.beforeEach(async () => { // Info para el reporte de Allure
        await allure.owner('Hector Aramboles');
        await allure.severity(Severity.NORMAL);
    });

    test('Ir a la opcion de Cuadre de Caja', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Cuadre de Caja
        await page.getByRole('menuitem', {name: 'Cuadre de Caja'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_cuadre_caja}`);
    });

    test('Debe salir un mensaje modal de aviso', async () => {
        // Titulo del modal
        await expect(page.getByText('Existen transferencias pendientes')).toBeVisible();

        // Contenido del modal
        await expect(page.getByText('Existen una o más transferencias pendientes de recibir o confirmar, por favor recepcione las transferencias pendientes para poder continuar.')).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Debe dirigirse a la pagina de Inicio
        await expect(page).toHaveURL(`${url_base}`);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
