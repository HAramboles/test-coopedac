import { Browser, BrowserContext, expect, Locator, Page, test, chromium } from '@playwright/test';
import { url_base, ariaCerrar, selectBuscar, browserConfig } from './utils/dataTests';
import { url_consulta_movimientos_cuentas } from './utils/urls';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Variables de los buscadores
let buscadorPersona: Locator;
let buscadorCuenta: Locator;

// Cedula de la persona
let cedula: string | null;

// Pruebas
test.describe.serial('Pueba con el Historial de los Movimientos de una Cuenta', () => {
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

        // Cedula de la persona almacenados en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));

        // Inputs para buscar las cuentas del socio
        buscadorPersona = page.locator(`${selectBuscar}`);
        buscadorCuenta = page.locator('#rc_select_1');
    });

    test('Ir a la opcion de Consulta Movimientos Cuenta', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Consulta Movimientos Cuenta
        await page.getByRole('menuitem', {name: 'Consulta Movimientos Cuenta'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);
    });

    test('Cuenta de Aportaciones del Socio', async () => {
        // Seleccionar un tipo de cuenta a buscar
        await buscadorCuenta.click();
        // Click a la opcion de cuenta de Aportaciones
        await page.getByRole('option', {name: 'APORTACIONES'}).click();

        // Buscar un socio
        await buscadorPersona.fill(`${cedula}`);
        // Elegir la Cuenta de Aportaciones del Socio
        await page.getByText('| APORTACIONES |').click();

        // La URL no debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);

        // El tipo de captacion debe ser de Aportaciones
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('APORTACIONES');

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Imprimir los movimientos de la cuenta de Aportaciones
        const imprimirAportaciones = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con el estado de la cuenta 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Imprimir
            await expect(imprimirAportaciones).toBeVisible(),
            await imprimirAportaciones.click()
        ]);

        // Esperar que el reporte este visible
        await newPage.waitForTimeout(8000);

        // Cerrar la pagina con la el reporte del estado de la cuenta
        await newPage.close();

        // Titulo movimiento de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Movimientos de la cuenta
        await expect(page.getByText('DEPOSITO DE 2000 PESOS A LA CUENTA DE APORTACIONES')).toBeVisible();
        await expect(page.getByText('TRANSFERENCIA A LA CUENTA DE APORTACIONES')).toBeVisible();

        // Balance final
        await expect(page.getByRole('row', { name: 'Balance Final : 3,000.00' })).toBeVisible();
    });

    test('Cuenta de Aportaciones Preferentes del Socio', async () => {
        // Seleccionar un tipo de cuenta a buscar
        await buscadorCuenta.click();
        // Click a la opcion de cuenta de Aportaciones Preferentes
        await page.getByRole('option', {name: 'APORTACIONES PREFERENTES'}).click();

        // Buscar una cuenta del mismo socio
        await buscadorPersona.fill(`${cedula}`);
        // Elegir la Cuenta de Aportaciones Preferentes del Socio
        await page.getByText('APORTACIONES PREFERENTES').click();

        // La URL no debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);

        // El tipo de captacion debe ser de Aportaciones Preferentes
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('APORTACIONES PREFERENTES');

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Imprimir los movimientos de la cuenta
        const imprimirAportacionesPreferentes = page.getByRole('button', {name: 'Imprimir'});
        // Imprimir los movimientos de la cuenta de Aportaciones Preferentes 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(imprimirAportacionesPreferentes).toBeVisible(),
            await imprimirAportacionesPreferentes.click()
        ]);

        // Esperar que el reporte este visible
        await newPage.waitForTimeout(8000);

        // Cerrar la pagina con el reporte del estado de la cuenta
        await newPage.close();

        // Titulo movimiento de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Movimientos de la cuenta
        await expect(page.getByText('DEPOSITO INICIAL APERTURA CERTIFICADO APORTACIONES PREFERENTES')).toBeVisible();
        await expect(page.getByText('TRANSFERENCIA A LA CUENTA DE APORTACIONES PREFERENTES (FINANZAS)')).toBeVisible();

        // Balance final
        await expect(page.getByRole('row', { name: 'Balance Final : 2,500.00' })).toBeVisible();
    });

    test('Cuenta de Ahorros Normales del Socio', async () => {
        // Seleccionar un tipo de cuenta a buscar
        await buscadorCuenta.click();
        // Click a la opcion de cuenta de Ahorros Normales
        await page.getByRole('option', {name: 'AHORROS NORMALES'}).click();

        // Buscar una cuenta del mismo socio
        await buscadorPersona.fill(`${cedula}`);
        // Elegir la Cuenta de Ahorros Normales del Socio
        await page.getByText('AHORROS NORMALES').click();

        // La URL no debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);

        // El tipo de captacion debe ser de Ahorros Normales
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('AHORROS NORMALES');

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Imprimir los movimientos de la cuenta
        const imprimirAhorrosNormales = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con la tabla de amortizacion 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(imprimirAhorrosNormales).toBeVisible(),
            await imprimirAhorrosNormales.click()
        ]);

        // Esperar que el reporte este visible
        await newPage.waitForTimeout(8000);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await newPage.close();

        // Titulo movimiento de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Movimientos de la cuenta
        await expect(page.getByText('DEPOSITO DE 2000 PESOS A LA CUENTA DE AHORROS')).toBeVisible();
        await expect(page.getByText('RETIRO DE 100 PESOS DE LA CUENTA DE AHORROS')).toBeVisible();
        await expect(page.getByText('TRANSFERENCIA BANCARIA')).toBeVisible();
        await expect(page.getByText('RETIRO PARA APERTURA CERTIFICADO FINANCIEROS PAGADERAS')).toBeVisible();
        await expect(page.getByText('RETIRO PARA APERTURA CERTIFICADO APORTACIONES PREFERENTES')).toBeVisible();
        await expect(page.getByText('GENERADO AUTOMATICAMENTE PARA APLICAR DESEMBOLSO PRESTAMO').first()).toBeVisible();
        await expect(page.getByText('TRANSFERENCIA A LA CUENTA DE APORTACIONES', {exact: true})).toBeVisible();
        await expect(page.getByText('TRANSFERENCIA A LA CUENTA DE APORTACIONES PREFERENTES (FINANZAS)')).toBeVisible();
        await expect(page.getByText('PAGO A PRESTAMO')).toBeVisible();
        await expect(page.getByText('CANCELACION DOCUMENTO POR PAGAR').last()).toBeVisible();

        // Balance final
        await expect(page.getByRole('row', { name: 'Balance Final : 11,722.22' })).toBeVisible();

        // Click al boton de pignoraciones
        const botonPignoraciones = page.getByRole('button', {name: 'Ir a pignoración'});
        await expect(botonPignoraciones).toBeVisible();
        await botonPignoraciones.click();

        // Se debe mostrar un modal de las pignoraciones de la cuenta
        await expect(page.locator('h1').filter({hasText: 'HISTORIAL DE PIGNORACIONES'})).toBeVisible();

        // Cerrar el modal
        await page.locator(`${ariaCerrar}`).click();

        // Se debe cerrar el modal por lo que el titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS CUENTA'})).toBeVisible();
    });

    test('Cuenta de Ahorros por Nomina del Socio', async () => {
        // Seleccionar un tipo de cuenta a buscar
        await buscadorCuenta.click();
        // Click a la opcion de cuenta de Ahorros por Nomina
        await page.getByRole('option', {name: 'AHORROS POR NOMINA'}).click();

        // Buscar una cuenta del mismo socio
        await buscadorPersona.fill(`${cedula}`);
        // Elegir la Cuenta de Ahorros por Nomina del Socio
        await page.getByText('AHORROS POR NOMINA').click();

        // La URL no debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);

        // El tipo de captacion debe ser de Ahorros por Nomina
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('AHORROS POR NOMINA');

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Imprimir los movimientos de la cuenta
        const imprimirAhorrosPorNomina = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con la tabla de amortizacion 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(imprimirAhorrosPorNomina).toBeVisible(),
            await imprimirAhorrosPorNomina.click()
        ]);

        // Esperar que el reporte este visible
        await newPage.waitForTimeout(8000);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await newPage.close();

        // Titulo movimiento de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // No debe tener ningun movimiento
        await expect(page.getByText('No hay datos')).toBeVisible();

        // Balance final
        await expect(page.getByRole('row', { name: 'Balance Final : 0.00' })).toBeVisible();
    });

    test('Cuenta de Ahorros - Orden de Pago del Socio', async () => {
        // Seleccionar un tipo de cuenta a buscar
        await buscadorCuenta.click();
        // Click a la opcion de cuenta de Orden de Pago
        await page.getByRole('option', {name: 'ORDEN DE PAGO'}).click();

        // Buscar una cuenta del mismo socio
        await buscadorPersona.fill(`${cedula}`);
        // Elegir la Cuenta de Orden de Pago del Socio
        await page.getByText('ORDEN DE PAGO').click();

        // La URL no debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);

        // El tipo de captacion debe ser de Orden de Pago
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('ORDEN DE PAGO');

        // El estado debe estar en Cancelada
        await expect(page.getByText('CANCELADA')).toBeVisible();

        // Imprimir los movimientos de la cuenta
        const imprimirOrdenPago = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con la tabla de amortizacion 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(imprimirOrdenPago).toBeVisible(),
            await imprimirOrdenPago.click()
        ]);

        // Esperar que el reporte este visible
        await newPage.waitForTimeout(8000);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await newPage.close();

        // Titulo movimiento de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // No debe tener ningun movimiento
        await expect(page.getByText('No hay datos')).toBeVisible();

        // Balance final
        await expect(page.getByRole('row', { name: 'Balance Final : 0.00' })).toBeVisible();
    });

    test('Cuenta de Certificados - Financieros Pagaderas del Socio', async () => {
        // La URL NO debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);

        // Seleccionar un tipo de cuenta a buscar
        await buscadorCuenta.click();
        // Click a la opcion de cuenta de Financieros Pagaderas
        await page.getByRole('option', {name: 'FINANCIEROS PAGADERAS'}).click();

        // Buscar una cuenta del mismo socio
        await buscadorPersona.fill(`${cedula}`);
        // Elegir la Cuenta de Certificado - Financieros Pagaderos
        await page.getByText('| FINANCIEROS PAGADERAS |').click();

        // El tipo de captacion debe ser de Financieros Pagaderas
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('FINANCIEROS PAGADERAS');

        // El estado debe estar en Activa
        await expect(page.getByText('CANCELADA')).toBeVisible();

        // Imprimir los movimientos de la cuenta
        const imprimirFinancierosPagaderas = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con el reporte de los movimientos de la cuenta 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(imprimirFinancierosPagaderas).toBeVisible(),
            await imprimirFinancierosPagaderas.click()
        ]);

        // Esperar que el reporte este visible
        await newPage.waitForTimeout(8000);

        // Cerrar la pagina con el reporte con todos los movimientos de la cuenta
        await newPage.close();

        // Titulo movimientos de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Movimientos de la cuenta, deben de estar los 4 movimientos que se han hecho a la cuenta
        await expect(page.getByText('DEPOSITO INICIAL APERTURA CERTIFICADO FINANCIEROS PAGADERAS')).toBeVisible();
        await expect(page.getByText('INGRESO DE 2050 PESOS A LA CUENTA DE CERTIFICADO')).toBeVisible();
        await expect(page.getByText('DEBITO DE 600 PESOS A LA CUENTA DE CERTIFICADO')).toBeVisible();
        await expect(page.getByText('CANCELACION DOCUMENTO POR PAGAR')).toBeVisible();

        // El balance final debe ser 0, ya que la cuenta esta cancelada
        await expect(page.getByRole('row', { name: 'Balance Final : 0.00' })).toBeVisible();

        // Interes generado no pagado
        await expect(page.getByRole('row', {name: 'Interes Generado no Pagado: RD$ 0'})).toBeVisible();
    });

    test('Cuenta de Certificados - Financieros Reinvertidas del Socio', async () => {
        // La URL NO debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);

        // Seleccionar un tipo de cuenta a buscar
        await buscadorCuenta.click();
        // Click a la opcion de cuenta de Financieros Reinvertidas
        await page.getByRole('option', {name: 'FINANCIEROS REINVERTIDAS'}).click();

        // Buscar una cuenta del mismo socio
        await buscadorPersona.fill(`${cedula}`);
        // Elegir la Cuenta de Certificado - Financieros Reinvertidas
        await page.getByText('| FINANCIEROS REINVERTIDAS |').click();

        // El tipo de captacion debe ser de Financieros Reinvertidas
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('FINANCIEROS REINVERTIDAS');

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Imprimir los movimientos de la cuenta
        const imprimirFinancierosReinvertidas = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con el reporte de los movimientos de la cuenta 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(imprimirFinancierosReinvertidas).toBeVisible(),
            await imprimirFinancierosReinvertidas.click()
        ]);

        // Esperar que el reporte este visible
        await newPage.waitForTimeout(8000);

        // Cerrar la pagina con el reporte con todos los movimientos de la cuenta
        await newPage.close();

        // Titulo movimientos de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Movimientos de la cuenta, deben de estar los 4 movimientos que se han hecho a la cuenta
        await expect(page.getByText('DEPOSITO INICIAL APERTURA CERTIFICADO FINANCIEROS REINVERTIDAS')).toBeVisible();

        // Balance Final
        await expect(page.getByRole('row', { name: 'Balance Final : 50.00' })).toBeVisible();

        // Interes generado no pagado
        await expect(page.getByRole('row', {name: 'Interes Generado no Pagado: RD$ 0'})).toBeVisible();
    });

    test('Cuenta de Certificados - Inversion Pagaderas del Socio', async () => {
        // La URL NO debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);

        // Seleccionar un tipo de cuenta a buscar
        await buscadorCuenta.click();
        // Click a la opcion de cuenta de Inversion Pagaderas
        await page.getByRole('option', {name: 'INVERSION PAGADERAS'}).click();

        // Buscar una cuenta del mismo socio
        await buscadorPersona.fill(`${cedula}`);
        // Elegir la Cuenta de Certificado - Inversion Pagaderas
        await page.getByText('| INVERSION PAGADERAS |').click();

        // El tipo de captacion debe ser de Inversion Pagaderas
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('INVERSION PAGADERAS');

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Imprimir los movimientos de la cuenta
        const imprimirFinancierosReinvertidas = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con el reporte de los movimientos de la cuenta 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(imprimirFinancierosReinvertidas).toBeVisible(),
            await imprimirFinancierosReinvertidas.click()
        ]);

        // Esperar que el reporte este visible
        await newPage.waitForTimeout(8000);

        // Cerrar la pagina con el reporte con todos los movimientos de la cuenta
        await newPage.close();

        // Titulo movimientos de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Movimientos de la cuenta, deben de estar los 4 movimientos que se han hecho a la cuenta
        await expect(page.getByText('DEPOSITO INICIAL APERTURA CERTIFICADO INVERSION PAGADERAS')).toBeVisible();

        // Balance Final
        await expect(page.getByRole('row', { name: 'Balance Final : 50.00' })).toBeVisible();

        // Interes generado no pagado
        await expect(page.getByRole('row', {name: 'Interes Generado no Pagado: RD$ 0'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});