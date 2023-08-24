import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, formBuscar, dataVer, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas Viendo Prestamo Cancelado', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenados en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    // Funcion con el boton de continuar, que se repite en cada seccion del registro
    const Siguiente = async () => {
        // continuar
        const botonSiguiente = page.locator('button:has-text("Siguiente")');
        // Esperar a que este visible
        await expect(botonSiguiente).toBeVisible();
        // presionar el boton
        await botonSiguiente.click();
    };

    test('Ir a la pagina de Solicitud de Credito', async () => {
        // NEGOCIOS
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // PROCESOS
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();

        // Solicitud de Credito
        await page.getByRole('menuitem', {name: 'Solicitud de Crédito'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);
    });

    test('Buscar la Solicitud de Credito de la persona en Estado Cancelado', async () => {
        // Click al selector de estado
        await page.locator('text=SOLICITADO').click();

        // Click a la opcion de Cancelado
        await page.locator('text=CANCELADO').click();

        // Buscar la solicitud de la persona
        await page.locator(`${formBuscar}`).fill(`${cedula}`);

        // Datos del prestamo
        await expect(page.getByRole('row', {name: `CRÉDITO HIPOTECARIO ${nombre} ${apellido} RD$ 50,000.00 48 RD$ 416.67`})).toBeVisible();
    });

    test('Ver la Solictud', async () => {
        // Click al boton de Ver Solicitud
        const botonVerSolicitud = page.locator(`${dataVer}`);
        await expect(botonVerSolicitud).toBeVisible();
        await botonVerSolicitud.click();

        // Debe dirigirse a la solicitud de credito
        await expect(page.getByRole('heading', {name: 'SOLICITUD DE CRÉDITO', exact: true})).toBeVisible();

        // La solicitud debe estar en estado Cancelado
        await expect(page.getByRole('heading', {name: '(CANCELADO)'})).toBeVisible();
    });

    test('Todos los inputs de la Solicitud deben estar Inhabilitados', async () => {
        // Paso 1
        await expect(page.getByRole('heading', {name: 'SOLICITANTE', exact: true})).toBeVisible();

        // El input para buscar socios debe estar inhabilitado
        await expect(page.locator(`${selectBuscar}`)).toBeDisabled();

        // Click al boton de Siguiente
        Siguiente();

        // Paso 2
        await expect(page.getByRole('heading', {name: 'GENERALES DEL CRÉDITO'})).toBeVisible();

        // El input de Oferta debe estar inhabilitado
        await expect(page.locator('#loan_form_ID_OFERTA')).toBeDisabled();

        // Click al boton de Siguiente
        Siguiente();

        // Paso 3
        await expect(page.getByRole('heading', {name: 'CARGOS'})).toBeVisible();

        // Click al boton de Siguiente
        Siguiente();

        // Paso 4
        await expect(page.getByRole('heading', {name: 'DEUDAS PENDIENTES'})).toBeVisible();

        // Click al boton de Siguiente
        Siguiente();

        // Paso 5
        await expect(page.locator('text=ESTADO DE SITUACION')).toBeVisible();
        await expect(page.locator('text=ESTADO DE RESULTADOS')).toBeVisible();
        await expect(page.locator('text=FLUJO DE EFECTIVO')).toBeVisible();

        // Click al boton de Siguiente
        Siguiente();

        // Paso 6
        await expect(page.getByRole('heading', {name: 'REPRESENTANTES LEGALES'})).toBeVisible();

        // Click al boton de Siguiente
        Siguiente();

        // Paso 7
        await expect(page.getByRole('heading', {name: 'GARANTÍAS', exact: true})).toBeVisible();

        // El boton de Agregar Garantia debe estar inhabilitado
        await expect(page.getByRole('button', {name: 'Agregar Garantía'})).toBeDisabled();

        // Click al boton de Siguiente
        Siguiente();

        // Paso 8
        await expect(page.getByRole('heading', {name: 'FAMILIARES MAS CERCANOS'})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'REFERENCIAS MORALES O PERSONALES'})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'REFERENCIAS COMERCIALES'})).toBeVisible();

        // El boton Agregar debe estar inhabilitado
        await expect(page.getByRole('button', {name: 'Agregar'})).toBeDisabled();

        // Click al boton de Siguiente
        Siguiente();

        // Paso 9
        await expect(page.getByRole('heading', {name: 'LISTA DE DOCUMENTOS'})).toBeVisible();

        // Click al boton de Finalizar
        const botonFinalizar = page.getByRole('button', {name: 'Finalizar'});
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();

        // Debe regresar a la pagina de Solicitud de Credito
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});