import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { dataCerrar, dataPrinter, dataVer, selectBuscar } from './utils/data/inputsButtons';
import { diaActualFormato } from './utils/functions/fechas';
import { url_base, url_consulta_movimientos_prestamos } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Consulta de los Movimientos de un Prestamo', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Consulta Movimientos Prestamos', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Consultas
        await page.getByRole('menuitem', {name: 'CONSULTAS'}).click();

        // Consulta Movimientos Prestamos
        await page.getByRole('menuitem', {name: 'Consulta Movimientos Préstamos'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_prestamos}`);
    });

    test('Buscar el Prestamo de un Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS PRÉSTAMOS'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir al socio
        await page.getByText(`${nombre} ${apellido}`).click();

        // Prestamo
        await expect(page.locator('#form_PRESTAMOS')).toHaveValue('PRESTAMOS');

        // Cuota
        await expect(page.locator('#form_CUOTA')).toHaveValue('RD$ 3,885');

        // Balance
        await expect(page.locator('#form_DEUDA_CAPTITAL')).toHaveValue('RD$ 0');

        // Moneda
        await expect(page.getByText('PESO (RD)')).toBeVisible();

        // Tasa de Moneda
        await expect(page.locator('#form_TASA_MONEDA')).toHaveValue('RD$ 1');

        // Fecha corte
        await expect(page.locator('#form_FECHA_CORTE')).toHaveValue(`${diaActualFormato}`);

        // Estado prestamo
        await expect(page.locator('#form_ESTADO_CUENTA')).toHaveValue('CANCELADO');
    });

    test('Imprimir los Movimientos del Prestamo', async () => {
        // Boton Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        await expect(botonImprimir).toBeVisible();
        await botonImprimir.click();

        // Esperar que se abra una nueva ventana con el reporte
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await page1.close();
    });

    test('Movimientos del Prestamo', async () => {
        // Imprimir el primer movimiento
        const imprimirMovimiento1 = page.locator(`${dataPrinter}`).first();
        await expect(imprimirMovimiento1).toBeVisible();
        await imprimirMovimiento1.click();

        // Esperar que se abra una nueva ventana con el reporte
        const pageMovimiento1 = await context.waitForEvent('page');

        // Cerrar la pagina
        await pageMovimiento1.close();

        // Debe regresar a la pagina de las consultas
        await expect(page).toHaveURL(`${url_consulta_movimientos_prestamos}`);
        
        // Imprimir el segundo movimiento
        const imprimirMovimiento2 = page.locator(`${dataPrinter}`).last();
        await expect(imprimirMovimiento2).toBeVisible();
        await imprimirMovimiento2.click();

        // Esperar que se abra una nueva ventana con el reporte
        const pageMovimiento2 = await context.waitForEvent('page');

        // Cerrar la pagina
        await pageMovimiento2.close();
        
        // Debe regresar a la pagina de las consultas
        await expect(page).toHaveURL(`${url_consulta_movimientos_prestamos}`);

        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS PRÉSTAMOS'})).toBeVisible();
    });

    test('Ver las actividades de uno de los movimientos del prestamo', async () => {
        // Click al boton de ver actividades del primer movimiento
        const botonVerActividades = page.locator(`${dataVer}`).first();
        await expect(botonVerActividades).toBeVisible();
        await botonVerActividades.click();

        // Se abre un modal con las actividades del movimiento
        const modalActividades = await page.getByText('ACTIVIDADES DEL PRÉSTAMO');
        await expect(modalActividades).toBeVisible();

        // Secciones del modal
        await expect(page.getByText('Información de la Actividad')).toBeVisible();
        await expect(page.getByText('Información del usuario')).toBeVisible();
        await expect(page.getByText('Origen del cobro')).toBeVisible();
        await expect(page.getByText('Valores de la actividad')).toBeVisible();
        await expect(page.getByText('Detalle contable')).toBeVisible();
        await expect(page.getByText('Cuotas afectadas')).toBeVisible();

        // En el comentario debe estar el colocado en la prueba de nota de credito
        await expect(page.getByText('PAGO POR INTERNET BANKING DE 150,000 PARA EL PRESTAMO')).toBeVisible();

        // Cerrar el modal
        await page.locator(`${dataCerrar}`).click();

        // El modal no debe estar visible
        await expect(modalActividades).not.toBeVisible();

        // Debe estar en la pagina de Consulta Movimientos Prestamos
        await expect(page.locator('h1').filter({hasText: 'CONSULTA MOVIMIENTOS PRÉSTAMOS'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
