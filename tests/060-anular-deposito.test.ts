import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, selectBuscar, dataEliminar } from './utils/dataTests';
import { url_anular_deposito } from './utils/urls';
import { formatDate } from './utils/fechas';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Anulacion de un Deposito', async () => {
    test.beforeAll(async () => {
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

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePnombrePersonaJuridicaRelacionadaersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
    });

    test('Ir a la opcion de Anular Deposito', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Anulaciones
        await page.getByRole('menuitem', {name: 'ANULACIONES'}).click();

        // Anular Deposito
        await page.getByRole('menuitem', {name: 'Anular Depósito'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_anular_deposito}`);
    });

    test('Buscar el Deposito realizado por la Caja en uso a la Cuenta de Ahorros Normales de la persona', async () => {
        // El titulo deberia estar visible
        await expect(page.locator('h1').filter({hasText: 'ANULAR DEPÓSITO'})).toBeVisible();

        // Seccion criterio de busqueda debe estar visible
        await expect(page.locator('text=Criterio de búsqueda')).toBeVisible();

        // El tipo de transaccion debe ser Deposito
        await expect(page.locator('#form_ID_TIPO_TRANS')).toHaveValue('DE - DEPOSITOS');

        // Id documento y Cuenta de origen deben estar vacios por defecto
        await expect(page.locator('#form_ID_DOCUMENTO')).toHaveValue('');
        await expect(page.locator(`${selectBuscar}`)).toHaveValue('');

        // Buscar la cuenta de Ahorros Normales
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir la cuenta de Ahorros Normales
        await page.getByRole('option', {name: 'AHORROS NORMALES'}).click();

        // Buscar el usuario de la caja la cual hizo la transaccion
        await page.getByTitle('TODAS').click();
        // Elegir la primera caja que se muestra
        await page.getByRole('option', {name: 'BPSH'}).nth(0).click();

        // Fecha inicio
        await expect(page.locator('#form_FECHA_INICIO')).toHaveValue(`${formatDate(new Date())}`);
        await expect(page.locator('#form_FECHA_INICIO')).toHaveAttribute('readonly', '');

        // Fecha Fin
        await expect(page.locator('#form_FECHA_FIN')).toHaveValue(`${formatDate(new Date())}`);
        await expect(page.locator('#form_FECHA_FIN')).toHaveAttribute('readonly', '');

        // Click al boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();
    });

    test('Anular el Deposito', async () => {
        // Debe mostrarse el deposito realizado
        await expect(page.getByRole('cell', {name: '1,000.00'})).toBeVisible();

        // Click al boton de Anular del deposito
        await page.locator(`${dataEliminar}`).click();

        // Aparece un modal para colocar la razon de la anulacion
        const modalAnulacion = page.locator('text=Razón de la Anulación');
        await expect(modalAnulacion).toBeVisible();

        // Colocar una razon en el input de comentario
        await page.locator('#form_CONCEPTO_ANULACION').fill('Anular deposito realizado por caja');

        // Click al boton de Aceptar del modal de Razon de Anulacion
        await page.getByRole('button', {name: 'Aceptar'}).click();
        
        // Se abre una nueva ventana del navegador con el reporte de la anulacion
        const pag1 = await context.waitForEvent('page');

        // Esperar que el reporte este visible
        await pag1.waitForTimeout(4000);

        // Cerrar la ventana del reporte
        await pag1.close();

        // En la pagina de la Anular Deposito debe mostrarse un mensaje modal de operacion exitosa
        await expect(page.locator('text=Operación Exitosa')).toBeVisible();

        // Click al boton de Aceptar el modal de Operacion Exitosa
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el browser
        await context.close();
    });
});