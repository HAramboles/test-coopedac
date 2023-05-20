import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate } from './utils/utils'
import { url_base } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe('', () => {
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
        await page.locator('#select-search').fill(`${nombre} ${apellido}`);
        // Elegir la cuenta de Ahorro
        await page.locator('text=AHORROS NORMALES').click();
    });

    test('Datos de la cuenta', async () => {
        // Tipo de cuenta
        await expect(page.locator('#form_DESC_TIPO_CTA')).toHaveValue('AHORROS NORMALES');

        // Balance
        await expect(page.locator('#form_BALANCE')).toHaveValue('');

        // Transito
        await expect(page.locator('#form_MONTO_TRANSITO')).toHaveValue('RD$ 0');

        // Pignorado
        await expect(page.locator('#form_BALANCE_PIGNORADO')).toHaveValue('RD$ 0');

        // Disponible
        await expect(page.locator('#form_BALANCE_DISPONIBLE')).toHaveValue('');

        // Estado de Cuenta
        await expect(page.locator('#form_ESTADO_CUENTA')).toHaveValue('ACTIVA');
    });

    test('Pignorar un monto', async () => {
        // Fecha de pignoracion
        await expect(page.locator('#form_FECHA_PIGNORACION')).toHaveValue(`${formatDate(new Date())}`);

        // Cambiar la razon a motivos legales
        await page.locator('div').filter({ hasText: /^OTRAS RAZONES$/ }).nth(4).click();
        await page.locator('text=MOTIVOS LEGALES').click();

        // Monto
        await page.locator('#form_MONTO').fill('100');

        // Descripcion Pignoracion
        await page.locator('#form_DESC_PIGNORACION').fill('Pignorar 100 pesos');

        // Click en Guardar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();

        // Debe salir un mensaje de que se realizo correctamente la operacion
        await expect(page.locator('text=Captaciones congeladas almacenada exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator('[aria-label="close"]').click();

        // Los 100 pesos deben estar en estado congelado
        await expect(page.getByRole('row', {name: 'PIGNORAR 100 PESOS CONGELADO'})).toBeVisible();
    });

    test('Liberar un Monto', async () => {
        // Monto
        await page.locator('#form_MONTO').fill('150');

        // Descripcion Pignoracion
        await page.locator('#form_DESC_PIGNORACION').fill('Pignorar 150 pesos');

        // Click en Guardar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();

        // Debe salir un mensaje de que se realizo correctamente la operacion
        await expect(page.locator('text=Captaciones congeladas almacenada exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator('[aria-label="close"]').click();

        // Los 150 pesos deben estar en estado congelado
        await expect(page.getByRole('row', {name: 'PIGNORAR 150 PESOS CONGELADO'})).toBeVisible();

        // Liberar la pignoracion de 150 pesos
        await page.getByRole('row', {name: 'CONGELADO RD$ 150.00'}).locator('[data-icon="check-circle"]').click();

        // Debe salir un modal de confirmacion
        await expect(page.locator('text=¿Está seguro de liberar el registro?')).toBeVisible();

        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Debe haber cambiado de Congelado a Liberado
        await expect(page.getByRole('row', {name: 'PIGNORAR 150 PESOS LIBERADO'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la paga
        await page.close();
    });
});
