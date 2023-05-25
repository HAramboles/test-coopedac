import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate } from './utils/utils';
import { url_base, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Constante con la Fecha del Primer Pago, debe ser el mismo dia un mes despues
const mesPrimerPago = new Date();
mesPrimerPago.setMonth(mesPrimerPago.getMonth() + 1);

// Constantes con los diferentes meses que se deben mostrar en los abonos programados
const mes2 = new Date();    
const mes4 = new Date();
const mes6 = new Date();
const mes8 = new Date();
const mes10 = new Date();
const mes12 = new Date();

// El mes debe aumentar de 2 en 2 en los abonos programados
mes2.setMonth(mes2.getMonth() + 2);
mes4.setMonth(mes4.getMonth() + 4)
mes6.setMonth(mes6.getMonth() + 6)
mes8.setMonth(mes8.getMonth() + 8)
mes10.setMonth(mes10.getMonth() + 10)
mes12.setMonth(mes12.getMonth() + 12);

// Pruebas

test.describe('Pruebas con la Tabla de Amortizacion', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre ya apellido de la persona
        cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de la Tabla de Amortizacion', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Tabla de amortizacion
        await page.getByRole('menuitem', {name: 'Tabla de amortización'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/tabla_amortizacion/01-3-4-2/`);

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TABLA DE AMORTIZACIÓN'})).toBeVisible();
    });

    test('Calcular la Tabla de Amortizacion de un Socio - Solo Interes', async () => {
        // Titulo General
        await expect(page.locator('h1').filter({hasText: 'GENERAL'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir el socio
        await page.getByText(`${nombre} ${apellido}`).click();

        // Colocar un monto
        await page.locator('#amortization_form_MONTO').fill('25000');

        // Colocar una tasa anual
        await page.locator('#amortization_form_TASA').fill('5');

        // El tipo de interes debe ser Insoluto
        await expect(page.locator('text=INSOLUTO')).toBeVisible();

        // Cambiar el tipo de interes a Solo Interes
        await page.locator('#amortization_form').getByText('INSOLUTO').click();
        // Elegir Solo Interes
        await page.locator('text=SOLO INTERES').click();

        await expect(page.locator('#amortization_form_DIA_PAGO')).toHaveValue(`${formatDate(mesPrimerPago)}`);

        // Titulo Frecuencia y plazo de pago
        await expect(page.locator('h1').filter({hasText: 'FRECUENCIA Y PLAZO DE PAGO'})).toBeVisible();

        // La frecuencia por defecto debe ser mensual
        await expect(page.locator('text=MESES')).toBeVisible();

        // Colocar un plazo
        await page.locator('#amortization_form_PLAZO').fill('12');

        // Click al boton de calcular
        await page.getByRole('button', {name: 'Calcular'}).click();

        // Titulo de Amortizacion
        await expect(page.getByRole('heading', {name: 'Amortización', exact: true})).toBeVisible();

        // Boton Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con la tabla de amortizacion 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonImprimir).toBeVisible(),
            await botonImprimir.click()
        ]);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await newPage.close();

        // La tabla de amortizacion debe estar visible
        await expect(page.getByText('No. Cuota')).toBeVisible();
        await expect(page.getByText('Fecha')).toBeVisible();
        await expect(page.getByText('Abono Programado')).toBeVisible();
        await expect(page.getByText('Capital')).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Interés'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Seguro'}).last()).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Cargos'})).toBeVisible();
        await expect(page.getByText('Total')).toBeVisible();
        await expect(page.getByText('Balance')).toBeVisible();

        // Primera cuota
        await expect(page.getByRole('row', {name: `1 ${formatDate(mesPrimerPago)} 104.17 0.00 104.17 25,000.00`})).toBeVisible();

        // Resumen final
        await expect(page.getByRole('row', {name: 'RESUMEN: RD$ 25,000.00 RD$ 1,250.00 RD$ 0.00 RD$ 0.00 RD$ 1,250.00'})).toBeVisible();
    });

    test('Calcular la Tabla de Amortizacion de un Socio - Insoluto', async () => {
        // El tipo de interes debe estar en Solo Interes y cambiar el tipo a insoluto
        await page.locator('#amortization_form').getByText('SOLO INTERES').click();;
        // Elegir Insoluto
        await page.locator('text=INSOLUTO').click();

        await expect(page.locator('#amortization_form_DIA_PAGO')).toHaveValue(`${formatDate(mesPrimerPago)}`);

        // Click al boton de calcular
        await page.getByRole('button', {name: 'Calcular'}).click();

        // Titulo de Amortizacion
        await expect(page.getByRole('heading', {name: 'Amortización', exact: true})).toBeVisible();

        // Boton Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        // Esperar que se abra una nueva pestaña con la tabla de amortizacion 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonImprimir).toBeVisible(),
            await botonImprimir.click()
        ]);

        // Cerrar la pagina con la tabla de amortizacion para imprimir
        await newPage.close();

        // Primera cuota
        await expect(page.getByRole('row', {name: `1 ${formatDate(mesPrimerPago)} 2,036.02	104.17 0.00 2,140.19 22,963.98`})).toBeVisible();

        // Resumen final
        await expect(page.getByRole('row', {name: 'RESUMEN: RD$ 25,000.00 RD$ 682.24 RD$ 0.00 RD$ 0.00 RD$ 25,682.24'})).toBeVisible();
    });

    test('Agregar un Seguro a la tabla de amortizacion', async () => {
        // Titulo Seguros
        await expect(page.locator('h1').filter({hasText: 'SEGUROS'})).toBeVisible();

        // Seleccionar un seguro
        await page.locator('#amortization_form_SEGUROS').click();
        // Elegir Seguro de vida
        await page.locator('text=SEGURO DE VIDA').click();

        // Agregar el seguro
        await page.getByRole('button', {name: 'Agregar'}).click();

        // El seguro debe agregarse y se debe mostrar un tabla con el seguro
        await expect(page.getByRole('row', {name: 'Seguro Porcentaje Monto Acciones'})).toBeVisible();

        // Informacion del monto agregado
        await expect(page.getByRole('row', {name: 'SEGURO DE VIDA 0.045% 11.25 delete'})).toBeVisible();

        // Se le debe agregar el seguro a la tabla
        await expect(page.getByRole('row', {name: `1 ${formatDate(mesPrimerPago)} 2,036.02 104.17 11.25 0.05 2,151.48 22,963.98`})).toBeVisible();

        // Se le debe agregar el seguro al resumen final
        await expect(page.getByRole('row', {name: 'RESUMEN: RD$ 25,000.00 RD$ 682.24 RD$ 135.00 RD$ 0.54 RD$ 25,817.78'})).toBeVisible();
    });

    test('Eliminar el seguro de la Tabla de Amortizacion', async () => {
        // Boton eliminar
        const botonEliminar = page.locator('[data-icon="delete"]');
        await expect(botonEliminar).toBeVisible();
        await botonEliminar.click();

        // Debe salir un modal de confirmacion
        await expect(page.locator('text=¿Está seguro de eliminar este seguro?')).toBeVisible();

        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // En la tabla de los seguros no deben haber datos
        await expect(page.locator('text=No hay datos')).toBeVisible();

        // La Primera Cuota debe estar como estaba originalmente
        await expect(page.getByRole('row', {name: `1 ${formatDate(mesPrimerPago)} 2,036.02	104.17 0.00 2,140.19 22,963.98`})).toBeVisible();

        // El Resumen Final debe estar como estaba originalmente
        await expect(page.getByRole('row', {name: 'RESUMEN: RD$ 25,000.00 RD$ 682.24 RD$ 0.00 RD$ 0.00 RD$ 25,682.24'})).toBeVisible();
    })

    test('Agregar abonos programados a la tabla de amortizacion', async () => {
        // Abrir seccion de los pagos extraordinarios
        const pagosExtraordinarios = page.getByText('Pagos Extraordinarios');
        await expect(pagosExtraordinarios).toBeVisible();
        // Click
        await pagosExtraordinarios.click();

        // Tipo de abono
        await page.locator('text=Recurrente').click();

        // Frecuencia
        await page.locator('#form_NO_CUOTA').fill('2');

        // Monto de los abonos
        await page.locator('#form_MONTO_ABONOS').fill('200');

        // Agregar los pagos extraordinarios
        await page.getByRole('button', {name: 'Agregar'}).last().click();

        // Se debe mostrar una tabla con los abonos programados
        await expect(page.getByRole('row', {name: 'No. Cuota Fecha Monto Acciones'})).toBeVisible();
        
        // Se deben mostrar las cuotas
        await expect(page.getByRole('row', {name: `2 ${formatDate(mes2)} 200.00 edit delete`})).toBeVisible();
        await expect(page.getByRole('row', {name: `4 ${formatDate(mes4)} 200.00 edit delete`})).toBeVisible();
        await expect(page.getByRole('row', {name: `6 ${formatDate(mes6)} 200.00 edit delete`})).toBeVisible();
        await expect(page.getByRole('row', {name: `8 ${formatDate(mes8)} 200.00 edit delete`})).toBeVisible();
        await expect(page.getByRole('row', {name: `10 ${formatDate(mes10)} 200.00 edit delete`})).toBeVisible();
        await expect(page.getByRole('row', {name: `12 ${formatDate(mes12)} 200.00 edit delete`})).toBeVisible();

        // Los abonos programados deben estar en la tabla de amortizacion
        await expect(page.getByRole('row', {name: `2 ${formatDate(mes2)} 200.00 1,944.30 96.10 0.00 2,240.39 21,119.48`})).toBeVisible();

        // El resumen final debe cambiar con los abonos agregddos
        await expect(page.getByRole('row', {name: 'RESUMEN: RD$ 23,800.00 RD$ 684.74 RD$ 0.00 RD$ 0.00 RD$ 25,684.74'})).toBeVisible();
    });

    test('Editar un Abono Programado', async () => {
        // El primer abono programado debe estar visible
        await expect(page.getByRole('row', {name: `2 ${formatDate(mes2)} 200.00 edit delete`})).toBeVisible();

        // Boton Editar
        const botonEditar = page.locator('[data-icon="edit"]').first();
        await expect(botonEditar).toBeVisible();
        // Click al boton
        await botonEditar.click();

        // Cambiar el monto del abono
        const cambiarMonto = page.getByPlaceholder('TIPO DE NÚMERO');
        await cambiarMonto.click();
        // Borrar el monto anterior
        await cambiarMonto.clear();
        // Colocar un nuevo monto
        await cambiarMonto.fill('400');

        // Guardar el cambio
        await page.locator('[data-icon="save"]').click();

        // El monto general no debe cambiar
        await expect(page.locator('#amortization_form_MONTO')).toHaveValue('RD$ 25,000');

        // En la tabla de amortizacion el abono programado tuvo que cambiar
        await expect(page.getByRole('row', {name: `2 ${formatDate(mes2)} 400.00 1,927.25 96.17 0.00 2,423.42 21,153.51`})).toBeVisible();

        // El resumen final debe cambiar con el abono programado editado
        await expect(page.getByRole('row', {name: 'RESUMEN: RD$ 23,600.00 RD$ 680.98 RD$ 0.00 RD$ 0.00 RD$ 25,680.98'})).toBeVisible();
    });

    test('Eliminar un Abono Programado', async () => {
        // El primer abono programado debe estar visible
        await expect(page.getByRole('row', {name: `2 ${formatDate(mes2)} 400.00 edit delete`})).toBeVisible();

        // Boton Eliminar
        const botonEliminar = page.locator('[aria-label="delete"]').first();
        await expect(botonEliminar).toBeVisible();
        await botonEliminar.click();

        // El abono programado tuvo que eliminarse de la tabla de amortizacion
        await expect(page.getByRole('row', {name: `2 ${formatDate(mes2)} 1,961.35 96.03 0.00 2,057.37 21,085.45`})).toBeVisible();

        // El resumen final debe cambiar con el abono programado editado
        await expect(page.getByRole('row', {name: 'RESUMEN: RD$ 24,000.00 RD$ 688.50 RD$ 0.00 RD$ 0.00 RD$ 25,688.50'})).toBeVisible();
    });

    test('Eliminar todos los abonos programados', async () => {
        // Limpiar Tabla
        const limpiarTabla = page.locator('text=Limpiar tabla');
        await expect(limpiarTabla).toBeVisible();
        await limpiarTabla.click();

        // Los abonos se deben eliminar de la tabla de amortizacion
        await expect(page.getByRole('row', {name: 'RESUMEN: RD$ 25,000.00 RD$ 682.24 RD$ 0.00 RD$ 0.00 RD$ 25,682.24'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});