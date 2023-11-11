import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate } from './utils/functions/fechas';
import { selectBuscar } from './utils/data/inputsButtons';
import { url_base, url_reimprimir_libreta } from './utils/dataPages/urls';
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
test.describe.serial('Pruebas con la Reimpresion en Libreta', () => {
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

    test('Ir a la opcion de Reimprimir en Libreta', async () => {
        // TESORERIA
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // CAJAS
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // REIMPRESIONES
        await page.getByRole('menuitem', {name: 'REIMPRESIONES'}).click();

        // Reimprimir en Libreta
        await page.getByRole('menuitem', {name: 'Reimprimir en Libreta'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_reimprimir_libreta}`);
    });

    test('Cuenta de Aportaciones - Datos del Socio', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'ACTUALIZAR LIBRETA'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir la cuenta de aportaciones del socio
        await page.locator('text=APORTACIONES').click();

        // Nombre del socio
        await expect(page.locator('#form_NOMBRE_SOCIO')).toHaveValue(`${nombre} ${apellido}`);

        // Tipo de cuenta
        await expect(page.locator('#form_DESC_TIPO_CAPTACION')).toHaveValue('APORTACIONES');

        // Restarle 7 dias a la fecha actual
        const dia = new Date();
        const semana = formatDate(new Date(dia.setDate(dia.getDate() - 7)));

        // Colocar en la fecha inicial una semana despues desde el dia actual
        const fechaInicial = page.locator('#form_FECHA_CORTE');
        await fechaInicial.clear();
        await fechaInicial.fill(`${semana}`);

        // Click en buscar
        await page.getByRole('button', {name: 'Buscar'}).click();

        // Boton de Imprimir debe estar visible
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        await expect(botonImprimir).toBeVisible();
    });

    test('Cuenta de Aportaciones - Transacciones', async () => {
        // Titulo vista previa debe estar visible
        await expect(page.locator('h4').filter({hasText: 'VISTA PREVIA'})).toBeVisible();

        // Debe estar la transaccion de 2000 pesos en la libreta de la Cuenta de Aportaciones del Socio
        await expect(page.getByText('2,000.00').first()).toBeVisible();
    });

    test('Cuenta de Ahorros - Datos del Socio', async () => {
        // Click en el buscador para elegir otra cuenta del mismo socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir la cuenta de Ahorros del socio
        await page.locator('text=AHORROS NORMALES').click();

        // Tipo de cuenta
        await expect(page.locator('#form_DESC_TIPO_CAPTACION')).toHaveValue('AHORROS NORMALES');
    });

    test('Cuenta de Ahorros - Transacciones', async () => {
        // Titulo vista previa debe estar visible
        await expect(page.locator('h4').filter({hasText: 'VISTA PREVIA'})).toBeVisible(); 

        // Deben estar las transacciones en la libreta de la Cuenta de Ahorros
        await expect(page.getByRole('cell', {name: '100.00', exact: true})).toBeVisible();
        await expect(page.getByRole('cell', {name: '1,500.00'}).first()).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
