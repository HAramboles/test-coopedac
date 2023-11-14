import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { selectBuscar } from './utils/data/inputsButtons';
import { url_base, url_consulta_pignoracion_cuentas } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula de la persona
let cedula: string | null;

// Pruebas
test.describe.serial('Pruebas con el Historial de Pignoracion de Cuentas', () => {
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

    test('Ver las pignoraciones de una Cuenta de un Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'PIGNORACIÓN DE CUENTAS'})).toBeVisible();

        // Buscar la cuenta de un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir la cuenta de Ahorros Normales
        await page.locator('text=AHORROS NORMALES').click();

        // Tipo de Cuenta
        await expect(page.locator('#form_DESC_TIPO_CTA')).toHaveValue('AHORROS NORMALES');

        // En el input Pignorado debe salir el mismo que se muestra en el filtrado
        await expect(page.locator('#form_BALANCE_PIGNORADO')).toHaveValue('RD$ 100');

        // Estado de Cuenta
        await expect(page.locator('#form_ESTADO_CUENTA')).toHaveValue('ACTIVA');

        // Solo debe estar el monto pignorado
        await expect(page.getByRole('row', {name: 'CONGELADO RD$ 100.00'})).toBeVisible(); 

        // Esperar tres segundos
        await page.waitForTimeout(3000);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
