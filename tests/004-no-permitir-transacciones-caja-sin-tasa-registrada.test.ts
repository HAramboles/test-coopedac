import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { dataCheck } from './utils/data/inputsButtons';
import { url_base, url_transacciones_caja, url_registro_tasa } from './utils/dataPages/urls';
import { diaActualFormato } from './utils/functions/fechas';
import { browserConfig, contextConfig } from './utils/data/testConfig';


// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('No debe permitir Transacciones de Caja sin una Tasa Registrada', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Registro de Tasa Simple', async () => {
        // Configuracion
        await page.getByRole('menuitem', {name: 'CONFIGURACION'}).click();

        // Monedas, Calculos
        await page.getByRole('menuitem', {name: 'MONEDAS, CALCULOS'}).click();

        // Registro tasa simple
        await page.getByRole('menuitem', {name: 'Registro Tasa Simple'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_registro_tasa}`);
    });

    test('Comprobar que no exita una Tasa del Dia registrada', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REGISTRO DE TASA'})).toBeVisible();

        // Esperar 3 segundos
        await page.waitForTimeout(3000);

       // Tasa del dia
       const tasaDia = page.locator('(//TD[@record="[object Object]"][text()="56.0000"])');

        // Condicion si hay o no una tasa del dia registrada
        if (await tasaDia.isVisible()) {
            // Click al boton de Inhabilitar
            const botonInhabilitar = page.getByRole('row', {name: `${diaActualFormato} DOLARES (US) 56.0000`}).locator(`${dataCheck}`);
            await expect(botonInhabilitar).toBeVisible();
            await botonInhabilitar.click();

            // Debe aparecer un mensaje modal de confirmacion
            await expect(page.locator('text=¿Está seguro que desea inhabilitar este registro?')).toBeVisible();

            // Click al boton de Aceptar
            await page.getByRole('button', {name: 'Aceptar'}).click();
        } else if (await tasaDia.isHidden()) {
            // Click a Contraer todo del menu de navegacion
            await page.locator('text=Contraer todo').click();
        }
    });

    test('Ir a la opcion de Transacciones de Caja', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Transacciones de Caja
        await page.getByRole('menuitem', {name: 'Transacciones de Caja'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_transacciones_caja}`);
    });

    test('No debe permitir realizar ninguna accion en la pagina', async () => {
        // Debe aparecer el mensaje de aviso
        await expect(page.locator('text=Es necesario registrar la tasa del día. Imposible realizar operaciones.')).toBeVisible();

        // Click al boton de Aceptar del mensaje modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // La pagina debe tener deshabilitada todas las opciones del cursor
        await expect(page.locator('(//div[@style="pointer-events: none; opacity: 1; cursor: not-allowed;"])')).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});

