import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Pruebas

test.describe('Imprimir los Reportes de Admision y de Conozca a su Socio', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context =  await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la opcion de Registro de Persona', async () => {
        // Socios
        await page.getByRole('menuitem', {name: 'SOCIOS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Registrar persona
        await page.getByRole('menuitem', {name: 'Registrar persona'}).click();

        // La URL deba cambiar
        await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/`);
    });

    test('Buscar la cuenta del socio', async () => {
        // Cedula, nombre y apellido del menor
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Buscar al menor
        await page.locator('#form_search').fill(`${cedula}`);
        
        // Click al boton de editar cuenta
        const botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});
        await expect(botonEditarCuenta).toBeVisible();
        await botonEditarCuenta.click();

        // La URL debe cambiar
        await expect(page).toHaveURL(/\/edit/);
    });

    test('Ir a la ultima opcion - Relacionados del socio', async () => {
        // El titulo de la primera seccion se debe cambiar
        await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

        // Seccion de direcciones y contactos
        const relacionados = page.getByRole('button', {name: '6 Relacionados Agregar Relacionados'});
        await expect(relacionados).toBeVisible();
        await relacionados.click();
    });

    test('Imprimir Reporte de Admision', async () => {
        // El titulo de relacionados del socio debe estar visible
        await expect(page.locator('h1').filter({ hasText: 'RELACIONADOS DEL SOCIO' })).toBeVisible();

        // Boton Reporte de Admision
        const generarReporte = page.getByRole('button', {name: 'Admisión'});
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(generarReporte).toBeVisible(),
            await generarReporte.click()
        ]);

        // Cerrar la pagina con el reporte
        await newPage.close();
    });

    test('Imprimir Reporte de Conozca a su Socio', async () => {
        // El titulo de relacionados del socio debe estar visible
        await expect(page.locator('h1').filter({ hasText: 'RELACIONADOS DEL SOCIO' })).toBeVisible();

        // Boton Reporte de Conozca a su Socio
        const generarReporte = page.getByRole('button', {name: 'Conozca a su Socio'});
        // Esperar que se abra una nueva pestaña con el reporte de la cuenta 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(generarReporte).toBeVisible(),
            await generarReporte.click()
        ]);

        // Cerrar la pagina con el reporte
        await newPage.close();
    });

    test('Regresar a la pagina de los socios', async () => {
        // Boton Anterior
        const botonAnterior = page.getByRole('button', {name: 'Anterior'});
        await expect(botonAnterior).toBeVisible();
        await botonAnterior.click();

        // Debe ir a la seccion anterior
        await expect(page.locator('h1').filter({hasText: 'DIRECCIONES'})).toBeVisible();

        // Boton Cancelar
        const botonCancelar = page.getByRole('button', {name: 'Cancelar'});
        await expect(botonCancelar).toBeVisible();
        await botonCancelar.click();

        // Debe salir un modal de confirmacion
        await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();

        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // El titulo principal de la pagina debe esatr visible
        await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
})