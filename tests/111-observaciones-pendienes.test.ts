import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { dataEliminar } from './utils/data/inputsButtons';
import { url_base, url_observaciones_pendientes } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { nombreTestigoCajero, userCorrecto } from './utils/data/usuarios';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre de la empresa
let nombreEmpresa: string | null;

// Pruebas
test.describe.serial('Pruebas con las Observaciones Pendientes', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear un context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre de la empresa almacenada en el state
        nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));
    });

    test('Ir a la pagina de Observaciones Pendientes', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Observaciones Pendientes
        await page.getByRole('menuitem', {name: 'Observaciones pendientes'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_observaciones_pendientes}`);
    });

    test('Buscar la Observacion agregada al Prestamo de la persona juridica', async () => {
        // El titulo principal debe ser estar visible
        await expect(page.locator('h1').filter({hasText: 'OBSERVACIONES PENDIENTES'})).toBeVisible();

        // Deben estar visibles las dos formas de filtar las obseraciones, por usuario y ejecutivo
        await expect(page.getByLabel('Usuario')).toBeVisible();
        await expect(page.getByLabel('Ejecutivo')).toBeVisible();

        // Click al selector de usuario
        await page.locator('#form_ID_USUARIO').click();
        // Elegir la caja en uso
        await page.getByRole('option', {name: `${userCorrecto} - ${nombreTestigoCajero}`}).click();

        // Debe mostrarse la observacion pendiente
        await expect(page.getByRole('cell', {name: `${nombreEmpresa}`})).toBeVisible();
    });

    test('Eliminar la Observacion agregada al Prestamo de la persona juriridica', async () => {
        // Click al boton de Eliminar
        await page.getByRole('row', {name: `${nombreEmpresa}`}).locator(`${dataEliminar}`).click();

        // Debe aparecer un mensaje
        await expect(page.locator('text=¿Seguro que desea eliminar la observación?')).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Debe aparecer una alerta de exito
        await expect(page.locator('text=Datos actualizados.')).toBeVisible();

        // No debe mostarse la observacion pendiente en la pagina
        await expect(page.getByRole('cell', {name: `${nombreEmpresa}`})).not.toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
