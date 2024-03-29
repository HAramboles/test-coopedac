import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { fechaInicio, tipoTransaccion, fechaFin, inputCuentaOrigen } from './utils/data/inputsButtons';
import { url_base, url_reversar_transferencia, url_reimprimir_contratos_cuentas } from './utils/dataPages/urls';
import { diaActualFormato } from './utils/functions/fechas';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cuenta de origen y destino
let cuentaAhorrosNormalesPersonaFisica: string | null;
let cuentaAhorrosNormalesPersonaJuridica: string | null;

// Pruebas
test.describe.serial('Pruebas con Reversar Transferencia Cuentas', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cuentas de origen y destino almacenada en el state
        cuentaAhorrosNormalesPersonaFisica = await page.evaluate(() => window.localStorage.getItem('ahorrosNormalesPersonaFisica'));
        cuentaAhorrosNormalesPersonaJuridica = await page.evaluate(() => window.localStorage.getItem('ahorrosNormalesEmpresa'));
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
        await expect(page.locator(`${tipoTransaccion}`)).toHaveValue('TRC - TRANSFERENCIA');

        // Fecha de Inicio y Fin deben tener el dia actual
        await expect(page.locator(`${fechaInicio}`)).toHaveValue(`${diaActualFormato}`);
        await expect(page.locator(`${fechaFin}`)).toHaveValue(`${diaActualFormato}`);

        // Buscar la cuenta de origen
        await page.locator(`${inputCuentaOrigen}`).fill(`${cuentaAhorrosNormalesPersonaFisica}`);

        // Esperar a que la cuenta digitada se agregue al input
        await page.waitForTimeout(2000);

        // Buscar la cuenta de destino
        await page.locator('#form_CUENTA_DEST').fill(`${cuentaAhorrosNormalesPersonaJuridica}`);

        // Esperar a que la cuenta digitada se agregue al input
        await page.waitForTimeout(2000);

        // Click al boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();

        // Esperar que la transferecia buscada se muestre
        await page.waitForTimeout(3000);
    });

    test('Reversar la transferencia buscada', async () => {
        // En la transaferencia buscada deben mostrarse la fecha y el monto
        await expect(page.getByRole('cell', {name: '1,500.00'})).toBeVisible();

        // Boton de Anular
        const botonAnular = page.getByRole('row', {name: '1,500.00'}).locator('[data-icon="stop"]');
        await expect(botonAnular).toBeVisible();

        // Colocar el mouse encima del boton
        await botonAnular.hover();

        // El tooltip debe contener que es una Anulacion
        await expect(page.getByRole('tooltip', {name: 'Reversar transferencia'})).toBeVisible();

        // Click al boton de Anular
        await botonAnular.click();

        // Aparece el mensaje modal de Anulacion
        const modalReversar = page.getByText('Reversar Transferencia', {exact: true});
        await expect(modalReversar).toBeVisible();

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

    test('Dirigirse a una pagina diferente y no deberia mostrar una alerta de error', async () => {
        // Dirigirse a Reimprimir Contratos Cuentas
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();
        await page.getByRole('menuitem', {name: 'Reimprimir contratos cuentas'}).click();
        
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_reimprimir_contratos_cuentas}`);

        // No debe mostrarse ninguna alerta de error
        await expect(page.locator("text=Cannot read property 'replace' of undefined")).not.toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});

