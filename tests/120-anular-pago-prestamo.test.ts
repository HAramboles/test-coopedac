import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { dataEliminar, fechaInicio, tipoTransaccion, razonAnulacion, fechaFin, inputCuentaOrigen } from './utils/data/inputsButtons';
import { url_base, url_anular_pago_prestamo } from './utils/dataPages/urls';
import { diaActualFormato } from './utils/functions/fechas';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Codigo del prestamo
let prestamoAhorros: string | null;

// Pruebas
test.describe.serial('Pruebas con la Anulacion de Pago a Prestamo', async () => {
    test.beforeAll(async () => {
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Id del prestamo almacenada en el state
        prestamoAhorros = await page.evaluate(() => window.localStorage.getItem('codigoPrestamoAhorro'));
    });

    test('Ir a la opcion de Anular Pago a Prestamo', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Anulaciones
        await page.getByRole('menuitem', {name: 'ANULACIONES'}).click();

        // Anular Pago a Prestamo
        await page.getByRole('menuitem', {name: 'Anular Pago a Préstamo'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_anular_pago_prestamo}`);
    });

    test('Buscar los Pagos realizados al Prestamo de la persona', async () => {
        // El titulo deberia estar visible
        await expect(page.locator('h1').filter({hasText: 'ANULAR PAGO A PRÉSTAMO'})).toBeVisible();

        // Seccion criterio de busqueda debe estar visible
        await expect(page.locator('text=Criterio de búsqueda')).toBeVisible();

        // El tipo de transaccion debe ser Pago a prestamo
        await expect(page.locator(`${tipoTransaccion}`)).toHaveValue('RP - PAGOS A PRESTAMOS');

        // Id documento debe estar vacio por defecto
        await expect(page.locator('#form_ID_DOCUMENTO')).toHaveValue('');

        // Buscar el usuario de la caja la cual hizo la transaccion
        await page.getByTitle('TODOS').click();
        // Elegir la primera caja que se muestra
        await page.getByRole('option').nth(0).click();

        // Fecha inicio
        const fechaDeInicio = page.locator(`${fechaInicio}`);
        await expect(fechaDeInicio).toHaveValue(`${diaActualFormato}`);
        await expect(fechaDeInicio).toHaveAttribute('readonly', '');

        // Fecha Fin
        await expect(page.locator(`${fechaFin}`)).toHaveValue(`${diaActualFormato}`);
        await expect(page.locator(`${fechaFin}`)).toHaveAttribute('readonly', '');

        // Buscar por la cuenta de origen
        await page.locator(`${inputCuentaOrigen}`).fill(`${prestamoAhorros}`);

        // Click al boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();

        // Esperar que se muestren los pagos buscados
        await page.waitForTimeout(3000);
    });

    test('Anular uno de los Pagos al Prestamo', async () => {
        // Deben mostrarse los dos pagos realizados
        await expect(page.getByRole('cell', {name: '16,000.00'})).toBeVisible();
        await expect(page.getByRole('cell', {name: '3,000.00'})).toBeVisible();

        // Click al boton de Anular del pago de 3000
        await page.getByRole('row', {name: '3,000.00'}).locator(`${dataEliminar}`).click();

        // Aparece un modal para colocar la razon de la anulacion
        const modalAnulacion = page.locator('text=Razón de la Anulación');
        await expect(modalAnulacion).toBeVisible();

        // Colocar una razon en el input de comentario
        await page.locator(`${razonAnulacion}`).fill('Anular pago de 3000 pesos realizado por caja');

        // Click al boton de Aceptar del modal de Razon de Anulacion
        await page.getByRole('button', {name: 'Aceptar'}).click();
        
        // Se abre una nueva ventana del navegador con el reporte de anulacion
        const page1 = await context.waitForEvent('page');

        // Cerrar la ventana del reporte
        await page1.close();

        // En la pagina de la Anular Pago a Prestamo debe mostrarse un mensaje modal de operacion exitosa
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
