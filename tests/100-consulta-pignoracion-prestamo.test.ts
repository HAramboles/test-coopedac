import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar, browserConfig, contextConfig } from './utils/dataTests';
import { url_consulta_pignoracion_cuentas } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula de la persona
let cedula: string | null;

// Pruebas
test.describe.serial('Pruebas con el Historial de Pignoracion de la Cuenta usada como Garantia para Prestamos', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
    });

    test('Ir a la opcion del Historial de Pignoracion de Cuentas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Consulta Pignoracion de Cuentas
        await page.getByRole('menuitem', {name: 'Consulta Pignoración de Cuentas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_consulta_pignoracion_cuentas}`);
    });

    test('Solo deben estar la pignoracion manual y la de la Linea de Credito', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'PIGNORACIÓN DE CUENTAS'})).toBeVisible();

        // Buscar la cuenta de un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir la cuenta de Ahorros Normales
        await page.locator('text=AHORROS NORMALES').click();

        // Tipo de Cuenta
        await expect(page.locator('#form_DESC_TIPO_CTA')).toHaveValue('AHORROS NORMALES');

        // Estado de Cuenta
        await expect(page.locator('#form_ESTADO_CUENTA')).toHaveValue('ACTIVA');

        // Debe estar el monto pignorado usado como garantia para la Linea de Credito
        await expect(page.getByRole('row', {name: 'CONGELADO RD$ 10,000.00'})).toBeVisible(); 

        // Y la Razon Pignoracion debe ser que es usada como garantia de prestamos
        await expect(page.getByRole('row', {name: 'GARANTIA DE PRESTAMO'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
