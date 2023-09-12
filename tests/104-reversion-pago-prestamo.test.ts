import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_reversar_pago_prestamo } from './utils/urls';
import { url_base, browserConfig, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Puebas con Reversar Pago a Prestamo', async () => {
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

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Reversar Pago a Prestamo', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Reversiones
        await page.getByRole('menuitem', {name: 'REVERSIONES'}).click();

        // Reversar pago a prestamo
        await page.getByRole('menuitem', {name: 'Reversar pago a prestamo'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_reversar_pago_prestamo}`);
    });

    test('Buscar un Prestamo de una persona', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REVERSAR PAGO A PRESTAMO'})).toBeVisible();

        // Ingresar la cedula de la persona
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir a la persona buscada
        await page.getByRole('option', {name: `${nombre} ${apellido}`}).click();

        // Click al boton de Buscar
        await page.getByRole('button', {name: 'Buscar'}).click();

        // Subtitulo de los movimientos
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS'})).toBeVisible();

        // Seleccionar el prestamo de CRÉDITO GERENCIAL / AHORROS
        await page.getByRole('radio').last().click();
    });

    test('Entrar al modal Revesar Pago a Prestamo', async () => {
        // Debe mostrarse el movimiento del pago realizado por caja
        await expect(page.getByRole('cell', {name: '5,000.00'}).first()).toBeVisible();

        // Click al boton de Reversar Prestamo
        await page.locator('[data-icon="left-circle"]').last().click();
    });

    test('Modal de Revesar Pago a Prestamo', async () => {
        // Debe aparecer el modal de Reversar Pago a Prestamo
        await expect(page.locator('text=ACTIVIDADES DEL PRÉSTAMO')).toBeVisible();

        // Subtitulos del modal
        await expect(page.getByText('Información de la Actividad')).toBeVisible();
        await expect(page.getByText('Información del usuario')).toBeVisible();
        await expect(page.getByText('Origen del cobro')).toBeVisible();
        await expect(page.getByText('Valores de la actividad')).toBeVisible();
        await expect(page.getByText('Detalle contable')).toBeVisible();
        await expect(page.getByText('Cuotas afectadas')).toBeVisible();
    });

    test('Reversar el Pago al Prestamo realizado por Caja', async () => {
        
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
