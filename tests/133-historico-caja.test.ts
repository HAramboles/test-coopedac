import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { selectBuscar, fechaInicial, fechaFinal, dataPrinter } from './utils/data/inputsButtons';
import { url_base, url_historico_caja } from './utils/dataPages/urls';
import { diaActualFormato } from './utils/functions/fechas';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { userCorrecto } from './utils/data/usuarios';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Nombre de la empresa
let nomrbeEmpresa: string | null;

// Pruebas
test.describe.serial('Pruebas con el Historico de Caja', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Nombre de la empresa almacenada en el state
        nomrbeEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));
    });

    // Funcion para cerrar las paginas que se abren con los diferentes reportes
    const CerrarPaginasReportes = async () => {
        context.on('page', async (page) => {
            await page.waitForTimeout(1000);
            await page.close();
        });
    };

    test('Ir a la pagina de Historico de Caja', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Historico de Caja
        await page.getByRole('menuitem', {name: 'Histórico de caja', exact: true}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_historico_caja}`);
    });

    test('Datos de la Seccion Criterio de Busqueda', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'HISTÓRICO DE CAJA'})).toBeVisible();

        // Seccion criterio de busqueda
        await expect(page.getByText('Criterio de búsqueda')).toBeVisible();

        // El input del socio debe estar vacio
        await expect(page.locator(`${selectBuscar}`)).toHaveValue('');

        // Las fechas de incio y fin deben ser el dia actual
        await expect(page.locator(`${fechaInicial}`)).toHaveValue(`${diaActualFormato}`);
        await expect(page.locator(`${fechaFinal}`)).toHaveValue(`${diaActualFormato}`);

        // Los inputs de fechas deben estar deshabilitados
        await expect(page.locator(`${fechaInicial}`)).toBeDisabled();
        await expect(page.locator(`${fechaFinal}`)).toBeDisabled();

        // Se debe mostrar la caja en uso y el input debe estar deshabilitado
        await expect(page.getByTitle(`${userCorrecto}`)).toBeVisible();
        await expect(page.locator('#form_ID_CAJA')).toBeDisabled();

        // El input de Balance Cuenta Contable debe estar vacio
        await expect(page.locator('#form_BALANCE_CUENTA')).toHaveValue('');
    });

    test('Imprimir el Reporte con todos los Movimientos de la Caja realizados', async () => {
        // Boton de Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        await expect(botonImprimir).toBeVisible();

        // Click al boton de Imprimir
        await botonImprimir.click();

        // Esperar a que se abra una nueva pestaña con el reporte
        CerrarPaginasReportes();

        // Debe regresar a la pagina de Historico de Caja
        await expect(page).toHaveURL(`${url_historico_caja}`);
    });

    test('Deben mostrarse todas las Transacciones realizadas por la Caja', async () => {
        // Estructura de la tabla de las transacciones
        await expect(page.getByRole('columnheader', {name: 'Caja'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Fecha'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'No. Documento'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Tipo Transacción'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'No. transaccion Contable'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Cuenta'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Cliente'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Cajero'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Estado'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Monto Ingreso'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Monto Egreso'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Hora'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Acciones'})).toBeVisible();

        // Todas las transacciones realizadas
        const fechaTransacciones = page.getByRole('cell', {name: `${diaActualFormato}`});
        await expect(fechaTransacciones.nth(0)).toBeVisible();
        await expect(fechaTransacciones.nth(1)).toBeVisible();
        await expect(fechaTransacciones.nth(2)).toBeVisible();
        await expect(fechaTransacciones.nth(3)).toBeVisible();
        await expect(fechaTransacciones.nth(4)).toBeVisible();
        await expect(fechaTransacciones.nth(5)).toBeVisible();
        await expect(fechaTransacciones.nth(6)).toBeVisible();
        // await expect(fechaTransacciones.nth(7)).toBeVisible();

        // Clientes de las transacciones
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`}).first()).toBeVisible();

        // Total de operaciones
        await expect(page.getByRole('heading', {name: 'Total de Operaciones'})).toBeVisible();
    });

    test('Resumen y Detalle de la Caja', async () => {
        // Tabla del resumen
        await expect(page.getByText('Resumen de Ingresos y Egresos de Caja')).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Cant.'})).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Descripción	'}).first()).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Ingresos'}).first()).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Egresos'}).first()).toBeVisible();

        // Tabla de los detalles
        await expect(page.getByText('Detalles de caja')).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Descripción'}).nth(1)).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Ingresos'}).nth(1)).toBeVisible();
        await expect(page.getByRole('columnheader', {name: 'Egresos'}).nth(1)).toBeVisible();
    });

    test('Imprimir el Recibo de una Transaccion', async () => {
        // Boton de Imprimir de la primera transaccion que aparece en la tabla
        const imprimirTransaccion = page.locator(`${dataPrinter}`).nth(1);
        await expect(imprimirTransaccion).toBeVisible();

        // Click al boton de Imprimir la transaccion
        await imprimirTransaccion.click();

        // Esperar a que se abra una nueva pestaña con el recibo
        CerrarPaginasReportes();

        // Debe regresar a la pagina de Historico de Caja
        await expect(page).toHaveURL(`${url_historico_caja}`);
    });

    test('Filtrar las transacciones solo por los Retiros', async () => {
        // Click al selector Tipo Transaccion
        await page.getByTitle('TODOS').click();
        // Aparecen todos los tipos de transacciones disponibles, entre las cuales estan los depositos, pagos a prestamos y retiros
        await expect(page.getByRole('option', {name: 'DE - DEPOSITOS'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'RP - PAGOS A PRESTAMOS'})).toBeVisible();

        // Click a la opcion de retiro
        await page.getByRole('option', {name: 'RE - RETIROS'}).click();

        // Boton de Buscar
        const botonBuscar = page.getByRole('button', {name: 'Buscar'});
        await expect(botonBuscar).toBeVisible();
        await botonBuscar.click();

        // Deben mostrarse solo los retiros realizados 
        await expect(page.getByRole('cell', {name: 'DEPOSITO'})).not.toBeVisible();
        await expect(page.getByRole('cell', {name: 'ORDENES'})).not.toBeVisible();
        await expect(page.getByRole('cell', {name: 'RECIBO DE PRESTAMOS'})).not.toBeVisible();
        await expect(page.getByRole('cell', {name: 'RECIBO OTROS SERVICIOS'})).not.toBeVisible();
    });

    test('Buscar las transacciones de la persona', async () => {
        // Recargar la pagina
        await page.reload();

        // Buscar una persona
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Click a la opcion con la persona buscada
        await page.getByRole('option', {name: `${nombre} ${apellido}`}).click(); 

        // Deben mostrarse solo las transacciones de la persona buscada
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`}).first()).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nomrbeEmpresa}`}).first()).not.toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });  
});
