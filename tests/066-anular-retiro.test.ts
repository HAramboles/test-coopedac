import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { dataEliminar, fechaInicio, tipoTransaccion, razonAnulacion, fechaFin, inputCuentaOrigen } from './utils/data/inputsButtons';
import { url_base, url_anular_retiro } from './utils/dataPages/urls';
import { diaActualFormato } from './utils/functions/fechas';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Cuenta de Origen
let cuentaAhorrosNormales: string | null;

// Pruebas
test.describe.serial('Pruebas con la Anulacion de un Retiro', async () => {
    test.beforeAll(async () => {
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

        // Cuenta de origen almacenada en el state
        cuentaAhorrosNormales = await page.evaluate(() => window.localStorage.getItem('ahorrosNormalesPersonaRelacionada'));
    });

    test('Ir a la opcion de Anular Retiro', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Anulaciones
        await page.getByRole('menuitem', {name: 'ANULACIONES'}).click();

        // Anular Retiro
        await page.getByRole('menuitem', {name: 'Anular Retiro'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_anular_retiro}`);
    });

    test('Buscar el Retiro realizado por la Caja en uso a la Cuenta de Ahorros Normales de la persona', async () => {
        // Esperar que cargue la pagina
        await page.waitForTimeout(3000);

        // El titulo deberia estar visible
        await expect(page.locator('h1').filter({hasText: 'ANULAR RETIRO'})).toBeVisible();

        // Seccion criterio de busqueda debe estar visible
        await expect(page.locator('text=Criterio de búsqueda')).toBeVisible();

        // El tipo de transaccion debe ser Deposito
        await expect(page.locator(`${tipoTransaccion}`)).toHaveValue('RE - RETIROS');

        // Id documento debe estar vacios por defecto
        await expect(page.locator('#form_ID_DOCUMENTO')).toHaveValue('');

        // Buscar por la cuenta de origen
        await page.locator(`${inputCuentaOrigen}`).fill(`${cuentaAhorrosNormales}`);

        // Buscar el usuario de la caja la cual hizo la transaccion
        await page.getByTitle('TODOS').click();
        // Elegir la primera caja que se muestra
        await page.getByRole('option', {name: 'BPSH'}).nth(0).click();

        // Fecha inicio
        const fechaDeInicio = page.locator(`${fechaInicio}`)
        await expect(fechaDeInicio).toHaveValue(`${diaActualFormato}`);
        await expect(fechaDeInicio).toHaveAttribute('readonly', '');

        // Fecha Fin
        await expect(page.locator(`${fechaFin}`)).toHaveValue(`${diaActualFormato}`);
        await expect(page.locator(`${fechaFin}`)).toHaveAttribute('readonly', '');

        // Click al boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();

        // Esperar que el retiro buscado se muestre
        await page.waitForTimeout(3000);
    });

    test('Anular el Retiro', async () => {
        // Debe mostrarse el retiro realizado
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Click al boton de Anular del retiro
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).locator(`${dataEliminar}`).click();

        // Aparece un modal para colocar la razon de la anulacion
        const modalAnulacion = page.locator('text=Razón de la Anulación');
        await expect(modalAnulacion).toBeVisible();

        // Colocar una razon en el input de comentario
        await page.locator(`${razonAnulacion}`).fill('Anular retiro realizado por caja');

        // Click al boton de Aceptar del modal de Razon de Anulacion
        await page.getByRole('button', {name: 'Aceptar'}).click();
        
        // Se abre una nueva ventana del navegador con el reporte de la anulacion
        const page1 = await context.waitForEvent('page');

        // Cerrar la ventana del reporte
        await page1.close();

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
