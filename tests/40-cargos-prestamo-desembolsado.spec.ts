import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, formBuscar, ariaCerrar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe('Pruebas Agregando Cargos a una Prestamo Desembolsado', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false,
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json',
        });

        // Crear una nueva page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellidos de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Solicitud de Credito', async () => {
        test.slow();

        // Negocios
        await page.locator('text=NEGOCIOS').click();

        // Procesos
        await page.locator('text=PROCESOS').click();
        
        // Solicitud de Credito
        await page.locator('text=Solicitud de Crédito').click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);
    });

    test('Cambiar el estado de las solicitudes a Desembolsado', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();

        // El listado de las solicitudes debe ser solicitado
        const estadoSolicitado = page.locator('text=SOLICITADO');
        await expect(estadoSolicitado).toBeVisible();

        // Cambiar el estado a desembolsado
        await estadoSolicitado.click();
        await page.locator('text=DESEMBOLSADO').click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=desembolsado`);
    });

    test('Buscar el Prestamo de un Socio', async () => {
        test.slow();

        // Buscar un socio
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Click al boton de ver solicitud
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();

        // Debe dirigirse al prestamo
        await expect(page).toHaveURL(/\/desembolsado/);

        // Debe estar en el titulo que la soliciud esta desembolsada
        await expect(page.locator('h1').filter({hasText: '(DESEMBOLSADO)'})).toBeVisible();

        // Debe mostrarse el nombre de la persona
        await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();
    });

    test('Agregar un cargo a un Solicitud Desembolsada', async () => {
        test.slow();

        // Ir a la opcion de los cargos
        const seccionCargos = page.getByRole('button', {name: '3 Cargos Del Préstamo'});
        await expect(seccionCargos).toBeVisible();
        await seccionCargos.click();
    
        // Titulo de la seccion
        await expect(page.locator('h1').filter({hasText: 'CARGOS'})).toBeVisible();
        
        // Boton de agregar cargos 
        const agregarCuota = page.locator('[aria-label="plus"]');
        await expect(agregarCuota).toBeVisible();
        await agregarCuota.click();
    
        // Debe salir un modal
        const modal = page.locator('text=AGREGAR CARGO');
        await expect(modal).toBeVisible();
    
        // Buscar un seguro
        await page.locator('#form_DESC_CARGO').fill('SEGURO DE');
        // Elegir el seguro de vida
        await page.locator('text=SEGURO DE VIDA').click();
    
        // Debe de colocarse automaticamente que es un seguro
        await expect(page.locator('(//INPUT[@type="radio"])[1]')).toBeChecked();
    
        // Elegir una aseguradora
        await page.locator('#form_ID_ASEGURADORA').fill('SEGUROS');
        // Elegir seguros mapfre
        await page.locator('text=SEGUROS MAPFRE').click();
    
        // Colocar un valor
        const campoValor = page.locator('#form_VALOR');
        await campoValor.clear();
        await campoValor.fill('50');
    
        // La via de cobro por defecto debe ser cobro en desembolso
        await expect(page.getByText('FIJO EN CUOTAS')).toBeVisible();
    
        // Guardar el cargo agregado
        await page.getByRole('button', {name: 'save Guardar'}).click();

        // El modal se debe cerrar
        await expect(modal).not.toBeVisible();

        // Se debe mostrar un mensaje de que la operacion fue exitosa
        await expect(page.locator('text=Cargos del préstamo guardados exitosamente.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator(`${ariaCerrar}`).click();
    
        // Click en Siguiente
        await page.getByRole('button', {name: 'Siguiente'}).click();
    
        // Debe mostrarse el titulo de la siguiente seccion
        await expect(page.locator('h1').filter({hasText: 'DEUDAS PENDIENTES'})).toBeVisible();
    });
    
    test('Ir a la opcion de Desembolso para terminar el proceso', async () => {
        // Opcion de desembolso
        const seccionDesembolso = page.getByRole('button', {name: '10 Desembolso'});
        await expect(seccionDesembolso).toBeVisible();
        await seccionDesembolso.click();

        // La URL debe cambiar
        await expect(page).toHaveURL(/\/?step=10/);

        // Titulo de la seccion
        await expect(page.locator('h1').filter({hasText: 'DESEMBOLSO DE PRÉSTAMO'})).toBeVisible();
    
        // Finalizar el proceso
        const botonFinalizar = page.getByRole('button', {name: 'Finalizar'});
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
