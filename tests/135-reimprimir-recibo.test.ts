import { Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { dataCerrar, selectBuscar, tipoTransaccion } from './utils/data/inputsButtons';
import { url_base, url_consulta_movimientos_cuentas, url_reimprimir_recibo } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula de la persona
let cedula: string | null;

// Pruebas
test.describe.serial('Pruebas con la Reimpresion de un Recibo', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula de la persona almacenados en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
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
        await page.locator('#rc_select_1').click();
        // Click a la opcion de cuenta de Aportaciones
        await page.getByRole('option', {name: 'AHORROS NORMALES', exact: true}).click();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir la Cuenta de Aportaciones del Socio
        await page.getByText('| AHORROS NORMALES |').click();

        // La URL no debe cambiar
        await expect(page).toHaveURL(`${url_consulta_movimientos_cuentas}`);

        // El tipo de captacion debe ser de Aportaciones
        await expect(page.getByPlaceholder('Tipo captación')).toHaveValue('AHORROS NORMALES');

        // Cambiar el tipo de documento
        await page.getByTitle('TODOS').click();
        // Elegir documento de deposito
        await page.getByRole('option', {name: 'DE', exact: true}).click();

        // El estado debe estar en Activa
        await expect(page.getByText('ACTIVA')).toBeVisible();

        // Click al boton de Buscar
        await page.getByRole('button', {name: 'Buscar'}).click();
        await page.waitForTimeout(1000);

        // Titulo movimiento de la cuenta debe estar visible
        await expect(page.locator('h1').filter({hasText: 'MOVIMIENTOS DE LA CUENTA'})).toBeVisible();

        // Copiar el codigo del documento
        await page.getByRole('cell').nth(0).click({clickCount: 2});
        await page.locator('body').press('Control+c');
    });

    test('Ir a la opcion de Reimprimir Recibo', async () => {
        // Click en Contraer todo
        await page.getByText('Contraer todo').click();

        // TESORERIA
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // CAJAS
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // REIMPRESIONES
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir en Libreta
        await page.getByRole('menuitem', {name: 'Reimprimir Recibo'}).click();

        // Aparece un modal de confirmacion al tratar de salir de la pagina
        await expect(page.locator('text=Si cambia de página es posible que pierda la información de la página actual.')).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_reimprimir_recibo}`);
    });

    test('Reimprimir un Recibo', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REIMPRESIÓN DE RECIBO'})).toBeVisible();

        // Colocar el Tipo de Transaccion
        await page.locator(`${tipoTransaccion}`).fill('DE');

        // Colocar el Numero del Documento
        await page.locator('#form_ID_DOCUMENTO').press('Control+v');
        
        // Click al boton de Cargar
        const botonCargar = page.getByRole('button', {name: 'Cargar'});
        await expect(botonCargar).toBeVisible();
        await botonCargar.click();

        // Debe abrirse un modal con el recibo buscado
        const modalRecibo = page.getByRole('heading', {name: 'Impresión de Recibo', exact: true});
        await expect(modalRecibo).toBeVisible();

        // Debe estar visible el boton de Imprimir
        await expect(page.getByRole('button', {name: 'Imprimir'})).toBeVisible();

        // Cerrar el modal del recibo
        await page.locator(`${dataCerrar}`).click();

        // Debe aparecer un modal de confirmacion
        await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();

        // Click al boton de Aceptar del modal de confirmacion
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // EL Modal debe desaparecer
        await expect(modalRecibo).not.toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});