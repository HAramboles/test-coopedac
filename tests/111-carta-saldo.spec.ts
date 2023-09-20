import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, formBuscar, browserConfig, dataVer, dataCerrar } from './utils/dataTests';
import { url_carta_saldo } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Carta de Saldo', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona alamacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    // Funcion con el boton de siguiente
    const Siguiente = async () => {
        // continuar
        const botonSiguiente = page.locator('button:has-text("Siguiente")');
        // presionar el boton
        await botonSiguiente.click();
    }; 

    test('Ir a la opcion de Carta de Saldo', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Carta de Saldo
        await page.getByRole('menuitem', {name: 'Carta de Saldo'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_carta_saldo}`);
    });

    test('Buscar prestamo de un socio', async () => {
        // Titull principal
        await expect(page.locator('h1').filter({hasText: 'CARTA DE SALDO'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Debe mostrarse el prestamo hipotecario del socio buscado
        
        // Financiamiento
        await expect(page.getByRole('cell', {name: 'CRÉDITO HIPOTECARIO'})).toBeVisible();

        // Cliente
        await expect(page.getByRole('row', {name: 'CRÉDITO HIPOTECARIO'}).getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Monto
        await expect(page.getByRole('cell', {name: 'RD$ 50,000.00'})).toBeVisible();

        // Plazo 
        await expect(page.getByRole('cell', {name: '48'})).toBeVisible();

        // Cuota
        await expect(page.getByRole('cell', {name: 'RD$ 416.67'})).toBeVisible();
    });

    test('No debe mostrarse las solicitudes de credito', async () => {
        // La solicitud de credito solo debe mostrarse cuando se le de click a ver solicitud
        await expect(page.getByText('SOLICITUD DE CRÉDITO - (UNDEFINED)')).not.toBeVisible();
    });

    test('Ver los datos del prestamo', async () => {
        // Ver el prestamo
        await page.getByRole('row', {name: 'CRÉDITO HIPOTECARIO'}).locator(`${dataVer}`).click();

        // Debe salir un modal con la solicitud
        const modal = page.locator('h1').filter({hasText: 'SOLICITUD DE CREDITO'}).first();
        await expect(modal).toBeVisible();

        // Debe mostrarse el nombre del socio como un titulo
        await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

        // El boton de finalizar no debe estar visible
        await expect(page.getByRole('button', {name: 'Finalizar'})).not.toBeVisible();

        // Paso 1 - Solicitante
        await expect(page.locator('h1').filter({hasText: 'SOLICITANTE'})).toBeVisible();

        // Click en Siguiente
        Siguiente();

        // Paso 2 - Datos Prestamos
        await expect(page.locator('h2').filter({hasText: 'GENERALES DEL CRÉDITO'})).toBeVisible();

        // Click en Siguiente
        Siguiente();

        // Paso 3 - Cargos
        await expect(page.locator('h1').filter({hasText: 'CARGOS'})).toBeVisible();

        // Los cargos deben mostarse
        await expect(page.getByText('CONTRATO')).toBeVisible();
        // Colocar aqui el cargo agregado por el test de cargos prestamos desembolsado

        // Click en Siguiente
        Siguiente();

        // Paso 4 - Deudas
        await expect(page.locator('h1').filter({hasText: 'DEUDAS PENDIENTES'})).toBeVisible();

        // Click en Siguiente
        Siguiente();

        // Paso 5 - Perfil Financiero
        await expect(page).toHaveURL(`${url_base}/carta_saldo/01-3-2-5?step=5`);

        // Click en Siguiente
        Siguiente();

        // Paso 6 - Representantes
        await expect(page.locator('h1').filter({hasText: 'REPRESENTANTES LEGALES'})).toBeVisible();

        // Click en Siguiente
        Siguiente();

        // Paso 7 - Codeudores
        await expect(page).toHaveURL(`${url_base}/carta_saldo/01-3-2-5?step=7`);

        // Click en Siguiente
        Siguiente();

        // Paso 8 - Referencias
        await expect(page.getByText('FAMILIARES MAS CERCANOS')).toBeVisible();
        await expect(page.getByText('REFERENCIAS MORALES O PERSONALES')).toBeVisible();        
        await expect(page.getByText('REFERENCIAS COMERCIALES')).toBeVisible(); 
        
        // Click en Siguiente
        Siguiente();
        
        // Paso 9 - Documentos
        await expect(page.locator('h1').filter({hasText: 'LISTA DE DOCUMENTOS'})).toBeVisible();

        // Los documentos deben mostrase
        await expect(page.locator('div').filter({hasText: 'CARTA DE TRABAJO'}).nth(4)).toBeVisible();
        await expect(page.locator('div').filter({hasText: 'INFORME BURO CREDITO (DATACREDITO)'}).nth(4)).toBeVisible();
        await expect(page.locator('div').filter({hasText: 'INFORME DEL SUBGERENTE DE NEGOCIOS'}).nth(4)).toBeVisible();
        await expect(page.locator('div').filter({hasText: 'TABLA AMORTIZACION'}).nth(4)).toBeVisible();
        await expect(page.locator('div').filter({hasText: 'CEDULA DEUDOR'}).nth(4)).toBeVisible();

        // Click en la X para cerrar el modal
        await page.locator(`${dataCerrar}`).click();

        // El modal debe desaparecer
        await expect(modal).not.toBeVisible();
    });

    test('Imprimir la Carta de Saldo', async () => {
        // Boton de generar carta
        const generarCarta = page.getByRole('row', {name: 'CRÉDITO HIPOTECARIO'}).locator('[data-icon="file-text"]');
        await expect(generarCarta).toBeVisible();
        await generarCarta.click();

        // Esperar que se abra otra ventana con la carta
        const page1 = await context.waitForEvent('page');

        // Esperar que el reporte este visible
        await page1.waitForTimeout(4000);

        // Cerrar la pagina con la carta
        await page1.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
