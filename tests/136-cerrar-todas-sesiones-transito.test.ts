import { Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { url_base, browserConfig, formBuscar, userCorrecto, dataCerrar } from './utils/dataTests';
import { url_cerrar_sesiones_transito } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Cerrar Sesion
let botonCerrarSesion: Locator;

// Pruebas
test.describe.serial('Pruebas Cerrando Todas las Sesiones en Transito que tenga la Caja antes del Cuadre de Caja', async () => {
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

        // Boton de Cerrar Sesion
        botonCerrarSesion = page.getByRole('button', {name: 'Cerrar'});
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

    test('Buscar la Caja con las Sesiones en Transito', async () => {
        // El titulo de la pagina debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CERRAR SESIONES EN TRÁNSITO'})).toBeVisible();
    
        // Click al boton de Actualizar
        await page.getByRole('button', {name: 'Actualizar'}).click();

        // Digitar el nombre de la caja en uso
        await page.locator(`${formBuscar}`).fill(`${userCorrecto}`);

        // Esperar que carguen los resultados
        await page.waitForTimeout(3000);
    })

    for (let i = 1; i < 8; i++) {
        test(`Cerrar Sesion en Transito numero ${i}`, async () => {    
            // Click al boton de Cerrar Sesion de la primera Sesion en Transito
            await expect(botonCerrarSesion.first()).toBeVisible();
            await botonCerrarSesion.first().click();
    
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

            // Cerrar la alerta de Operacion Exitosa
            await page.locator(`${dataCerrar}`).click();

            // La URL no debe cambiar
            await expect(page).toHaveURL(`${url_cerrar_sesiones_transito}`);
    
            // Click al boton de Actualizar
            const botonActualizar = page.getByRole('button', {name: 'Actualizar'});
            await expect(botonActualizar).toBeVisible();
            await botonActualizar.click();
    
            // Esperar que se actualicen los datos
            await page.waitForTimeout(3000);
        });
    };
    
    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
