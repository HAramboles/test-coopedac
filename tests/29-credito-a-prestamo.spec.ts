import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API

// Pruebas

test.describe('', () => {
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

    test('Ir a la opcion de Credito a Prestamos', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Credito a Prestamos
        await page.getByRole('menuitem', {name: 'Crédito a Préstamos'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/notas_prestamos/01-3-2-4/`);
    });

    test('Buscar un socio', async () => {
        // Nombre y apellido de la persona
        const nombre = page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CRÉDITO A PRÉSTAMOS'})).toBeVisible();

        // Buscar al socio
        await page.locator('#select-search').fill('MARIBELL REINOSO');
        // Seleccionar a la persona
        await page.locator(`text=${nombre} ${apellido}`).click();
    });

    test('Llenar los datos necesarios para el credito al prestamo', async () => {
        // Nombre y apellido de la persona
        const nombre = page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // El nombre de la persona debe estar visible
        await expect(page.locator(`text=${nombre} ${apellido}`)).toBeVisible();

        // El prestamo debe estar visible
        const prestamo = page.locator('#form_PRESTAMOS');
        await expect(prestamo).toHaveAttribute('value', 'CRÉDITO HIPOTECARIO');

        // Click al boton total al dia
        await page.getByLabel('', {exact: true}).first().check();
        await page.getByLabel('', {exact: true}).first().uncheck();

        // Monto total a aplicar
        await page.locator('#monto_a_pagar').fill('12,000');

        // Cuota
        const cuota = page.locator('#form_CUOTA');
        await expect(cuota).toHaveAttribute('value', '$416.67');

        // Deuda total
        const deudaTotal = page.locator('#form_DEUDA_CAPTITAL');
        await expect(deudaTotal).toHaveAttribute('value', '$50,000');

        // Deuda al dia
        const deudaAlDia = page.locator('#form_DEUDA_AL_DIA');
        await expect(deudaAlDia).toHaveAttribute('value', 'RD$50,000');

        // Moneda
        const moneda = page.locator('#form_ID_MONEDA');
        await expect(moneda).toHaveAttribute('value', 'PESO');

        // Tasa de moneda
        await expect(page.locator('#form_TASA_MONEDA')).toBeVisible();

        // Concepto Contable
        const conceptoContable = page.locator('#form_SEC_TIPO_CONCEPTO');
        await conceptoContable.click();
        // Seleccionar 
        await page.locator('text=NC PAGO PRESTAMOS INTERNET BANKING').click();

        // Comentario
        await page.locator('#form_NOTA').fill('Pago por internet Banking de 12,000 para el prestamo');

        // Agregar un monto
        await page.getByRole('cell', {name: 'RD$ 0.00 edit'}).getByText('RD$ 0.00').click();
        await page.getByPlaceholder('ABONO').fill('RD$ 12000');

        // Los nombres de las etiquetas deben estar visibles
        await expect(page.getByText('Concepto')).toBeVisible();
        await expect(page.getByText('Monto a la fecha')).toBeVisible();
        await expect(page.getByText('Monto nota')).toBeVisible();

        // El total debe ser el monto total a aplicar
        await expect(page.locator('h1').filter({hasText: 'TOTAL'})).toBeVisible();
        await expect(page.locator('span').filter({hasText: 'RD$ 12,000.00'})).toBeVisible();
    });

    test('Guardar el Credito al Prestamo', async () => {
        // Boton de Finalizar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        // Esperar que se abra una nueva pestaña
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonGuardar).toBeVisible(),
            await botonGuardar.click()
        ]);
        
        // Cerrar la pagina con la solicitud
        await newPage.close();

        // Se debe mostrar un mensaje 
        await expect(page.locator('text=Nota aplicadaexitosamente')).toBeVisible();
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
