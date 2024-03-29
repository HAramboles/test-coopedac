import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { diaActualFormato } from './utils/functions/fechas';
import { selectBuscar, noData, dataVer, dataCerrar } from './utils/data/inputsButtons';
import { url_base, url_estado_cuentas_cobrar } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

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
        await expect(page.locator('#form_FECHA_DE_CORTE')).toHaveValue(`${diaActualFormato}`);

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
        await expect(page.getByRole('cell', {name: '15.00%'}).first()).toBeVisible();

        // Monto Desembolsado del Credito
        await expect(page.getByText('300,000.00').first()).toBeVisible();

        // Estado del Credito
        await expect(page.getByRole('cell', {name: 'CANCELADO'})).toBeVisible();

        // Imprimir Estado a la Fecha de Corte
        const botonImprimirEstado = page.getByRole('button', {name: 'printer', exact: true});

        // Esperar que se abra una nueva pestaña
        const [page1] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonImprimirEstado).toBeVisible(),
            await botonImprimirEstado.click()
        ]);
        
        // Cerrar la pagina con el reporte del Estado a la Fecha de Corte
        await page1.close();
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
        await expect(page.getByRole('row', {name: 'Monto Cuota 3,885.00'})).toBeVisible();

        // Plazo
        await expect(page.getByRole('row', {name: 'Plazo 48'})).toBeVisible();

        // Frecuencia
        await expect(page.getByRole('row', {name: 'Frecuencia MENSUAL'})).toBeVisible();

        // Tasa de Interes
        await expect(page.getByRole('row', {name: 'Tasa de Interés 15.00 %'})).toBeVisible();

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
        await expect(page.getByRole('row', {name: 'Monto aprobado 300,000.00'})).toBeVisible();

        // Monto Desembolsado
        await expect(page.getByRole('row', {name: 'Monto desembolsado 300,000.00'})).toBeVisible();  

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
        await expect(botonRecibos).toBeVisible(),
        await botonRecibos.click()

        // Esperar que se abra una nueva pestaña con el reporte de todos los recibos
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte de todos los recibos
        await page1.close();

        // No dbe mostrarse fecha invalida en ninguno de los pagos
        await expect(page.getByText('Fecha inválida', {exact: true})).not.toBeVisible();

        // Totales
        await expect(page.getByRole('row', {name: 'TOTALES: 300,000.00 0.00 300,000.00 0.00 0.00 0.00 0.00 300,000.00'})).toBeVisible();
    });

    test('Ver las actividades de uno de los pagos al prestamo', async () => {
        // Click al boton de Ver Actividades del primer pago
        const verActividades = page.locator(`${dataVer}`).nth(1);
        await expect(verActividades).toBeVisible();
        await verActividades.click();

        // Debe aparecer un modal con las actividades de ese pago
        const modalAcitividadesPrestamo = page.locator('h1').filter({hasText: 'ACTIVIDADES DEL PRÉSTAMO'});
        await expect(modalAcitividadesPrestamo).toBeVisible();

        // Informacion de la actividad
        await expect(page.getByText('Información de la Actividad')).toBeVisible();

        // Actividad
        await expect(page.locator('#form_DESC_TIPO_TRANS')).toHaveValue('NOTAS CREDITO PRESTAMOS');

        // Monto
        await expect(page.getByLabel('Monto')).toHaveValue(' 150,000.00');

        // Oferta
        await expect(page.locator('#form_DESC_OFERTA')).toHaveValue('CRÉDITO HIPOTECARIO');

        // Socio
        await expect(page.locator('#form_NOMBRE')).toHaveValue(`${nombre} ${apellido}`);

        // Descripcion
        await expect(page.getByText(' ABONO A CAPITAL')).toBeVisible();

        // Comentario
        await expect(page.getByText('PAGO POR INTERNET BANKING DE 150,000 PARA EL PRESTAMO')).toBeVisible();

        // Valores de la actividad
        await expect(page.getByText('Valores de la actividad')).toBeVisible();

        // Capital
        await expect(page.locator('#form_CAPITAL')).toHaveValue(' 150,000.00');

        //await page.pause();

        // Total Recibido
        await expect(page.locator('form').filter({hasText: 'CapitalAbonoInterésCargosMoraSeguroTotal recibido'}).locator('#form_TOTAL_RECIBIDO')).toHaveValue(' 150,000.00');

        // Cuotas afectadas
        await expect(page.getByText('Cuotas afectadas')).toBeVisible();

        // Informacion del usuario
        await expect(page.getByText('Información del usuario')).toBeVisible();

        // Origen del cobro
        await expect(page.getByText('Origen del cobro')).toBeVisible();

        // Detalle contable
        await expect(page.getByText('Detalle contable')).toBeVisible();

        // Cerrar el modal de las actividades del pago
        await page.locator(`${dataCerrar}`).click();
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
        await expect(page.getByLabel('Cuotas pendientes').getByRole('columnheader', {name: 'Mora'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Seguro'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Otros'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Total'}).last()).toBeVisible();

        // No deben haber datos
        await expect(page.getByText(`${noData}`)).toBeVisible();
    });

    test('Ver la cuenta de cobro del prestamo', async () => {
        // Ir a la opcion de Cuentas de cobro
        const cuentaCobro = page.getByText('Cuenta(s) de Cobro');
        await expect(cuentaCobro).toBeVisible();
        await cuentaCobro.click();

        // La tabla de las cuentas de cobro debe estar visible
        await expect(page.getByRole('columnheader', {name: 'Titular'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Número de cuenta'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Tipo de cuenta'})).toBeVisible();

        // Deben mostrarse el titular y el tipo de cuenta
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
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
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
