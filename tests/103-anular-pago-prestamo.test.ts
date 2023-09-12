import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, selectBuscar, dataEliminar } from './utils/dataTests';
import { url_anular_pago_prestamo } from './utils/urls';
import { formatDate } from './utils/fechas';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Anulacion de Pago a Prestamo', async () => {
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

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
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
        await expect(page.locator('#form_ID_TIPO_TRANS')).toHaveValue('RP - PAGOS A PRESTAMOS');

        // Id documento y Cuenta de origen deben estar vacios por defecto
        await expect(page.locator('#form_ID_DOCUMENTO')).toHaveValue('');
        await expect(page.locator(`${selectBuscar}`)).toHaveValue('');

        // Buscar el usuario de la caja la cual hizo la transaccion
        await page.getByTitle('TODAS').click();
        // Elegir la primera caja que se muestra
        await page.getByRole('option').nth(0).click();

        // Fecha inicio
        await expect(page.locator('#form_FECHA_INICIO')).toHaveValue(`${formatDate(new Date())}`);

        // Fecha Fin
        await expect(page.locator('#form_FECHA_FIN')).toHaveValue(`${formatDate(new Date())}`);

        // Click al boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();
    });

    test('Anular uno de los Pagos al Prestamo', async () => {
        // Deben mostrarse los dos pagos realizados
        await expect(page.getByRole('cell', {name: '5,000.00'}).first()).toBeVisible();
        await expect(page.getByRole('cell', {name: '5,000.00'}).last()).toBeVisible();

        // Click al boton de Anular del primer pago
        await page.locator(`${dataEliminar}`).first().click();

        // Aparece un modal para colocar la razon de la anulacion
        const modalAnulacion = page.locator('text=Anulación de Pago a Préstamo');
        await expect(modalAnulacion).toBeVisible();

        // Colocar una razon en el input de comentario
        await page.locator('#form_CONCEPTO_ANULACION').fill('Anular primer pago realizado por caja');

        // Click al boton de Aceptar del modal de Razon de Anulacion
        await page.getByRole('button', {name: 'Aceptar'}).click();
        
        // Se abre una nueva ventana del navegador con el reporte de anulacion
        const pag1 = await context.waitForEvent('page');

        // Cerrar la ventana del reporte
        await pag1.close();

        // En la pagina de la Anular Pago a Prestamo debe mostrarse un mensaje modal de operacion exitosa
        await expect(page.locator('text=Se ha anulado correctamente No. RP-40542.')).toBeVisible();

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
