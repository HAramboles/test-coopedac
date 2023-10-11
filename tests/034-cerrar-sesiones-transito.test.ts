import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, formBuscar } from './utils/dataTests';
import { url_cerrar_sesiones_transito } from './utils/urls';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas Cerrando Sesiones en Transito', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser= await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test.beforeEach(async () => { // Info para el reporte de Allure
        await allure.owner('Hector Aramboles');
        await allure.severity(Severity.NORMAL);
    });

    test('Ir a la pagina de Cerrar Sesiones en Transito', async () => {
        // TESORERIA
        await page.getByRole('menuitem', { name: 'TESORERIA' }).click();

        // CAJAS
        await page.getByRole('menuitem', { name: 'CAJAS' }).click();

        // OPERACIONES 
        await page.getByRole('menuitem', { name: 'OPERACIONES' }).click();

        // Cerrar Sesiones en Transito
        await page.getByRole('menuitem', { name: 'Cerrar Sesiones en Tránsito' }).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_cerrar_sesiones_transito}`);
    });

    test('Cerrar una Sesion en Transito', async () => {
        // El titulo de la pagina debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CERRAR SESIONES EN TRÁNSITO'})).toBeVisible();

        // Click al boton de Actualizar
        await page.getByRole('button', {name: 'Actualizar'}).click();

        // Digitar el nombre de la persona
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Se debe mostrar la sesion buscada
        const titularSesion = page.getByRole('row', {name: `${nombre} ${apellido}`});
        await expect(titularSesion).toBeVisible();

        // Click al boton de Cerrar
        await titularSesion.getByRole('button', {name: 'Cerrar'}).click();

        // Debe salir un modal
        const modalCierre = page.locator('text=MOTIVO DEL CIERRE DE LA SESIÓN');
        await expect(modalCierre).toBeVisible();

        // Digitar una razon por la cual se cierra la sesion
        await page.locator('#form_CONCEPTO_ANULACION').fill('Se ha terminado de trabajar con la sesion');

        // Clicl al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // El modal debe desaparecer
        await expect(modalCierre).not.toBeVisible();

        // Aparece la alerta de Operacion Exitosa
        await expect(page.locator('text=Sesión inactivada corectamente')).toBeVisible();

        // Click al boton de Actualizar
        const botonActualizar = page.getByRole('button', {name: 'Actualizar'});
        await expect(botonActualizar).toBeVisible();
        await botonActualizar.click();

        // La sesion no debe estar visible
        await expect(titularSesion).not.toBeVisible();
    });
    
    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
