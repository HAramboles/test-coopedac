import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { url_base, url_cambio_monedas_boveda } from './utils/dataPages/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('Pruebas con el Cambio de Monedas de Boveda', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear al browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Cambio de Monedas de Boveda', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Boveda
        await page.getByRole('menuitem', {name: 'BOVEDA'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Cambio de monedas
        await page.getByRole('menuitem', {name: 'Cambio de Monedas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_cambio_monedas_boveda}`);
    });

    test('Pagina de Cambio de Monedas de Boveda', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CAMBIO DE MONEDAS'})).toBeVisible();

        // Esperar que cargue la pagina
        await page.waitForTimeout(2000);

        // Elegir la boveda principal
        // await page.locator('#form_ID_CAJA').click();
        // await page.waitForTimeout(2000);
        // // Elegir la opcion de Boveda Principal
        // await page.getByRole('option', {name: 'BOVEDA PRINCIPAL'}).click();

        // La Boveda Principal debe estar seleccionada
        await expect(page.getByText('BOVEDA PRINCIPAL')).toBeVisible();

        // Tabla de Recibido
        await expect(page.locator('h1').filter({hasText: 'RECIBIDO'})).toBeVisible();

        // Tabla de Entregado
        await expect(page.locator('h1').filter({hasText: 'ENTREGADO'})).toBeVisible();

        // Seccion Detalle Distribucion
        await expect(page.locator('h1').filter({hasText: 'DETALLE DISTRIBUCIÓN'})).toBeVisible();

        // Recibido
        await expect(page.getByTitle('Recibido')).toBeVisible();

        // Entregado
        await expect(page.getByTitle('Entregado')).toBeVisible();

        // Pendiente
        await expect(page.getByTitle('Pendiente')).toBeVisible();
    });

    test('Las denominaciones de la Boveda deben estar visibles', async () => {
        // Click al boton de Denominaciones
        const botonDenomincaciones = page.getByRole('button', {name: 'Denominaciones'});
        await expect(botonDenomincaciones).toBeVisible();
        await botonDenomincaciones.click();

        // Debe aparecer el modal con las denominaciones disponibles de la boveda
        const modalDenominaciones = page.locator('text=Denominaciones Disponible');
        await expect(modalDenominaciones).toBeVisible();

        // La tabla de las denominaciones debe estar visible en el modal 
        await expect(page.getByLabel('Denominaciones Disponible').getByRole('columnheader', {name: 'Moneda'})).toBeVisible();
        await expect(page.getByLabel('Denominaciones Disponible').getByRole('columnheader', {name: 'Cantidad'})).toBeVisible();
        await expect(page.getByLabel('Denominaciones Disponible').getByRole('columnheader', {name: 'Monto'})).toBeVisible();

        // Click al boton de Salir
        await page.getByRole('button', {name: 'Salir'}).click();
        
        // El modal debe cerrarse
        await expect(modalDenominaciones).not.toBeVisible();
    });

    test('Realizar un cambio de monedas', async () => {
        // Input cantidad 2000 de la tabla de Recibido
        const cant2000Recibido = page.locator('[id="0"]');

        // Input cantidad 1000 de la tabla de Entregado
        const cant1000Entregado = page.locator('(//input[@id="CANTIDAD_DIGITADA"])[2]');

        // Colocar una moneda de 2000 en el campo de Recibido
        await cant2000Recibido.fill('1');

        // Debe aparecer un icono de alerta rojo en la Seccion Detalle Distribucion
        const iconoAlerta = page.getByRole('img', {name: 'close-circle'});
        await expect(iconoAlerta).toBeVisible();

        // Colocar dos monedas de 1000 en el campo de Entregado
        await cant1000Entregado.fill('2');

        // Debe aparecer un icono de check verde en la Seccion Detalle Distribucion
        const iconoVerde1 = page.getByRole('img', {name: 'check-circle'})
        await expect(iconoVerde1).toBeVisible();

        // Click al boton de Guardar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();

        // Esperar que se abra una nueva pestaña con el reporte de cambio de monedas
        const page1 = await context.waitForEvent('page');

        // Cerrar la nueva pestaña
        await page1.close();

        // Debe regresar a la pagina de Cambio de Monedas de Boveda
        await expect(page.locator('h1').filter({hasText: 'CAMBIO DE MONEDAS'})).toBeVisible();
    })

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
