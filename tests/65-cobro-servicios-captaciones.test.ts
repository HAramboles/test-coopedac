import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar, formBuscar } from './utils/dataTests';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe.serial('Pruebas con el Cobro de Servicios - Captaciones', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false,
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la opcion de Cobro de Servicios de Captaciones', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Cobro de Servicios
        await page.getByRole('menuitem', {name: 'Cobro de Servicios'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/cobros_multiples_servicios/01-2-2-107/`);
    });

    test('Buscar a una persona', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'COBRO DE SERVICIOS'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir al socio buscado
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Debe mostrarse el nombre y apellido del socio
        await expect(page.getByTitle(`${nombre} ${apellido}`)).toBeVisible();
    });

    test('Cobrar un Servicio a un Socio', async () => {
        // Click al selector de referencia
        await page.locator('#form_DOC_REF_NAME').click();

        // Elegir otros ingresos
        await page.locator('text=OTROS INGRESOS').click();

        // Digitar un monto
        await page.locator('#form_MONTO').fill('500');

        // Click al selector de cajero
        // const selectorCajero = page.locator('#form_ID_PERSONAL_ASIGNADO');
        const selectorCajero = page.getByText('TODOS', {exact: true});
        await selectorCajero.click();

        // Seleccionar la primera opcion con el nombre del cajero
        await selectorCajero.nth(0).click();

        // Digitar un comentario
        await page.locator('#form_NOTAS').fill('Cobro de Servicios de Otros Ingresos');

        // Boton de Guardar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();

        // Click al boton de Guardar
        await botonGuardar.click();

        // Debe mostrarse una alerta de confirmacion
        await expect(page.locator('text=Sesiones Movimientos almacenada exitosamente.')).toBeVisible();
    });

    test('Ir a la opcion de Sesiones en Transito para Cobrar el Servicio', async () => {
        // Tesoreria
        await page.getByRole('menuitem', {name: 'TESORERIA'}).click();

        // Cajas
        await page.getByRole('menuitem', {name: 'CAJAS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Sesiones en Transito
        await page.getByRole('menuitem', {name: 'Sesiones en Tránsito', exact: true}).click();

        // Debe salir un modal de confirmacion
        await expect(page.locator('text=Si cambia de página es posible que pierda la información de la página actual.')).toBeVisible();

        // Click al boton de Aceptar del modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/sesiones_transito/01-4-1-2-1/`);
    });

    test('Buscar la Sesion abierta con el Cobro de Servicio', async () => {
        // El titulo de la pagina debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SESIONES EN TRÁNSITO'})).toBeVisible();

        // Click al boton de Actualizar
        const botonActualizar = page.getByRole('button', {name: 'Actualizar'});
        await expect(botonActualizar).toBeVisible();
        await botonActualizar.click();

        // Buscar al socio
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Debe aparecer el concepto
        await expect(page.getByRole('cell', {name: 'COBRO DE SERVICIOS DE OTROS INGRESOS'})).toBeVisible();

        // Boton de Seleccinar
        const botonSeleccionar = page.getByRole('button', {name: 'Seleccionar'});
        await expect(botonSeleccionar).toBeVisible();
        // Click al boton de Seleccionar
        await botonSeleccionar.click();
    });

    test('Aplicar el Cobro del Servicio al Socio', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/cobro_servicios/01-4-1-2-7`);

        // El titulo de la pagina debe estar visible
        await expect(page.locator('h1').filter({hasText: 'COBRO DE SERVICIOS'})).toBeVisible();

        // Debe aparecer el nombre del socio
        await expect(page.getByTitle(`${nombre} ${apellido}`)).toBeVisible();

        // Debe mostrarse el monto colocado
        await expect(page.locator('#form_MONTO')).toHaveValue('RD$ 500');

        // Titulo de la tabla Recibido
        await expect(page.locator('text=RECIBIDO')).toBeVisible();
        
        // Colocar una moneda de 500
        const cant500 = page.locator('[id="2"]');
        await cant500.click();
        await cant500.fill('1');

        // Iconos check verdes
        const iconoVerde1 = page.getByRole('img', {name: 'check-circle'}).first();
        const iconoVerde2 = page.getByRole('img', {name: 'check-circle'}).last();

        // Los dos checks verdes deben salir al hacer bien la distribucion
        await expect(iconoVerde1).toBeVisible();
        await expect(iconoVerde2).toBeVisible();

        // Hacer click al boton de Aceptar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();
        
        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
