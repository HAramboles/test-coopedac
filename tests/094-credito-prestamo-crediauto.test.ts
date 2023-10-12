import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar, browserConfig } from './utils/dataTests';
import { url_nota_credito_prestamos } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la opcion de Credito a Prestamos', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
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
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Credito a Prestamos', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Credito a Prestamos
        await page.getByRole('menuitem', {name: 'Crédito a Préstamos'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_nota_credito_prestamos}`);
    });

    test('Buscar un socio', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CRÉDITO A PRÉSTAMOS'})).toBeVisible();

        // Buscar al socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Seleccionar a la persona
        await page.locator(`text=${nombre} ${apellido}`).click();
    });

    test('Llenar los datos necesarios para el credito al prestamo', async () => {
        // El prestamo debe estar visible
        const prestamo = page.locator('#form_PRESTAMOS');
        await expect(prestamo).toHaveAttribute('value', 'CRÉDIAUTOS');

        // Cuota
        const cuota = page.locator('#form_CUOTA');
        await expect(cuota).toHaveValue('RD$ 3,015.9');

        // Deuda total
        const deudaTotal = page.locator('#form_DEUDA_CAPTITAL');
        await expect(deudaTotal).toHaveValue('RD$ 125,000');

        // Moneda
        await expect(page.locator('text=PESO')).toBeVisible();

        // Tasa de moneda
        await expect(page.locator('#form_TASA_MONEDA')).toBeVisible();

        // Click al boton Cancelar Prestamo
        await page.locator('(//INPUT[@type="checkbox"])[2]').click();

        // Concepto Contable
        const conceptoContable = page.locator('#form_SEC_TIPO_CONCEPTO');
        await conceptoContable.click();
        // Seleccionar 
        await page.locator('text=CANCELACIÓN DE PRÉSTAMO').click();

        // Comentario
        await page.locator('#form_NOTA').fill('Cancelar Prestamo');

        // Los nombres de las etiquetas deben estar visibles
        await expect(page.getByRole('columnheader', {name: 'Concepto'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Monto a la fecha'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Monto nota'})).toBeVisible();

        // El total debe ser el monto total a aplicar
        await expect(page.locator('h1').filter({hasText: 'TOTAL'})).toBeVisible();
        await expect(page.locator('span').filter({hasText: 'RD$ 125,000.00'})).toBeVisible();
    });

    test('Guardar el Credito al Prestamo', async () => {
        // Boton de Finalizar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();
        
        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close();

        // Se debe mostrar un mensaje 
        await expect(page.locator('text=Nota aplicada exitosamente')).toBeVisible();
        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
