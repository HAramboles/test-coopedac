import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, dataEliminar, contextConfig, fechaInicio, tipoTransaccion, razonAnulacion, fechaFin } from './utils/dataTests';
import { url_anular_cobro_servicios } from './utils/urls';
import { diaActualFormato } from './utils/fechas';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Anular Cobro de Servicios', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la pagina de Anular Cobro de Servicios', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Anulaciones
        await page.getByRole('menuitem', {name: 'ANULACIONES'}).click();

        // Anular Cobro de Servicios
        await page.getByRole('menuitem', {name: 'Anular Cobro Servicios'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_anular_cobro_servicios}`);
    });

    test('Contenido de la pagina de Anular Cobro de Servicios', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'ANULAR COBRO SERVICIOS'})).toBeVisible();

        // Seccion criterio de busqueda debe estar visible
        await expect(page.locator('text=Criterio de búsqueda')).toBeVisible();

        // El tipo de transaccion debe ser Deposito
        await expect(page.locator(`${tipoTransaccion}`)).toHaveValue('RO - OTROS INGRESOS');

        // Buscar el usuario de la caja la cual hizo la transaccion
        await page.getByTitle('TODOS').click();
        // Elegir la primera caja que se muestra
        await page.getByRole('option', {name: 'BPSH'}).nth(0).click();

        // Fecha inicio
        const fechaDeInicio = page.locator(`${fechaInicio}`);
        await expect(fechaDeInicio).toHaveValue(`${diaActualFormato}`);
        await expect(fechaDeInicio).toHaveAttribute('readonly', '');

        // Fecha Fin
        await expect(page.locator(`${fechaFin}`)).toHaveValue(`${diaActualFormato}`);
        await expect(page.locator(`${fechaFin}`)).toHaveAttribute('readonly', '');

        // Click al boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();
    });

    test('Anular el Cobro de Servicios', async () => {
        // Debe mostrarse el cobro de servicio realizado
        await expect(page.getByRole('cell', {name: '100.00'})).toBeVisible();

        // Click al boton de Anular del deposito
        await page.getByRole('row', {name: '100.00'}).locator(`${dataEliminar}`).click();

        // Aparece un modal para colocar la razon de la anulacion
        const modalAnulacion = page.locator('text=Razón de la Anulación');
        await expect(modalAnulacion).toBeVisible();

        // Colocar una razon en el input de comentario
        await page.locator(`${razonAnulacion}`).fill('Anular cobro de servicio realizado por caja');

        // Click al boton de Aceptar del modal de Razon de Anulacion
        await page.getByRole('button', {name: 'Aceptar'}).click();
        
        // Se abre una nueva ventana del navegador con el reporte de la anulacion
        const pag1 = await context.waitForEvent('page');

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
         
        // Cerrar el context
        await context.close();
    });
});
