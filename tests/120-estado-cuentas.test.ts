import { Browser, BrowserContext, chromium, Page, expect, test } from '@playwright/test';
import { url_base, browserConfig, dataVer } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Prueba con el Estado de Cuenta', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json',
        });

        // Crear una nueva Page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la seccion de Estado de Cuentas', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Consultas    
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Estado de Cuentas    
        await page.getByRole('menuitem', {name: 'Estado de Cuentas'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/estado_cuentas/01-2-4-2/`);
    });

    test('Buscar un socio', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'ESTADO DE CUENTA DEL CLIENTE'})).toBeVisible();

        // Buscar un socio
        await page.locator('#form').getByRole('combobox').fill(`${cedula}`);
        // Click al socio buscado
        await page.locator(`text=${nombre} ${apellido}`).click();
    });

    test('Cuentas Activas y Prestamos Desembolsados', async () => {
        // El titulo de los productos del socio debe estar visible
        await expect(page.locator('h1').filter({hasText: 'PRODUCTOS DEL SOCIO'})).toBeVisible();

        // Estado de los productos
        const estadoDesembolsado = page.locator('text=CUENTAS ACTIVAS Y PRÉSTAMOS DESEMBOLSADOS');
        await expect(estadoDesembolsado).toBeVisible();
        //await estadoDesembolsado.click();

        // Deben estar visibles solo las cuentas activas
        
        // Cuenta de Aportaciones
        await expect(page.getByRole('cell', {name: 'APORTACIONES', exact: true}).first()).toBeVisible();

        // Cuenta de Aportaciones Preferentes
        await expect(page.getByRole('cell', {name: 'APORTACIONES PREFERENTES', exact: true})).toBeVisible();

        // Cuenta de Ahorros Normales
        await expect(page.getByRole('cell', {name: 'AHORROS NORMALES', exact: true}).first()).toBeVisible();

        // Cuenta de Ahorros por Nomina
        await expect(page.getByRole('cell', {name: 'AHORROS POR NOMINA', exact: true})).toBeVisible();

        // Cuenta de Certificado - Financieros Reinvertidas
        await expect(page.getByRole('cell', {name: 'FINANCIEROS REINVERTIDAS', exact: true})).toBeVisible();

        // Cuenta de Certificado - Inversion Pagaderas
        await expect(page.getByRole('cell', {name: 'INVERSION PAGADERAS', exact: true})).toBeVisible();

        // Totales
        await expect(page.getByRole('row', {name: 'TOTALES: RD$ 30,200.00 RD$ 29,900.00'}).first()).toBeVisible();
    });

    test('Cuentas y prestamos cancelados', async () => {
        // Cambiar a Cuentas y prestamos cancelados
        await page.locator('text=CUENTAS ACTIVAS Y PRÉSTAMOS DESEMBOLSADOS').click();
        // Elegir cancelados
        await page.locator('text=CUENTAS Y PRÉSTAMOS CANCELADOS').click();

        // Cuenta de Certificados - Financieros Pagaderas
        await expect(page.getByRole('cell', {name: 'FINANCIEROS PAGADERAS', exact: true})).toBeVisible();

        // Cuenta de Orden de Pago
        await expect(page.getByRole('cell', {name: 'ORDEN DE PAGO', exact: true})).toBeVisible();

        // Credito Hipotecario
        await expect(page.getByRole('cell', {name: 'CRÉDITO HIPOTECARIO', exact: true})).toBeVisible();

        // No debe mostrarse el icono de ver pignoraciones cuando es un prestamo
        await expect(page.getByRole('row', {name: 'CRÉDITO HIPOTECARIO'}).locator(`${dataVer}`)).not.toBeVisible();

        // Totales 
        await expect(page.getByRole('row', {name: 'TOTALES: RD$ 0.00 RD$ 0.00'}).first()).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
})