import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar, ariaCerrar, browserConfig } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con el Cobro de Servicios - Caja', () => {
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

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ingresar a la opcion de Transferencia Fondos de Caja', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Transacciones fondos de caja
        await page.getByRole('menuitem', {name: 'Cobro de Servicios'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/cobro_servicios/01-4-1-2-7/`);
    });

    test('Buscar un Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'COBRO DE SERVICIOS'})).toBeVisible();

        // Buscar al socio
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);
        // Elegir al socio
        await page.getByText(`${nombre} ${apellido}`).click();

        // Referencia
        await page.locator('#form_DOC_REF_NAME').fill('Venta de');
        // Elegir venta de alcancias
        await page.getByText('Venta de Alcancías').click();

        // Antes de colocar un monto deben estar visibles dos checks verdes
        await expect(page.getByRole('img', {name: 'check-circle'}).first()).toBeVisible();
        await expect(page.getByRole('img', {name: 'check-circle'}).last()).toBeVisible();

        // Monto
        await page.locator('#form_MONTO').fill('100');

        // Ahora debe mostrarse un icono de alerta rojo
        await expect(page.getByRole('img', {name: 'close-circle'})).toBeVisible();

        // Comentario
        await page.locator('#form_NOTAS').fill('Cobro de venta de alcancias');
    });

    test('Distribuir un monto', async () => {
        // Titulo Entregado
        await expect(page.getByRole('heading', {name: 'Recibido'})).toBeVisible();

        // Distribuir 1 de 100
        await page.locator('[id="4"]').fill('1');

        // Ahora no debe mostrarse un icono de alerta rojo
        await expect(page.getByRole('img', {name: 'close-circle'})).not.toBeVisible();

        // Deben mostrarse los checks verdes nuevamente
        await expect(page.getByRole('img', {name: 'check-circle'}).first()).toBeVisible();
        await expect(page.getByRole('img', {name: 'check-circle'}).last()).toBeVisible();
    });

    test('Guardar la distribucion', async () => {
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();

        // Esperar a que se abra una nueva ventana
        const page1 = await context.waitForEvent('page');

        // Cerrar la ventana con el recibo
        await page1.close();

        // Debe regresar a la pagina anterior, y debe salir un mensaje
        await expect(page.locator('text=Otros ingresos almacenado exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator(`${ariaCerrar}`).click();
    });

    test.afterAll(async () => {
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
