import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, formBuscar } from './utils/dataTests';

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
        await expect(page.locator('text=SOLICITADO')).toBeVisible();
    });

    test('Agregar un cargo a un Solicitud Desembolsada', async () => {
        // Debe regresar a la pagina de las solicitudes aprobadas
        const solicitudesAprobado = page.locator('text=APROBADO');
        await expect(solicitudesAprobado).toBeVisible();
    
        // Cambiar a las solicitudes desembolsadas
        await solicitudesAprobado.click();
        await page.locator('text=DESEMBOLSADO').click();
    
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=desembolsado`);
    
        // Buscar la solicitud del socio
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);
    
        // Elegir la solicitud del socio buscado
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();
    
        // La url debe de tener que la solicitud esta en desembolsado
        await expect(page).toHaveURL(/\/desembolsado/);
    
        // Debe estar en el titulo que la soliciud esta desembolsada
        await expect(page.locator('h1').filter({hasText: '(DESEMBOLSADO)'})).toBeVisible();
    
        // Ir a la opcion de los cargos
        const seccionCargos = page.getByRole('button', {name: '3 Cargos Del Préstamo'});
        await expect(seccionCargos).toBeVisible();
        await seccionCargos.click();
    
        // Titulo de la seccion
        await expect(page.locator('h1').filter({hasText: 'CARGOS'})).toBeVisible();
        
        // Boton de agregar cuotas 
        const agregarCuota = page.locator('[aria-label="plus"]');
        await expect(agregarCuota).toBeVisible();
        await agregarCuota.click();
    
        // Debe salir un modal
        await expect(page.locator('text=AGREGAR CARGO')).toBeVisible();
    
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
        await expect(page.getByText('COBRO EN DESEMBOLSO')).toBeVisible();
    
        // Guardar el cargo agregado
        await page.getByRole('button', {name: 'save Guardar'}).click();
    
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
    
        // Finalizar el proceso
        await page.getByRole('button', {name: 'Finalizar'}).click();
    });    
    
    test('Agregar un cargo a una Solicitud Desembolsada', async () => {
            // Debe regresar a la pagina de las solicitudes aprobadas
            const solicitudesAprobado = page.locator('text=APROBADO');
            await expect(solicitudesAprobado).toBeVisible();
    
            // Cambiar a las solicitudes desembolsadas
            await solicitudesAprobado.click();
            await page.locator('text=DESEMBOLSADO').click();
    
            // La URL debe cambiar
            await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=desembolsado`);
    
            // Buscar la solicitud del socio
            await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);
    
            // Elegir la solicitud del socio buscado
            await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();
    
            // La url debe de tener que la solicitud esta en desembolsado
            await expect(page).toHaveURL(/\/desembolsado/);
    
            // Debe estar en el titulo que la soliciud esta desembolsada
            await expect(page.locator('h1').filter({hasText: '(DESEMBOLSADO)'})).toBeVisible();
    
            // Ir a la opcion de los cargos
            const seccionCargos = page.getByRole('button', {name: '3 Cargos Del Préstamo'});
            await expect(seccionCargos).toBeVisible();
            await seccionCargos.click();
    
            // Titulo de la seccion
            await expect(page.locator('h1').filter({hasText: 'CARGOS'})).toBeVisible();
            
            // Boton de agregar cuotas 
            const agregarCuota = page.locator('[aria-label="plus"]');
            await expect(agregarCuota).toBeVisible();
            await agregarCuota.click();
    
            // Debe salir un modal
            await expect(page.locator('text=AGREGAR CARGO')).toBeVisible();
    
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
            await expect(page.getByText('COBRO EN DESEMBOLSO')).toBeVisible();
    
            // Guardar el cargo agregado
            await page.getByRole('button', {name: 'save Guardar'}).click();
    
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

        // Finalizar el proceso
        await page.getByRole('button', {name: 'Finalizar'}).click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});

