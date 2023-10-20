import { Browser, BrowserContext, chromium, Page, expect, test } from '@playwright/test';
import { url_base, browserConfig, dataVer, contextConfig } from './utils/dataTests';
import { url_estado_cuentas } from './utils/urls';

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
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

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
        await expect(page).toHaveURL(`${url_estado_cuentas}`);
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
    });

    test('Ver los movimientos de la cuenta de Ahorros Normales', async () => {
        // Cambiar el tipo de cuentas
        await page.getByTitle('TODAS').click();
        // Elegir Ahorros Normales
        await page.getByRole('option', {name: 'AHORROS NORMALES'}).click();

        // Click al boton de Ir a Movimientos
        await page.locator('[aria-label="export"]').first().click();

        // Debe abrirse una nueva ventana con la pagina de consulta movimientos
        const page1 = await context.waitForEvent('page');

        // La URL debe cambiar
        await expect(page1).toHaveURL(/\/consulta_captaciones/);

        // Cerrar la nueva pestaña
        await page1.close(); 
    });

    test('Cuentas y prestamos cancelados', async () => {
        // Cambiar a Cuentas y prestamos cancelados
        await page.locator('text=CUENTAS ACTIVAS Y PRÉSTAMOS DESEMBOLSADOS').click();
        // Elegir cancelados
        await page.locator('text=CUENTAS Y PRÉSTAMOS CANCELADOS').click();

        // Cambiar el tipo de cuenta a Todas
        await page.locator('#root').getByTitle('AHORROS NORMALES').click();
        // Elegir Todas
        await page.getByRole('option', {name: 'TODAS'}).click();

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

    test('Ver los movimientos del Prestamo Hipotecario', async () => {
        // Click al boton de Ir a Movimientos
        await page.getByRole('row', {name: 'CRÉDITO HIPOTECARIO'}).locator('[aria-label="export"]').first().click();

        // Debe abrirse una nueva ventana con la pagina de consulta movimientos
        const pageEstadoCuentasCobrar = await context.waitForEvent('page');

        // La URL debe cambiar
        await expect(pageEstadoCuentasCobrar).toHaveURL(/\/estado_cuenta_consolidado/);

        // El titulo debe estar visible
        await expect(pageEstadoCuentasCobrar.locator('h1').filter({hasText: 'ESTADO DE CUENTAS POR COBRAR'})).toBeVisible();

        // El prestamo Hipotecario debe estar seleccionado
        await expect(pageEstadoCuentasCobrar.locator('(//INPUT[@type="radio"])[3]')).toBeChecked();

        // Las secciones de los datos del prestamo deben estar visibles
        await expect(pageEstadoCuentasCobrar.getByText('Situación del movimiento')).toBeVisible();
        await expect(pageEstadoCuentasCobrar.getByText('Historial de pagos')).toBeVisible();
        await expect(pageEstadoCuentasCobrar.getByText('Cuotas pendientes')).toBeVisible();
        await expect(pageEstadoCuentasCobrar.getByText('Ver Tabla de Amortización')).toBeVisible();
        const seccionDatosPrestamos = pageEstadoCuentasCobrar.getByText('Datos de préstamo');
        await expect(seccionDatosPrestamos).toBeVisible();

        // Click a la seccion Datos Prestamos
        await seccionDatosPrestamos.click();

        //  El estado del prestamo debe ser cancelado
        await expect(pageEstadoCuentasCobrar.getByRole('row', {name: 'Estado préstamo CANCELADO'})).toBeVisible();

        // Cerrar la nueva pestaña
        await pageEstadoCuentasCobrar.close();

        // Debe regresar a la pagina de Estado de Cuentas
        await expect(page).toHaveURL(`${url_estado_cuentas}`);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
})