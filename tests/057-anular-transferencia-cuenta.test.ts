import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, selectBuscar } from './utils/dataTests';
import { url_anular_transferencia_cuenta } from './utils/urls';
import { formatDate } from './utils/fechas';

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
        await expect(page.locator('#form_ID_TIPO_TRANS')).toHaveValue('TRC - TRANSFERENCIA');

        // Buscar la cuenta de origen
        // await page.locator(`${selectBuscar}`).first().fill(`${cedula}`);
        await page.locator(`${selectBuscar}`).first().fill('ARYA CRUZ');
        // Click a la opcion de Ahorros Normales
        await page.getByRole('option', {name: 'AHORROS NORMALES'}).click();

        // Buscar la cuenta de destino
        //await page.locator(`${selectBuscar}`).last().fill(`${cedula}`);
        await page.locator(`${selectBuscar}`).last().fill('ARYA CRUZ');
        // Click a la opcion de Aportaciones
        await page.getByRole('option', {name: 'APORTACIONES |'}).getByText('APORTACIONES |').click();

        // Fecha de Inicio y Fin deben tener el dia actual
        await expect(page.locator('#form_FECHA_INICIO')).toHaveValue(`${formatDate(new Date())}`);
        await expect(page.locator('#form_FECHA_FIN')).toHaveValue(`${formatDate(new Date())}`);

        // Click al boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();
    });

    test('Anular la transaccion buscada', async () => {
        // En la transaccion buscada deben mostrarse la fecha y el monto
        await expect(page.getByRole('cell', {name: `${formatDate(new Date())}`})).toBeVisible();
        await expect(page.getByRole('cell', {name: '1000.00'})).toBeVisible();

        // Click al boton de Anular
        const botonAnular = page.locator('[data-icon="stop"]');
        await expect(botonAnular).toBeVisible();
        await botonAnular.click();

        // Aparece el modal de Anulacion
        const modalAnulacion = page.locator('text=Razón de la Anulación');
        await expect(modalAnulacion).toBeVisible();

        // Colocar una razon de anulacion
        await page.locator('#form_CONCEPTO_ANULACION').fill('Transferencia rechazada');

        // Click al boton de Aceptar del modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Aparece un modal de operacion exitosa
        await expect(page.locator('text=Operación Exitosa')).toBeVisible();
        await expect(page.locator('text=Se ha anulado correctamente')).toBeVisible();

        // El modal de anulacion debe desaparecer
        await expect(modalAnulacion).not.toBeVisible();

        // Click al boton de Aceptar del modal de operacion exitosa
        await page.getByRole('dialog', {name: 'Operación Exitosa'}).getByRole('button', {name: 'Aceptar'}).click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});

