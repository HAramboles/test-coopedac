import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataCerrar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas

test.describe('Pruebas con el Cambio de Moneda', () => {
    test.beforeAll(async () => {
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
    });

    test('Ir a la opcion de Cambio de Monedas', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Transacciones fondos de caja
        await page.getByRole('menuitem', {name: 'Cambio de Monedas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/cambio_monedas/01-4-1-2-8/`);
    });

    test('Realizar un Cambio de Monedas sin abrir el modal de las Denominaciones', async () => {
        // Recibir 1000 pesos

        // Campo de RD 1000
        const cant1000 = page.locator('[id="1"]'); 

        // Cantidad = 1
        await cant1000.fill('1');

        // El check verde ya no debe estar, en su lugar debe estar un icono de alerta rojo
        await expect(page.getByRole('img', {name: 'close-circle'})).toBeVisible();

        // Entregar 2 de 500 pesos

        // Campo de RD 500
        const cant500 = page.locator('[id="15"]'); 

        // Cantidad = 1
        await cant500.fill('2');

        // El check verde debe mostrarse de nuevo porque se realizo correctamente la distribucion
        await expect(page.getByRole('img', {name: 'check-circle'})).toBeVisible();

        // Guadar el Cambio de Moneda

        // Boton de Guardar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        // Esperar que se abra una nueva pestaña con el recibo del cambio de moneda
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click en el boton de Guardar
            await expect(botonGuardar).toBeVisible(),
            await botonGuardar.click()
        ]);

        // Cerrar la nueva pestaña
        await newPage.close();

        // Debe regresar a la pagina anterior
        await expect(page.locator('h1').filter({hasText: 'CAMBIO DE MONEDAS'})).toBeVisible();
    });

    test('Recibir 500 pesos', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CAMBIO DE MONEDAS'})).toBeVisible();

        // Debe estar un check verde en detalle de distribucion
        await expect(page.getByRole('img', {name: 'check-circle'})).toBeVisible();

        // Titulo de recibido
        await expect(page.locator('h1').filter({hasText: 'RECIBIDO'})).toBeVisible();

        // Campo de RD 500
        const cant500 = page.locator('[id="2"]'); 

        // Cantidad = 1
        await cant500.fill('1');

        // El check verde ya no debe estar, en su lugar debe estar un icono de alerta rojo
        await expect(page.getByRole('img', {name: 'close-circle'})).toBeVisible();
    });

    test('Probar el boton de Denominaciones', async () => {
        // Boton Denominaciones
        const botonDenominaciones = page.getByRole('button', {name: 'Denominaciones'});
        await expect(botonDenominaciones).toBeVisible();
        await botonDenominaciones.click();

        // Debe salir un modal
        const modalDenominaciones = page.locator('h1').filter({hasText: 'Denominaciones'});
        await expect(modalDenominaciones).toBeVisible();

        // Click al boton de salir del modal
        const botonSalir = page.getByRole('button', {name: 'Salir'});
        await expect(botonSalir).toBeVisible();
        await botonSalir.click();

        // El modal de las denominaciones debe desaparecer
        await expect(modalDenominaciones).not.toBeVisible();

        // El input de RD 500 debe tener la cantidad digitada anteriormente
        const cant500 = page.locator('[id="2"]');
        await expect(cant500).toHaveValue('1');
    });

    test('Entregar mas de lo que tiene la caja', async () => {
        // Titulo de entregado
        await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();

        // Campo de RD 200
        const cant200 = page.locator('[id="16"]'); 

        // Colocar una cantidad exagerada
        await cant200.fill('99999999999');

        // Debe mostrar un mensaje de alerta
        await expect(page.locator('text=Alerta')).toBeVisible();

        // Cerrar la alerta
        await page.locator(`${dataCerrar}`).click();
    });

    test('Entregar los 500 pesos con otras monedas', async () => {
        // Titulo de entregado
        await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();

        // Reiniciar la cantidad de la moneda de 200 a 0
        const cant200 = page.locator('[id="16"]');
        await cant200.fill('0');

        // Distribuir los 500 pesos en 2 de 200 y 1 de 100
        await cant200.fill('2')
        const cant100 = page.locator('[id="17"]');
        await cant100.fill('1');

        // El check verde debe mostrarse de nuevo porque se realizo correctamente la distribucion
        await expect(page.getByRole('img', {name: 'check-circle'})).toBeVisible();
    });

    test('Guardar el Cambio de la Moneda', async () => {
        // Boton de Guardar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        // Esperar que se abra una nueva pestaña con el recibo del cambio de moneda
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click en el boton de Guardar
            await expect(botonGuardar).toBeVisible(),
            await botonGuardar.click()
        ]);

        // Cerrar la nueva pestaña
        await newPage.close();

        // Debe regresar a la pagina anterior
        await expect(page.locator('h1').filter({hasText: 'CAMBIO DE MONEDAS'})).toBeVisible();

        // En los input de 200 y 100 pesos la cantidad debe reiniciar a 0
        const cant200 = page.locator('[id="16"]');
        const cant100 = page.locator('[id="17"]');

        await expect(cant200).toHaveValue('0');
        await expect(cant100).toHaveValue('0');
    });

    test('Probar que los input de la tabla Entregado se queden en 0 luego de borrar la cantidad digitasa', async () => {
        // Campo de 200 pesos
        const cant200 = page.locator('[id="16"]');

        // Colocar una cantidad y luego borrarla
        await cant200.fill('5');
        await cant200.press('Backspace');

        // Debe mostrarse un 0
        await expect(cant200).toHaveValue('0');
    });

    test.afterAll(async () => {
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
