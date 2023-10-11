import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig } from './utils/dataTests';
import { url_reversar_transferencia } from './utils/urls';
import { formatDate } from './utils/fechas';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula de la persona
let cedula: string | null;

// Pruebas
test.describe.serial('Pruebas con Anular Transferencia Cuentas', async () => {
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

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
    }); 

    test.beforeEach(async () => { // Info para el reporte de Allure
        await allure.owner('Hector Aramboles');
        await allure.severity(Severity.NORMAL);
    });

    test('Ir a la opcion de Anular Transferencia Cuenta', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Anulaciones
        await page.getByRole('menuitem', {name: 'REVERSIONES'}).click();

        // Anular Transferencia Cuenta
        await page.getByRole('menuitem', {name: 'Reversar transferencia cuenta'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_reversar_transferencia}`);
    });
    
    test('Buscar la Transferencia entre Cuentas realizadas', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REVERSAR TRANSFERENCIA CUENTA'})).toBeVisible();

        // Tipo transaccion
        await expect(page.locator('#form_ID_TIPO_TRANS')).toHaveValue('TRC - TRANSFERENCIA');

        // Fecha de Inicio y Fin deben tener el dia actual
        await expect(page.locator('#form_FECHA_INICIO')).toHaveValue(`${formatDate(new Date())}`);
        await expect(page.locator('#form_FECHA_FIN')).toHaveValue(`${formatDate(new Date())}`);

        // Click al boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();
    });

    test('Reversar la transferencia buscada', async () => {
        // En la transaferencia buscada deben mostrarse la fecha y el monto
        await expect(page.getByRole('cell', {name: '1,500.00'})).toBeVisible();

        // Click al boton de Anular
        const botonAnular = page.getByRole('row', {name: '1,500.00'}).locator('[data-icon="stop"]');
        await expect(botonAnular).toBeVisible();
        await botonAnular.click();

        // Aparece el mensaje modal de Anulacion
        const modalReversar = page.getByText('Reversar Transferencia', {exact: true});
        await expect(modalReversar).toBeVisible();

        // Mensaje del mensaje modal
        await expect(page.locator('text=¿Está seguro que desea reversar la transferencia')).toBeVisible();

        // Click al boton de Aceptar del modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // El modal de reversar debe desaparecer
        await expect(modalReversar).not.toBeVisible();

        // Aparece el mensaje modal de operacion exitosa
        const modalOperacionExitosa = page.locator('text=Reversión de transferencia aplicada');
        await expect(modalOperacionExitosa).toBeVisible();

        // Click al boton de Aceptar del modal de operacion exitosa
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // El modal de operacion exitosa debe desaparecer
        await expect(modalOperacionExitosa).not.toBeVisible();
    });

    test.skip('La transferencia ya reversada no debe mostrarse', async () => {
        await expect(page.getByRole('cell', {name: '1,500.00'})).not.toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});

