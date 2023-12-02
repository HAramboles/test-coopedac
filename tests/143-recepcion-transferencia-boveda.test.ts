import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formBuscar, dataCheck, ariaCancelar, formComentario } from './utils/data/inputsButtons';
import { url_base, url_recepcion_transferencia_boveda } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { userCorrecto } from './utils/data/usuarios';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con la Recepcion Transferencia Boveda', async () => {
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

    test('Ir a la pagina de Recepcion Transferencia Boveda', async () => {
        // TESORERIA
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // BOVEDA
        await page.getByRole('menuitem', {name: 'BOVEDA'}).click();

        // PROCESOS
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Recepcion Transferencia Boveda
        await page.getByRole('menuitem', {name: 'Recepción Transferencia Bóveda'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_recepcion_transferencia_boveda}`);
    });

    test('Confirmar la Transferencia a Boveda del millon de pesos', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'RECEPCIÓN TRANSFERENCIA BÓVEDA'})).toBeVisible();

        // Buscar la caja de la cual se realizo la transferencia a boveda
        await page.locator(`${formBuscar}`).fill(`${userCorrecto}`);

        // Debe mostrarse la transferencia realizada por la caja buscada
        await expect(page.getByRole('row', {name: `${userCorrecto}`}).first()).toBeVisible();

        // Se debe mostrar el monto de la transferencia
        await expect(page.getByRole('cell', {name: '3,000,000.00'})).toBeVisible();

        // Click al boton de Confirmar Transferencia
        await page.getByRole('row', {name: '3,000,000.00'}).locator(`${dataCheck}`).click();

        // Debe mostrarse un mensaje modal de Confirmacion
        await expect(page.locator('text=¿Está seguro que desea confirmar transferencia?')).toBeVisible();

        // Click al boton de Aceptar del mensaje modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Se abre una nueva ventana con el Reporte de la Recepcion Transferencia a Boveda
        const page1 = await context.waitForEvent('page');

        // Cerrar la ventana
        await page1.close();
    });

    test('Cancelar la Transferencia a Boveda de mil pesos', async () => {
        // Se debe mostrar el monto de la transferencia
        await expect(page.getByRole('cell', {name: '1,000.00'}).first()).toBeVisible();

        // Click al boton de Confirmar Transferencia
        await page.getByRole('row', {name: '1,000.00'}).first().locator(`${ariaCancelar}`).click();

        // Aparece un modal para colocar la razon de la cancelacion de la transferencia
        await expect(page.locator('text=ANULAR TRANSFERENCIA')).toBeVisible();

        // Debe mostrarse un modal de Anular transferencia
        await expect(page.locator('text=ANULAR TRANSFERENCIA')).toBeVisible();

        // Colocar una razon de la cancelacion en el input de comentario
        await page.locator(`${formComentario}`).fill('Cancelar la Transferencia a Boveda');

        // Click al boton de Aceptar del mensaje modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Se abre una nueva ventana con el Reporte de la Recepcion Transferencia a Boveda
        const page1 = await context.waitForEvent('page')

        // Cerrar la ventana
        await page1.close();
        
        // Debe regresar a la pagina y debe aparecer una alerta
        await expect(page.locator('text=Transferencia Anulada Exitosamente')).toBeVisible();
    });
    
    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el contest
        await context.close();
    });
});
