import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, userCorrecto, userCuadreCaja, dataPrinter, fechaInicio, fechaFinal } from './utils/dataTests';
import { formatDate } from './utils/fechas';
import { url_reimprimir_cuadre_caja } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con la Reimprimiseion de Cuadre de Caja', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
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
        await expect(page.locator(`${fechaInicio}`)).toHaveValue(`${formatDate(new Date())}`);
        await expect(page.locator(`${fechaFinal}`)).toHaveValue(`${formatDate(new Date())}`);

        // En el input Sucursal debe estar el valor Todas
        await expect(page.getByTitle('TODAS').last()).toBeVisible();

        // Click al boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();

        // Aparece el cuadre de caja realizado anteriormente, con la caja y el usuario
        await expect(page.getByRole('cell', {name: `${userCorrecto}`})).toBeVisible();
        const usuarioCuadreCaja = page.getByRole('row', {name: `${userCuadreCaja}`});
        await expect(usuarioCuadreCaja).toBeVisible();

        // Click al boton de Imprimir
        await usuarioCuadreCaja.locator(`${dataPrinter}`).click();

        // Se abren dos nuevas ventanas

        // Una con el Reporte del Cuadre de Caja
        const reporteCuadreCaja = await context.waitForEvent('page');
        // La otra con el Reporte de los Cheques de Caja
        const chequesCuadreCaja = await context.waitForEvent('page');

        // Cerrar las dos ventanas con los reportes
        await reporteCuadreCaja.close();
        await chequesCuadreCaja.close();

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
