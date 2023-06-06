import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Nombre y apellido del firmante
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Pruebas

test.describe('Pruebas con la Solicitud de Cambio de Tasa de un Certificado', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Nombre y apellidos del firmante almacenada en el state
        nombreFirmante = await page.evaluate(() => window.localStorage.getItem(''));
        apellidoFirmante = await page.evaluate(() => window.localStorage.getItem(''));
    });

    test('Ir a la opcion de Solicitud cambio de tasa de certificado', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Solic. Cambio Tasa Cert.
        await page.getByRole('menuitem', {name: 'Solic. Cambio Tasa Cert.'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_cambio_tasa_cert/01-2-2-113/`);
    });

    test('Datos del Certificado elegido', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD CAMBIO DE TASA CERTIFICADO'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);
        // Elegir la cuenta de certificado financieros pagaderas
        await page.getByText('FINANCIEROS PAGADERAS').click();

        // Descripcion de cuenta, debe estar el tipo de cuenta elegido
        await expect(page.locator('#form_DESC_CUENTA')).toHaveValue('FINANCIEROS PAGADERAS');

        // Monto Apertura
        await expect(page.locator('#form_MONTO_APERTURA')).toHaveValue('');

        // Tasa de interes
        await expect(page.locator('#form_TASA')).toHaveValue('');

        // Plazo
        await expect(page.locator('#form_PLAZO')).toHaveValue('');

        // Boton Agregar Certificado
        const botonAgregar = page.getByRole('button', {name: 'Agregar Certificado'});
        await expect(botonAgregar).toBeVisible();

        // Click al boton de agregar certificado sin colocar una tasa
        await botonAgregar.click();

        // Debe salir un mensaje de error
        await expect(page.getByText('Nueva Tasa es requerido')).toBeVisible();

        // Agregar una Nueva Tasa
        await page.locator('#form_NUEVA_TASA').fill('');
    });

    test('Firmantes', async () => {
        // Titulo de la seccion
        await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();

        // Nombre del titular
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Debe mostarse el tipo de firmante
        await expect(page.getByRole('cell', {name: 'TITULAR'})).toBeVisible();

        // Nombre del copropietario
        await expect(page.getByRole('cell', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();

        // Debe mostarse el tipo de firmante
        await expect(page.getByRole('cell', {name: 'CO-PROPIETARIO'})).toBeVisible();
    });

    test('Certificados', async () => {
        // Titulo de la seccion
        await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
    }); 

    test.afterAll(async () => {
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
