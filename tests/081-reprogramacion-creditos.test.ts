import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, formBuscar, browserConfig } from './utils/dataTests';
import { dosMesDespues } from './utils/fechas';
import { url_reprogramacion_creditos } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Confirmacion de la Reprogramacion de Creditos', () => {
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

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem("apellidoPersona"));
    });

    test('Ir a la opcion de Reprogramacion de Creditos', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Reprogramacion Creditos
        await page.getByRole('menuitem', {name: 'Reprogramación Créditos'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_reprogramacion_creditos}?filter=pendientes`);
    });

    test('Confirmar la Solicitud de Reprogramacion del Socio', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REPROGRAMACIÓN CRÉDITOS'})).toBeVisible();

        // El estado de las solicitudes deb estar por defecto en Pendientes
        await expect(page.getByText('PENDIENTES', {exact: true})).toBeVisible();

        // Buscar al socio
        await page.locator(`${formBuscar}`).fill(`${cedula}`);

        // Boton confirmar
        const botonConfirmar = page.getByRole('row', {name: `${nombre} ${apellido} CRÉDITO HIPOTECARIO`}).getByRole('button', {name: 'check-circle'});
        await botonConfirmar.click();
    });

    test('Datos del Credito', async () => {
        // Debe mostrarse la solicitud con los datos
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOCIO'})).toBeVisible();

        // El nombre de la persona, dueña del credito, debe mostrarse
        await expect(page.locator('#form_NOMBRE')).toHaveValue(`${nombre} ${apellido}`);

        // Datos del Credito
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOCIO'})).toBeVisible();

        // Tipo Credito
        await expect(page.locator('#form_ID_TIPO_PRESTAMO')).toHaveValue('HIPOTECARIOS');

        // Tipo Garantia
        await expect(page.locator('#form_ID_CLASE_GARANTIA')).toHaveValue('HIPOTECARIAS');

        // Oferta
        await expect(page.locator('#form_DESC_OFERTA')).toHaveValue('CRÉDITO HIPOTECARIO');

        // Grupo
        await expect(page.locator('#form_DESC_GRUPO')).toHaveValue('SIN GARANTIA');
    });  
    
    test('Cambios Solicitados al Credito', async () => {
        // Cambios Solicitados
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOCIO'})).toBeVisible();

        // Cambio de Fecha
        await expect(page.locator('#form_CAMB_FECHA')).toHaveValue(`${dosMesDespues}`);

        // Distribucion de Cuota
        //await page.getByLabel('Siguiente Cuota').check();

        // Razones
        await expect(page.getByText('NECESITA MAS TIEMPO PARA LOS PAGOS')).toBeVisible();
    });

    test('Confirmar la Reprogramacion del Credito', async () => {
        // Boton Actualizar
        const botonActualizar = page.getByRole('button', {name: 'Actualizar'});
        await expect(botonActualizar).toBeVisible();
        await botonActualizar.click();

        // Debe mostrarse un mensaje de que la operacion fue un exito
        await expect(page.locator('text=Solicitud de cambios productos actualizada exitosamente.')).toBeVisible();
    });
    
    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
