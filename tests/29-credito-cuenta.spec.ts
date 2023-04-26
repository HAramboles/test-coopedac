import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate } from './utils/utils';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Documento Adjunto
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Pruebas

test.describe('Pruebas con el Credito a la Cuenta de Certificado - Financieros Pagaderas', () => {
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
    });

    test('Ir a la opcion de Credito a Cuenta', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Credito a Cuenta
        await page.getByRole('menuitem', {name: 'Crédito a Cuenta'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/notas_cuentas/01-2-2-3/`);
    });

    test('Ingresar un Socio', async () => {
        // Cedula, nombre y apellido de la persona
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'CRÉDITO A CUENTA'})).toBeVisible();

        // Buscar un socio
        await page.locator('#select-search').fill(`${cedula}`);
        // Selccionar una cuenta del socio
        await page.locator('text=FINANCIEROS PAGADERAS').click();

        // El nombre del socio debe estar visible
        await expect(page.locator('#form_NOMBRES')).toHaveValue(`${nombre} ${apellido}`);

        // Tipo de captacion
        await expect(page.locator('#form_DESC_TIPO_CTA')).toHaveValue('FINANCIEROS PAGADERAS');

        // Sucursal
        await expect(page.locator('#form_sucursal')).toHaveValue('OFICINA PRINCIPAL');

        // Balance
        await expect(page.locator('#form_BALANCE')).toHaveValue(' 50.00');

        // Pignorado
        await expect(page.locator('#form_BALANCE_PIGNORADO')).toHaveValue(' 0.00');

        // Transito
        await expect(page.locator('#form_MONTO_TRANSITO')).toHaveValue(' 0.00');

        // Disponible
        await expect(page.locator('#form_BALANCE_DISPONIBLE')).toHaveValue(' 50.00');
    });

    test('Hacer el movimiento', async () => {
        // Tipo movimiento
        await expect(page.getByText('NOTA CREDITO')).toBeVisible();

        // Monto
        await page.locator('#form_MONTO').fill('2050');

        // Concepto
        await page.locator('#form_ID_TIPO_CONCEPTO').click();
        // Seleccionar Aplicacion de deposito
        await page.locator('text=APLICACION DE DEPOSITO').click();

        // Fecha documento
        await expect(page.locator('#form_FECHA_DOCUMENTO')).toHaveValue(`${formatDate(new Date())}`);

        // Comentario
        await page.locator('#form_COMENTARIO').fill('Ingreso de 2050 pesos a la cuenta de Certificado');
    });

    test('Realizar el Credito a la Cuenta', async () => {
        // Boton Guadar
        const botonGuadar = page.getByRole('button', {name: 'Guardar'});
        // Esperar que se abra una nueva pestaña con el reporte del credito 
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonGuadar).toBeVisible(),
            await botonGuadar.click()
        ]);

        // Cerrar la pagina con el reporte
        await newPage.close();

        // Se deben mostrar dos mensajes de confirmacion
        await expect(page.locator('text=Captacion Movimiento almacenada exitosamente.')).toBeVisible();

        // Cerrar los mensajes
        await page.locator('[aria-label="close"]').first().click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
