import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate } from './utils/fechas';
import { url_base, selectBuscar, browserConfig } from './utils/dataTests';
import { url_estado_cuentas_cobrar } from './utils/urls';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con el Esatado de las Cuentas por Cobrar de un Socio', () => {
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

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona fisica guardada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test.beforeEach(async () => { // Info para el reporte de Allure
        await allure.owner('Hector Aramboles');
        await allure.severity(Severity.NORMAL);
    });

    test('Ir a la opcion de Estado de Cuentas por Cobrar', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Estado de Cuentas por Cobrar
        await page.getByRole('menuitem', {name: 'Estado de Cuentas por Cobrar'}).click();

        // La URL de la pagina
        await expect(page).toHaveURL(`${url_estado_cuentas_cobrar}`);
    });

    test('Datos del Socio', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'ESTADO DE CUENTAS POR COBRAR'})).toBeVisible();

        // Buscar un Socio
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);
        // Elegir al Socio buscado
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Fecha de Corte, debe ser la fecha actual
        await expect(page.locator('#form_FECHA_DE_CORTE')).toHaveValue(`${formatDate(new Date())}`);

        // Oficial de Cobro
        await expect(page.locator('#form_NOMBRE_OFICIAL_COBRO')).toHaveValue('CLIENTE INACTIVO');

        // Boton de Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        await expect(botonImprimir).toBeVisible();

        // Cambiar el estado de los prestamos a mostrar a Cancelado
        await page.getByTitle('DESEMBOLSADO').click();
        await page.getByRole('option', {name: 'CANCELADO'}).click();
    });

    test('Prestamo del Socio', async () => {
        // Titulo Movimientos
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS'})).toBeVisible();

        // Concepto el Credito
        await expect(page.getByText('CRÉDITO HIPOTECARIO')).toBeVisible();

        // Moneda del Credito
        await expect(page.getByRole('cell', {name: 'RD'})).toBeVisible();

        // Tasa del Credito
        await expect(page.getByRole('cell', {name: '10.00%'}).first()).toBeVisible();

        // Monto Desembolsado del Credito
        await expect(page.getByText('50,000.00').first()).toBeVisible();

        // Estado del Credito
        await expect(page.getByRole('cell', {name: 'CANCELADO'})).toBeVisible();

        // Imprimir Estado a la Fecha de Corte
        const botonImprimirEstado = page.getByRole('button', {name: 'printer', exact: true});
        await expect(botonImprimirEstado).toBeVisible();
        await botonImprimirEstado.click();

        // Esperar que se abra una nueva pestaña
        const page1 = await context.newPage();
        
        // Cerrar la pagina con el reporte del Estado a la Fecha de Corte
        await page1.close();
    });

    test('Situación del movimiento', async () => {
        // Seleccionar el Prestamo
        await page.getByRole('radio').click();

        // Situacion del movimiento
        await expect(page.getByText('Situación del movimiento')).toBeVisible();

        // Para ponerse al dia
        await expect(page.locator('h1').filter({hasText: 'PARA PONERSE AL DÍA'})).toBeVisible();

        // Para cancelar prestamo
        await expect(page.locator('h1').filter({hasText: 'PARA CANCELAR PRÉSTAMO'})).toBeVisible();

        // Monto pagado prestamo
        await expect(page.locator('h1').filter({hasText: 'MONTO PAGADO PRÉSTAMO'})).toBeVisible();

        // Ultimo pago
        await expect(page.locator('h1').filter({hasText: 'ÚLTIMO PAGO'})).toBeVisible();

        // Total pagado
        await expect(page.locator('h1').filter({hasText: 'TOTAL PAGADO:'}).first()).toBeVisible();
        await expect(page.locator('text=50,000.00').last()).toBeVisible();
    });

    test('Datos de préstamo', async () => {
        // Ir a la opcion de Datos del Prestamo
        const datosPrestamo = page.getByText('Datos de préstamo');
        await expect(datosPrestamo).toBeVisible();
        await datosPrestamo.click();

        // Deben estar visibles todos los datos del prestamo del socio

        // Descripcion Oferta
        await expect(page.getByRole('row', {name: 'Descripción Oferta CRÉDITO HIPOTECARIO'})).toBeVisible();

        // Monto Cuota
        await expect(page.getByRole('row', {name: 'Monto Cuota 416.67'})).toBeVisible();

        // Plazo
        await expect(page.getByRole('row', {name: 'Plazo 48'})).toBeVisible();

        // Frecuencia
        await expect(page.getByRole('row', {name: 'Frecuencia MENSUAL'})).toBeVisible();

        // Tasa de Interes
        await expect(page.getByRole('row', {name: 'Tasa de Interés 10.00 %'})).toBeVisible();

        // Gracia Interes
        await expect(page.getByRole('row', {name: 'Gracia Interés 0.00'})).toBeVisible();

        // Base Calc. Interes
        await expect(page.getByRole('row', {name: 'Base Calc. Interés Año fiscal (360 días)'})).toBeVisible();

        // Tipo Financ
        await expect(page.getByRole('row', {name: 'Tipo Financ. HIPOTECARIOS'})).toBeVisible();

        // Tasa Mora
        await expect(page.getByRole('row', {name: 'Tasa Mora 6.00'})).toBeVisible();

        // Via Desembolso
        await expect(page.getByRole('row', {name: 'VÍa Desembolso DEPOSITO'})).toBeVisible();

        // Monto Aprobado
        await expect(page.getByRole('row', {name: 'Monto aprobado 50,000.00'})).toBeVisible();

        // Monto Desembolsado
        await expect(page.getByRole('row', {name: 'Monto desembolsado 50,000.00'})).toBeVisible();  

        // Tipo Prestamo
        await expect(page.getByRole('row', {name: 'Tipo préstamo HIPOTECARIOS'})).toBeVisible();

        // Estado Prestamo
        await expect(page.getByRole('row', {name: 'Estado préstamo CANCELADO'})).toBeVisible();
    });

    test('Historial de pagos', async () => {
        // Ir a la opcion de Hitorial de Pagos
        const historialPagos = page.getByText('Historial de pagos');
        await expect(historialPagos).toBeVisible();
        await historialPagos.click();

        // Boton de Imprimir todos los recibos de los pagos
        const botonRecibos = page.getByRole('button', {name: 'Todos los Recibos'});
        await expect(botonRecibos).toBeVisible();
        await botonRecibos.click();

        // Esperar que se abra una nueva ventana con el reporte 
        const page1 = await context.newPage();
        
        // Cerrar la pagina con el reporte de todos los recibos
        await page1.close();

        // Totales
        await expect(page.getByRole('row', {name: 'TOTALES: 50,000.00 0.00 50,000.00 0.00 0.00 0.00	0.00 100,000.00'})).toBeVisible();
    });

    test('Cuotas pendientes', async () => {
        // Ir a la opcion de Cuotas Pendientes
        const cuotasPendientes = page.getByText('Cuotas pendientes');
        await expect(cuotasPendientes).toBeVisible();
        await cuotasPendientes.click();

        // La tabla debe estar visible
        await expect(page.getByText('No. Cuota')).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Fecha Cuota'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Capital', exact: true})).toBeVisible();
        await expect(page.getByText('Interes').last()).toBeVisible();
        await expect(page.getByText('Mora').last()).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Seguro'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Otros'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Total'}).last()).toBeVisible();

        // No deben haber datos
        await expect(page.locator('text=No data')).toBeVisible();
    });

    test('Ver Tabla de Amortización', async () => {
        // Ir a la opcion de Tabla de Amortizacion
        const tablaAmortizacion = page.getByText('Ver Tabla de Amortización');
        await expect(tablaAmortizacion).toBeVisible();
        await tablaAmortizacion.click();

        // La tabla debe estar visible
        await expect(page.getByRole('columnheader', {name: 'No. Cuota'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Fecha'}).last()).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Abono Programado'})).toBeVisible();
        await expect(page.getByText('Capital').last()).toBeVisible();
        await expect(page.getByText('Interés').last()).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Seguro'})).toBeVisible();
        await expect(page.getByText('Cargos').last()).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Total'}).last()).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Balance'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
