import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, ariaCerrar, browserConfig, dataEliminar, contextConfig, nombreTestigoCajero, userCorrecto, formBuscar } from './utils/dataTests';
import { url_activar_caja } from './utils/urls';

/* Variables globales */
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Pruebas
test.describe.serial('No permitir Eliminar el turno de una Caja con Transacciones realizadas', async () => {
    test.beforeAll(async () => { // Antes de que se realicen todas las pruebas
        /* Crear el browser, con la propiedad headless */
        browser = await chromium.launch(browserConfig);

        /* Crear un context con el storageState donde esta guardado el token de la sesion */
        context = await browser.newContext(contextConfig);

        /* Crear una nueva page usando el context */
        page = await context.newPage();

        /* Ingresar a la pagina */
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Activar Caja', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();
            
        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Activar Caja
        await page.getByRole('menuitem', {name: 'Activar Caja'}).click();

        // La url debe de cambiar
        await expect(page).toHaveURL(`${url_activar_caja}`);

        // El titulo de Activar Caja debe estar visible
        await expect(page.locator('h1').filter({hasText: 'Activar Caja'})).toBeVisible();
    });

    test('Tratar de eliminar una caja', async () => {
        // Digitar el nombre de la caja
        await page.locator(`${formBuscar}`).fill(`${userCorrecto}`);

        // Esperar a que cargue la pagina
        await page.waitForTimeout(2000);

        // La caja buscada debe mostrarse en la tabla
        await expect(page.getByRole('cell', {name: `${userCorrecto}`})).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombreTestigoCajero}`})).toBeVisible();

        // Click al boton de eliminar
        const botonEliminar = page.locator(`${dataEliminar}`);
        await expect(botonEliminar).toBeVisible();
        await botonEliminar.click();

        // Debe aparecer un mensaje
        await expect(page.getByText('¿Eliminar turno?')).toBeVisible();

        // Click al boton de Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Debe aparecer una alerta de error
        await expect(page.getByText('No se puede inactivar turno, turno tiene transacciones aplicadas.')).toBeVisible();

        // Cerrar la alerta
        await page.locator(`${ariaCerrar}`).click();

        // La caja debe seguir activada
        await expect(page.getByRole('cell', {name: `${userCorrecto}`})).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombreTestigoCajero}`})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});