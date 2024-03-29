import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { dataPrinter, fechaFinal, fechaInicial } from './utils/data/inputsButtons';
import { diaActualFormato } from './utils/functions/fechas';
import { url_base, url_reimprimir_cuadre_caja } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { userCorrecto, userCuadreCaja } from './utils/data/usuarios';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con la Reimprimiseion de Cuadre de Caja', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Reimprimir Cuadre de Caja', async () => {
        // TESORERIA
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // CAJAS
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // REIMPRESIONES
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir Cuadre de Caja
        await page.getByRole('menuitem', {name: 'Reimprimir Cuadre Caja'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_reimprimir_cuadre_caja}`);
    });

    test('Reimprimir el Cuadre de Caja realizado anteriormente', async () => {
        // El titulo de la pagina debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REIMPRESION DE CUADRE DE CAJAS'})).toBeVisible();

        // En el input Cajas debe estar el valor Todas
        await expect(page.getByTitle('TODAS').first()).toBeVisible();

        // En el input No. Cuadre debe estar vacio
        await expect(page.locator('#form_ID_CUADRE')).toHaveValue('');

        // La Fecha inio y fin deben tener el dia actual
        await expect(page.locator(`${fechaInicial}`)).toHaveValue(`${diaActualFormato}`);
        await expect(page.locator(`${fechaFinal}`)).toHaveValue(`${diaActualFormato}`);

        // En el input Sucursal debe estar el valor Todas
        await expect(page.getByTitle('TODAS').last()).toBeVisible();

        // Click al boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();

        // Aparece el cuadre de caja realizado anteriormente, con la caja y el usuario
        await expect(page.getByRole('cell', {name: `${userCorrecto}`}).first()).toBeVisible();
        const usuarioCuadreCaja = page.getByRole('row', {name: `${userCuadreCaja}`}).first();
        await expect(usuarioCuadreCaja).toBeVisible();

        // Click al boton de Imprimir
        await usuarioCuadreCaja.locator(`${dataPrinter}`).first().click();

        // Se abren dos nuevas ventanas

        // Una con el Reporte del Cuadre de Caja
        const page1 = await context.waitForEvent('page');
        // La otra con el Reporte de los Cheques de Caja
        const page2 = await context.waitForEvent('page');

        // Cerrar todas las paginas
        await page2.close();
        await page1.close();

        // Debe regresar a la pagina de Reimprimir Cuadre de Caja
        await expect(page).toHaveURL(`${url_reimprimir_cuadre_caja}`);
    });
    
    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
