import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe('Pruebas con el Cobro de Servicios', () => {
    test.beforeAll(async () => { // Antes de las pruebas
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

        // Nombre y apellido de la persona alamcenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Cobros de Oficina', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Cobro de servicios
        await page.getByRole('menuitem', {name: 'Cobro de Servicios'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/cobros_multiples_servicios/01-2-2-107/`)
    });

    test('Cobrar un Servicio a un Socio', async () => {
        // El titulo principal debe estar presente
        await expect(page.locator('h1').filter({hasText: 'COBRO DE SERVICIOS'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);
        // Elegir al socio
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Referencia
        await page.locator('#form_DOC_REF_NAME').click();
        // Elegir otros ingresos
        await page.getByRole('option', {name: 'Otros Ingresos'}).click();

        // Monto
        await page.locator('#form_MONTO').fill('500');

        // Cajero
        const buscarCajero = page.locator('#form_ID_PERSONAL_ASIGNADO');
        await buscarCajero.click();
        // Buscar un cajero
        await buscarCajero.fill('BPSHA');
        // Elegir bpsharamboles
        await page.getByRole('option', {name: 'CAJA BPSHARAMBOLES'}).click();

        // Comentario
        await page.locator('#form_NOTAS').fill('Cobro de otros ingresos por la suma de 500');

        // Click a guardar
        await page.getByRole('button', {name: 'Guardar'}).click();

        // Esperar que se muestre un mensaje de que se ha realizado correctamente
        await expect(page.getByText('Sesiones Movimientos almacenada exitosamente.')).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
