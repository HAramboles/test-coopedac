import { Browser, BrowserContext, chromium, expect, Page, test } from "@playwright/test";
import { url_base, ariaCerrar, formBuscar } from "./utils/dataTests";

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe.serial('Pruebas con la Confirmacion de Cancelacion de Cuentas', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false,
            args: ['--window-position=-1300,100'],
        });

        // Crear el context 
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Confirmar la Cancelacion de Cuentas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Confirmar Cancelacion Cuentas
        await page.getByRole('menuitem', {name: 'Confirmar Cancelación Cuentas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/confirmar_cierre_cuenta/01-2-3-4/`);
    });

    test('Datos de la Solicitud de la Cancelacion', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES PENDIENTES CIERRE DE CUENTAS'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Click en buscar
        await page.locator('[data-icon="search"]').click();

        // Tipo de Captacion
        await expect(page.getByRole('cell', {name: 'ORDEN DE PAGO', exact: true})).toBeVisible();

        // Observaciones
        await expect(page.getByRole('cell', {name: 'TIENE MUCHAS CUENTAS, CERRAR LA DE ORDEN DE PAGO'})).toBeVisible();
    });

    test('Confirmar la Cancelacion de la Cuenta', async () => {
        // Boton de Confirmar
        await page.locator('[aria-label="check-circle"]').click();

        // Debe redirigirse a la pagina de Cancelacion de Cuentas
        await expect(page).toHaveURL(/\/cancelar_cuentas/);

        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'CANCELAR CUENTAS'})).toBeVisible();

        // Nombre del socio
        await expect(page.getByText(`| ${nombre} ${apellido} |`)).toBeVisible();

        // Forma de Pago
        await page.locator('#form_FORMA_PAGO').click();

        // Seleccionar la opcion Transferencia a Cuenta
        await page.getByText('TRANSFERENCIA A CUENTA').click();

        // Cuenta Destino
        await page.locator('#form_CUENTA').click();

        // Seleccionar la cuenta de Ahorros Normales
        await page.getByText('AHORROS NORMALES').click();

        // Razon de Cancelacion
        await expect(page.getByText('OTRAS RAZONES')).toBeVisible();

        // Comentario
        await page.locator('#form_COMENTARIO').fill('Confirmar la Cancelacion de la cuenta de Orden de Pago');
    });

    test('Cancelar la Cuenta', async () => {
        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Deben salir dos mensajes, cerrar uno de los mensajes
        await page.locator(`${ariaCerrar}`).first().click();

        // Debe redirigirse a la Confirmacion de Cancelacion de Cuentas
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES PENDIENTES CIERRE DE CUENTAS'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context 
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
