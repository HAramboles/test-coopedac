import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Nota
const nota = '';

// Pruebas

test.describe('Pruebas agregando y completando notas', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una nueva page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    test('Ir a la seccion de Aportaciones', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Apertura de cuentas
        await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();

        // Aportaciones
        await page.getByRole('menuitem', {name: 'Aportaciones', exact: true}).click();

        // Tipo de captacion
        const buscadorVacio = page.locator('(//span[@class="ant-select-selection-placeholder"])');
        const buscadorLleno = page.locator('(//span[@class="ant-select-selection-item"])');
        
        // Condicion por si el tipo de captacion llega sin datos o con datos
        if (await buscadorVacio.isVisible()) {
            await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones`)
            await page.reload();
        } else if (await buscadorLleno.isVisible()) {
            // La URL debe de cambiar
            await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
        }
    });

    test('Crear una nota a la cuenta de un socio', async () => {
        // Cedula, nombre y apellido de la persona almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Ingresar la cedula en el buscador
        await page.locator('#form_search').fill(`${cedula}`);

        // Click a mas opciones 
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).locator('[data-icon="more"]').click();

        // Click en crear nueva cuenta
        await page.getByText('Agregar Nota').click();

        // Se debe mostrar un modal
        await expect(page.locator('h1').filter({hasText: `CREAR NOTA PARA: ${nombre} ${apellido}`})).toBeVisible();

        // Tipo de nota
        const tipoFijo = page.getByText('FIJO');
        const tipoTemporal = page.getByText('TEMPORAL');

        // Los dos tipos deben estar visibles
        await expect(tipoFijo).toBeVisible();
        await expect(tipoTemporal).toBeVisible();

        // Seleccionar el tipo de nota fijo
        await tipoFijo.click();

        // Agregar nota
        await page.locator('#form_NOTA').fill(`${nota}`);
        
        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Se debe mostrar un mensaje de confirmacion
        await expect(page.locator('text=Notas Persona almacenada exitosamente.')).toBeVisible();
        // Cerrar el mensaje
        await page.locator('[data-icon="close"]').click();
    });

    test('Marcar la nota como completada', async () => {
        // Cedula, nombre y apellido de la persona almacenada en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Click a mas opciones 
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).locator('[data-icon="more"]').click();

        // Click en ver notas
        await page.getByText('Ver Notas').click();

        // Debe aparecer un modal con las notas
        await expect(page.locator('h1').filter({hasText: `NOTAS PARA ${nombre} ${apellido}`})).toBeVisible();

        // La nota creada anteriormente debe estar visible
        const notaCreada = page.getByRole('row', {name: `${nota}`});
        await expect(notaCreada).toBeVisible();

        // Ver la nota
        await notaCreada.locator('[data-icon="eye"]').click();
        // Se debe mostrar un modal con la nota
        await expect(page.locator('span').filter({hasText: `${nota}`})).toBeVisible();

        // Cerrar el modal
        await page.locator('[aria-label="Close"]').click();

        // Marcar como completada la nota
        const completarNota = page.locator('[aria-label="check"]');
        await expect(completarNota).toBeVisible();
        // Click al boton
        await completarNota.click();

        // Debe salir un modal
        await expect(page.locator('text=¿Está seguro que desea marcar esta nota como completada?')).toBeVisible();
        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Se debe mostrar un mensaje de confirmacion
        await expect(page.locator('text=Notas Persona actualizada exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator('[data-icon="close"]').click();

        // El icono debe cambiar
        await expect(page.locator('(//svg[@class="bi bi-check2-all"])')).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Guardar la nota creada en el state
        await page.evaluate((nota) => window.localStorage.setItem('nota', nota), nota);

        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});