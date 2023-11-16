import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { diaActualFormato } from './utils/functions/fechas';
import { selectBuscar, noData } from './utils/data/inputsButtons';
import { url_base, url_estado_cuentas_cobrar } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre de la persona juridica
let nombreEmpresa: string | null;

// Nombre y apellido de la persona fisica
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con el Esatado de las Cuentas por Cobrar de un Socio', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona fisica guardada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
        
        // Nombre de la empresa juridica guardada en el state
        nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));
    });

    // Funcion para cerrar las paginas que se abren con los diferentes reportes en los pasos de la solicitud de credito
    const CerrarPaginasReportes = async () => {
        context.on('page', async (page) => {
            await page.waitForTimeout(1000);
            await page.close();
        });
    };

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
        await page.locator(`${selectBuscar}`).fill(`${nombreEmpresa}`);
        // Elegir al Socio buscado
        await page.locator(`text=${nombreEmpresa}`).click();

        // Fecha de Corte, debe ser la fecha actual
        await expect(page.locator('#form_FECHA_DE_CORTE')).toHaveValue(`${diaActualFormato}`);

        // Oficial de Cobro
        await expect(page.locator('#form_NOMBRE_OFICIAL_COBRO')).toHaveValue('LEGAL');

        // Boton de Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        await expect(botonImprimir).toBeVisible();

        // El estado de los prestamos debe ser Desembolsado
        await expect(page.getByTitle('DESEMBOLSADO')).toBeVisible();
    });

    test('Prestamo del Socio', async () => {
        // Titulo Movimientos
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS'})).toBeVisible();

        // Concepto el Credito
        await expect(page.getByText('CRÉDITO AGRÍCOLA')).toBeVisible();

        // Moneda del Credito
        await expect(page.getByRole('cell', {name: 'RD'})).toBeVisible();

        // Tasa del Credito
        await expect(page.getByRole('cell', {name: '13.95%'}).first()).toBeVisible();

        // Monto Desembolsado del Credito
        await expect(page.getByText('300,000.00').first()).toBeVisible();

        // Estado del Credito
        await expect(page.getByRole('cell', {name: 'DESEMBOLSADO'})).toBeVisible();

        // Imprimir Estado a la Fecha de Corte
        const botonImprimirEstado = page.getByRole('button', {name: 'printer', exact: true});
        await expect(botonImprimirEstado).toBeVisible();
        await botonImprimirEstado.click();

        // Esperar que se abra una nueva pestaña
        CerrarPaginasReportes();
    });

    test('Los inputs de aseguradora, oferta/negocio, banco y sucursal no deben estar visibles', async () => {
        // Aseguradora
        await expect(page.getByText('Aseguradora')).not.toBeVisible();

        // Oferta/Negocio
        await expect(page.getByText('Oferta/Negocio')).not.toBeVisible();

        // Banco
        await expect(page.getByText('Banco')).not.toBeVisible();

        // Sucursal
        await expect(page.getByText('Sucursal')).not.toBeVisible();
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
        await expect(page.locator('text=0.00').last()).toBeVisible();
    });

    test('Datos de préstamo', async () => {
        // Ir a la opcion de Datos del Prestamo
        const datosPrestamo = page.getByText('Datos de préstamo');
        await expect(datosPrestamo).toBeVisible();
        await datosPrestamo.click();

        // Deben estar visibles todos los datos del prestamo del socio

        // Descripcion Oferta
        await expect(page.getByRole('row', {name: 'Descripción Oferta CRÉDITO AGRÍCOLA'})).toBeVisible();

        // Monto Cuota
        await expect(page.getByRole('row', {name: 'Monto Cuota 20,925.00'})).toBeVisible();

        // Plazo
        await expect(page.getByRole('row', {name: 'Plazo 48'})).toBeVisible();

        // Frecuencia
        await expect(page.getByRole('row', {name: 'Frecuencia SEMESTRAL'})).toBeVisible();

        // Tasa de Interes
        await expect(page.getByRole('row', {name: 'Tasa de Interés 13.95 %'})).toBeVisible();

        // Gracia Interes
        await expect(page.getByRole('row', {name: 'Gracia Interés 0.00'})).toBeVisible();

        // Base Calc. Interes
        await expect(page.getByRole('row', {name: 'Base Calc. Interés Año fiscal (360 días)'})).toBeVisible();

        // Tipo Financ
        await expect(page.getByRole('row', {name: 'Tipo Financ. COMERCIALES'})).toBeVisible();

        // Tasa Mora
        await expect(page.getByRole('row', {name: 'Tasa Mora 6.00'})).toBeVisible();

        // Via Desembolso
        await expect(page.getByRole('row', {name: 'VÍa Desembolso DEPOSITO'})).toBeVisible();

        // Monto Aprobado
        await expect(page.getByRole('row', {name: 'Monto aprobado 300,000.00'})).toBeVisible();

        // Monto Desembolsado
        await expect(page.getByRole('row', {name: 'Monto desembolsado 300,000.00'})).toBeVisible();  

        // Tipo Prestamo
        await expect(page.getByRole('row', {name: 'Tipo préstamo COMERCIALES'})).toBeVisible();

        // Estado Prestamo
        await expect(page.getByRole('row', {name: 'Estado préstamo DESEMBOLSADO'})).toBeVisible();
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
        await expect(page.getByRole('row', {name: 'TOTALES: 300,000.00 0.00 0.00 0.00 0.00 0.00 0.00 0.00'})).toBeVisible();
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
        await expect(page.getByText(`${noData}`)).toBeVisible();
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

        // Boton de Imprimir
        const botonImprimir = page.getByLabel('Ver Tabla de Amortización').getByRole('button', {name: 'printer Imprimir'});
        await expect(botonImprimir).toBeVisible();
        await botonImprimir.click();

        // Esperar que se abra una nueva pestaña con el reporte de la tabla de amortizacion
        const page1 = await context.newPage();
        
        // Cerrar la pagina con el reporte de la tabla de amortizacion
        await page1.close();

        // Debe regresar a la pagina de Estado de Cuentas por Cobrar
        await expect(page.locator('h1').filter({hasText: 'ESTADO DE CUENTAS POR COBRAR'})).toBeVisible();

        // Ir a la seccion de situacion del movimiento
        const datosPrestamo = page.getByText('Situación del movimiento');
        await expect(datosPrestamo).toBeVisible();
        await datosPrestamo.click();
    });

    test('Cambiar de Socio y la seccion de Movimientos debe limpiarse', async () => {
        // Buscar un Socio
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);
        // Elegir al Socio buscado
        await page.locator(`text=${nombre} ${apellido}`).click();

        // La seccion de Movimientos debe estar vacia
        await expect(page.getByRole('row', {name: 'TOTAL VENCIDO: 0.00'})).toBeVisible();
        await expect(page.getByRole('row', {name: 'BAL GENERAL: 0.00'})).toBeVisible();
        await expect(page.getByRole('row', {name: 'TOTAL PAGADO: 0.00'}).first()).toBeVisible();
        await expect(page.getByRole('row', {name: 'TOTAL PAGADO: 0.00'}).last()).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
