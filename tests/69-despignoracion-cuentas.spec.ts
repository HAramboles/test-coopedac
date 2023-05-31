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

test.describe('Pruebas con la Pignoracion de Cuentas', () => {
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

        // Nombre y apellido de la persona almacenados en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Pignoracion de Cuentas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Pignoracion de cuentas
        await page.getByRole('menuitem', {name: 'Pignoración de Cuentas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/pignoracion_cuenta/01-2-2-106/`);
    });

    test('Buscar una cuenta de un Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'PIGNORACIÓN DE CUENTAS'})).toBeVisible();

        // Buscar al socio
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);
        // Elegir la cuenta de Ahorro
        await page.locator('text=AHORROS NORMALES').click();
    });

    test('Datos de la cuenta', async () => {
        // Tipo de cuenta
        await expect(page.locator('#form_DESC_TIPO_CTA')).toHaveValue('AHORROS NORMALES');

        // Balance
        await expect(page.locator('#form_BALANCE')).toHaveValue('RD$ 24,100');

        // Transito
        await expect(page.locator('#form_MONTO_TRANSITO')).toHaveValue('RD$ 0');

        // Pignorado
        await expect(page.locator('#form_BALANCE_PIGNORADO')).toHaveValue('RD$ 0');

        // Disponible
        await expect(page.locator('#form_BALANCE_DISPONIBLE')).toHaveValue('RD$ 23,900');

        // Estado de Cuenta
        await expect(page.locator('#form_ESTADO_CUENTA')).toHaveValue('ACTIVA');
    });

    test('Despignorar un monto', async () => {
        // Liberar la pignoracion de 150 pesos
        await page.getByRole('row', {name: 'CONGELADO RD$ 150.00'}).locator('[data-icon="check-circle"]').click();

        // Debe salir un modal
        await expect(page.locator('h1').filter({hasText: 'RAZON DE LIBERACIÓN'})).toBeVisible();

        // Razon
        await expect(page.getByText('RAZON DE DESPIGNORACION')).toBeVisible();

        // Comentario
        await page.locator('#form_DESC_RAZON_DESPIGNORACION').fill('Despignorar los 150 pesos pignorados anteriormente');

        // Debe salir otro modal de confirmacion
        await expect(page.getByText('¿Está seguro de liberar el registro?')).toBeVisible();

        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Los 150 pesos deben estar en estado liberado
        await expect(page.getByRole('row', {name: 'PIGNORAR 150 PESOS LIBERADO'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la paga
        await page.close();
    });
});
