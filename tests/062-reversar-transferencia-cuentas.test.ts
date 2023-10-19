import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, contextConfig } from './utils/dataTests';
import { url_reversar_transferencia, url_reimprimir_contratos_cuentas } from './utils/urls';
import { formatDate } from './utils/fechas';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

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

        // Boton de Anular
        const botonAnular = page.getByRole('row', {name: '1,500.00'}).locator('[data-icon="stop"]');
        await expect(botonAnular).toBeVisible();

        // Colocar el mouse encima del boton
        await botonAnular.hover();

        // El tooltip debe contener que es una Anulacion
        await expect(page.getByRole('tooltip')).toHaveText('Reversar transferencia');

        // Click al boton de Anular
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

