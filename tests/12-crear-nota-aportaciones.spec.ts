import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nota
const nota = 'Deposito a Aportaciones y a Ahorros';

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

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

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a Apertura de cuenta de aportaciones', async () => {
        // Captaciones
        await page.locator('text=CAPTACIONES').click();

        // Apertura de cuentas
        await page.locator('text=APERTURA DE CUENTAS').click();

        // Captaciones
        await page.locator('text=Aportaciones').first().click();

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'APORTACIONES'})).toBeVisible();
        
        // Condicion por si el tipo de captacion llega sin datos o con datos
        const tipoCaptacion = page.getByTitle('APORTACIONES', {exact: true});

        if (await tipoCaptacion.isHidden()) {
            // Si no llega el tipo de captacion, manualmente dirigise a la url de las aportaciones
            await page.goto(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
        } else if (await tipoCaptacion.isVisible()) {
            // La URL debe de cambiar
            await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);

            // El titulo debe estar visible
            await expect(page.locator('h1').filter({hasText: 'APORTACIONES'})).toBeVisible();
        }
    });

    test('Crear una nota a la cuenta de un socio', async () => {
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
        // Click a mas opciones 
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).locator('[data-icon="more"]').click();

        // Click en ver notas
        await page.getByText('Ver Notas').click();

        // Debe aparecer un modal con las notas
        await expect(page.locator('h1').filter({hasText: `NOTAS PARA ${nombre} ${apellido}`})).toBeVisible();

        // La nota creada anteriormente debe estar visible
        const notaCreada = page.getByRole('row', {name: `${nota}`});
        await expect(notaCreada).toBeVisible();

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

        // Cerrar el mensaje de confirmacion
        await page.locator('.ant-notification-notice-close').click();

        // Cerrar el modal de las notas
        await page.getByRole('button', {name: 'Close'}).click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Guardar la nota creada en el state
        await page.evaluate((nota) => window.localStorage.setItem('nota', nota), nota);

        // Guardar nuevamente el Storage con la nota creada
        await context.storageState({path: 'state.json'});

        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});