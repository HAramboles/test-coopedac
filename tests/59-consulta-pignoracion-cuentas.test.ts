import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe.serial('Pruebas con el Historial de Pignoracion de Cuentas', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
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

    test('Ir a la opcion del Historial de Pignoracion de Cuentas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Consulta Pignoracion de Cuentas
        await page.getByRole('menuitem', {name: 'Consulta Pignoración de Cuentas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/pignoracion_cuenta/01-2-4-12/`);
    });

    test('Ver las pignoraciones de una Cuenta de un Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'PIGNORACIÓN DE CUENTAS'})).toBeVisible();

        // Buscar la cuenta de un socio
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);
        // Elegir la cuenta de Ahorros Normales
        await page.locator('text=AHORROS NORMALES').click();

        // Tipo de Cuenta
        await expect(page.locator('#form_DESC_TIPO_CTA')).toHaveValue('AHORROS NORMALES');

        // En el input Pignorado debe salir el mismo que se muestra en el filtrado
        await expect(page.locator('#form_BALANCE_PIGNORADO')).toHaveValue('RD$ 100');

        // Estado de Cuenta
        await expect(page.locator('#form_ESTADO_CUENTA')).toHaveValue('ACTIVA');

        // Debe estar el monto pignorado
        await expect(page.getByRole('row', {name: 'CONGELADO RD$ 100.00'})).toBeVisible(); 

        // Debe estar el monto despignorado
        await expect(page.getByRole('row', {name: 'LIBERADO RD$ 150.00'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
