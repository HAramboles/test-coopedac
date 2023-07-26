import { Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { formatDate } from './utils/utils';
import { url_base, ariaCerrar, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Seccion de Cambios Solicitados
let tituloCambiosSolicitados: Locator;
let cambioFecha: Locator;
let cambioTasa: Locator;
let cambioPlazo: Locator;

// Nombre y apellido de la persona
let nombre: string|null;
let apellido: string | null;

// Pruebas

test.describe.serial('Solicitud de Reprogramacion - Pruebas con los diferentes Parametros', async () => {
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

        // Nombre y apellido de la persona almacenada en el state
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Titulo y checks de la seccion de Cambios Solicitados
        tituloCambiosSolicitados = page.locator('h1').filter({hasText: 'CAMBIOS SOLICITADOS'});
        cambioFecha = page.getByLabel('CAMBIO DE FECHA');
        cambioTasa = page.getByLabel('CAMBIO DE TASA');
        cambioPlazo = page.getByLabel('CAMBIO DE PLAZO');
    });

    test('Ir a la opcion de Solicitud de Reprogramacion', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Solicitud Reprogramacion
        await page.getByRole('menuitem', {name: 'Solicitud Reprogramación'}).click();

        // La url debe de cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_reprogramacion/01-3-2-3?filter=pendientes`);

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD REPROGRAMACIÓN'})).toBeVisible();
    });

    test('Nueva Solicitud', async () => {
        // Boton Nueva Solicitud
        const botonSolicitud = page.getByRole('button', {name: 'Nueva Solicitud'});
        await expect(botonSolicitud).toBeVisible();
        await botonSolicitud.click();
    });

    test('Buscar un socio y editar su solicitud', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REPROGRAMACIÓN DE PRÉSTAMOS'})).toBeVisible();

        // Buscar a la persona
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);
        // Seleccionar a la persona buscada
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Se debe mostrar el credito de la persona
        await expect(page.getByRole('row', {name: 'CRÉDITO HIPOTECARIO edit eye'}).getByRole('cell', {name: 'CRÉDITO HIPOTECARIO'})).toBeVisible();

        // Editar la solicitud
        await page.getByRole('cell', {name: 'edit eye'}).getByRole('button', {name: 'edit'}).click();
    });

    test('Datos de la Solicitud', async () => {
        // Datos del socio
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOCIO'})).toBeVisible();

        // El nombre del socio debe estar visible
        await expect(page.locator('#form_NOMBRE')).toHaveValue(`${nombre} ${apellido}`);

        // Datos del credito
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL CRÉDITO'})).toBeVisible();

        // Monto Desembolsado
        await expect(page.locator('#form_DESEMBOLSADO')).toHaveValue('RD$ 50,000');

        // Tipo de garantia
        await expect(page.locator('#form_ID_CLASE_GARANTIA')).toHaveValue('HIPOTECARIAS');

        // Tipo credito 
        await expect(page.locator('#form_ID_TIPO_PRESTAMO')).toHaveValue('HIPOTECARIOS');

        // Oferta
        await expect(page.locator('#form_DESC_OFERTA')).toHaveValue('CRÉDITO HIPOTECARIO');

        // Grupo
        await expect(page.locator('#form_DESC_GRUPO')).toHaveValue('SIN GARANTIA');
    });
        
    test('La seccion de Cambios Solicitados debe estar visible', async () => {
        // El titulo de la seccion debe estar visible
        await expect(tituloCambiosSolicitados).toBeVisible();

        // Deben estar visibles los radios para reprogramar el credito
        await expect(cambioFecha).toBeVisible();
        await expect(cambioPlazo).toBeVisible();
        await expect(cambioTasa).toBeVisible();
    });

    test('Pruebas con Cambio de Fecha', async () => {
        // Cambios solicitados
        await expect(tituloCambiosSolicitados).toBeVisible();

        // Cambio de Fecha
        await cambioFecha.check();

        // Tipo de cuota
        const tipoCuota = page.locator('text=Cuota Original: RD$ 416.67');

        // El tipo de cuota debe estar visible 
        await expect(tipoCuota).toBeVisible();

        // No debe permitir agregar otro cambio si ya este seleccionado el cambio de fecha
        await page.getByLabel('CAMBIO DE PLAZO').click();
        // Debe salir un mensaje de aviso
        await expect(page.getByText('No es posible seleccionar más de una opción si tiene seleccionada la opción de cambio de fecha.')).toBeVisible();

        // Cerrar el mensaje de aviso
        await page.locator(`${ariaCerrar}`).last().click();

        // Mismo dia pero en un mes diferente
        const diaActual = new Date();
        const otroMes = new Date(diaActual.setMonth(diaActual.getMonth() + 2)); 

        // Ingresar una fecha
        await page.locator('#form_CAMB_FECHA').fill(`${formatDate(otroMes)}`);

        // Clickear fuera del input de la fecha
        await page.getByText('Cambio de Fecha', {exact: true}).click();

        // Se debe mostrar un mensaje con la diferencia de interes por el cambio de fecha
        await expect(page.getByText('Diferencia de interes por cambio de fecha es:')).toBeVisible();
                    
        // Razones
        await page.locator('#form_COMENTARIOS').fill('Necesita mas tiempo para los pagos');

        // Boton de Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close();

        // Se debe regresar a la pagina anterior y debe estar un mensaje de confirmacion
        await expect(page.locator('text=Solicitud de cambios productos almacenado exitosamente.')).toBeVisible();

        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();
    });

    test.afterAll(async () => {
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
