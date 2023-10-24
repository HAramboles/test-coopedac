import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, browserConfig, formBuscar, dataVer, selectBuscar, contextConfig } from './utils/dataTests';
import { url_solicitud_credito } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas Viendo Prestamo Cancelado', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenados en el state
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
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);
    });

    test('Buscar la Solicitud de Credito de la persona en Estado Cancelado', async () => {
        // Click al selector de estado
        await page.locator('text=SOLICITADO').click();

        // Click a la opcion de Cancelado
        await page.locator('text=CANCELADO').click();

        // Buscar la solicitud de la persona
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Datos del prestamo
        await expect(page.getByRole('row', {name: `CRÉDITO HIPOTECARIO ${nombre} ${apellido} RD$ 50,000.00 48 RD$ 416.67`})).toBeVisible();
    });

    test('Ver la Solictud', async () => {
        // Click al boton de Ver Solicitud
        const botonVerSolicitud = page.locator(`${dataVer}`);
        await expect(botonVerSolicitud).toBeVisible();
        await botonVerSolicitud.click();

        // Debe dirigirse a la solicitud de credito
        await expect(page.getByRole('heading', {name: 'SOLICITUD DE CRÉDITO'})).toBeVisible();

        // La solicitud debe estar en estado Cancelado
        await expect(page.getByRole('heading', {name: '(CANCELADO)'})).toBeVisible();
    });

    test('Todos los inputs de la Solicitud deben estar Inhabilitados', async () => {
        // Paso 1
        await expect(page.getByRole('heading', {name: 'SOLICITANTE:'})).toBeVisible();

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
        await expect(page.getByRole('heading', {name: 'GARANTÍAS'})).toBeVisible();

        // El boton de Agregar Garantia debe estar inhabilitado
        await expect(page.getByRole('button', {name: 'Agregar Garantía'})).toBeDisabled();

        // Click al boton de Siguiente
        Siguiente();

        // Paso 8
        await expect(page.getByText('FAMILIARES MAS CERCANOS')).toBeVisible();
        await expect(page.getByText('REFERENCIAS MORALES O PERSONALES')).toBeVisible();
        await expect(page.getByText('REFERENCIAS COMERCIALES')).toBeVisible();

        // El boton Agregar debe estar inhabilitado
        // await expect(page.getByRole('button', {name: 'Agregar'})).toBeDisabled();

        // Click al boton de Siguiente
        Siguiente();

        // Paso 9
        
        // Los documentos deben estar visibles
        await expect(page.getByRole('link', {name: 'CARTA DE TRABAJO'}).first()).toBeVisible();
        await expect(page.getByRole('link', {name: 'INFORME BURO CREDITO (DATACREDITO)'}).first()).toBeVisible();
        await expect(page.getByRole('link', {name: 'INFORME DEL SUBGERENTE DE NEGOCIOS'}).first()).toBeVisible();
        await expect(page.getByRole('link', {name: 'INSTANCIA DE CREDITO LLENA Y FIRMADA'}).first()).toBeVisible();
        await expect(page.getByRole('link', {name: 'TABLA AMORTIZACION'}).first()).toBeVisible();
        await expect(page.getByRole('link', {name: 'CEDULA DEUDOR'}).first()).toBeVisible();;

        // Click al boton de Finalizar
        const botonFinalizar = page.getByRole('button', {name: 'Finalizar'});
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();

        // Debe regresar a la pagina de Solicitud de Credito
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();
    });

    test('El prestamo debe seguir en estado Cancelado', async () => {
        // El estado de las solicitudes debe estar en Cancelado
        await expect(page.getByText('CANCELADO')).toBeVisible();

        // Buscar la solicitud de la persona
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Datos del prestamo
        await expect(page.getByRole('row', {name: `CRÉDITO HIPOTECARIO ${nombre} ${apellido} RD$ 50,000.00 48 RD$ 416.67`})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});