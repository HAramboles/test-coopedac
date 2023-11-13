import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { diaActualFormato } from './utils/functions/fechas';
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
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
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

    test('Cuenta de Ahorros Normales - Datos del Socio', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'ACTUALIZAR LIBRETA'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir la cuenta de aportaciones del socio
        await page.locator('text=AHORROS NORMALES').click();

        // Nombre del socio
        await expect(page.locator('#form_NOMBRE_SOCIO')).toHaveValue(`${nombre} ${apellido}`);

        // Tipo de cuenta
        await expect(page.locator('#form_DESC_TIPO_CAPTACION')).toHaveValue('AHORROS NORMALES');

        // La fecha por defecto debe ser la fecha actual
        const fechaInicial = page.locator('#form_FECHA_CORTE');
        await expect(fechaInicial).toHaveValue(`${diaActualFormato}`);

        // Click en buscar
        await page.getByRole('button', {name: 'Buscar'}).click();

        // Boton de Imprimir debe estar visible
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        await expect(botonImprimir).toBeVisible();
    });

    test('Cuenta de Ahorros - Transacciones', async () => {
        // Titulo vista previa debe estar visible
        await expect(page.locator('h4').filter({hasText: 'VISTA PREVIA'})).toBeVisible(); 

        // Deben estar las tres transacciones realizadas a la cuenta de Ahorros Normales
        await expect(page.getByRole('cell', {name: '5,000.00'})).toBeVisible();
        await expect(page.getByRole('cell', {name: '3,500.00'})).toBeVisible();
        await expect(page.getByRole('cell', {name: '150,000.00'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
