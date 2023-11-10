import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { fechaInicio, tipoTransaccion, razonAnulacion, fechaFin } from './utils/data/inputsButtons';
import { url_base, url_anular_transferencia_cuenta } from './utils/dataPages/urls';
import { diaActualFormato } from './utils/functions/fechas';
import { browserConfig, contextConfig } from './utils/data/testConfig';

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
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
    });

    test('Ir a la opcion de Anular Transferencia Cuenta', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Anulaciones
        await page.getByRole('menuitem', {name: 'ANULACIONES'}).click();

        // Anular Transferencia Cuenta
        await page.getByRole('menuitem', {name: 'Anular transferencia cuenta'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_anular_transferencia_cuenta}`);
    });
    
    test('Buscar la Transferencia entre Cuentas realizadas', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'ANULAR TRANSFERENCIA CUENTA'})).toBeVisible();

        // Tipo transaccion
        await expect(page.locator(`${tipoTransaccion}`)).toHaveValue('TRC - TRANSFERENCIA');

        // Fecha de Inicio y Fin deben tener el dia actual
        await expect(page.locator(`${fechaInicio}`)).toHaveValue(`${diaActualFormato}`);
        await expect(page.locator(`${fechaFin}`)).toHaveValue(`${diaActualFormato}`);

        // Click al boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();
    });

    test('Anular la transferencia buscada', async () => {
        // En la transaferencia buscada deben mostrarse la fecha y el monto
        await expect(page.getByRole('cell', {name: '1,000.00'})).toBeVisible();

        // Click al boton de Anular
        const botonAnular = page.getByRole('row', {name: '1,000.00'}).locator('[data-icon="stop"]');
        await expect(botonAnular).toBeVisible();
        await botonAnular.click();

        // Aparece el modal de Anulacion
        const modalAnulacion = page.locator('text=Razón de la Anulación');
        await expect(modalAnulacion).toBeVisible();

        // Colocar una razon de anulacion
        await page.locator(`${razonAnulacion}`).fill('Transferencia rechazada');

        // Click al boton de Aceptar del modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Aparece un modal de operacion exitosa
        await expect(page.locator('text=Operación Exitosa')).toBeVisible();
        await expect(page.locator('text=Se ha anulado correctamente')).toBeVisible();

        // El modal de anulacion debe desaparecer
        await expect(modalAnulacion).not.toBeVisible();

        // Click al boton de Aceptar del modal de operacion exitosa
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});

