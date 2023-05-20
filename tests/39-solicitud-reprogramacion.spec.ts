import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { formatDate } from './utils/utils';
import { url_base } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Nombre y apellido de la persona
let nombre: string|null;
let apellido: string | null;

// Pruebas

test.describe('Pruebas con la Solicitud de Reprogramacion de Credito', () => {
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
        await page.locator('#select-search').fill(`${nombre} ${apellido}`);
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

    test('Pruebas con Cambio de Fecha', async () => {
        // Cambios solicitados
        await expect(page.locator('h1').filter({hasText: 'CAMBIOS SOLICITADOS'})).toBeVisible();

        // Cambio de Fecha
        await page.getByLabel('CAMBIO DE FECHA').check();

        // Tipo de cuota
        const tipoCuota = page.locator('text=Cuota Original: RD$ 416.67');

        // El tipo de cuota debe estar visible 
        await expect(tipoCuota).toBeVisible();

        // No debe permitir agregar otro cambio si ya este seleccionado el cambio de fecha
        await page.getByLabel('CAMBIO DE PLAZO').click();
        // Debe salir un mensaje de aviso
        await expect(page.getByText('No es posible seleccionar más de una opción si tiene seleccionada la opción de cambio de fecha.')).toBeVisible();

        // Cerrar el mensaje de aviso
        await page.locator('[aria-label="close"]').last().click();

        // Mismo dia pero en un mes diferente
        const diaActual = new Date();
        const otroMes = new Date(diaActual.setMonth(diaActual.getMonth() + 2)); 

        // Ingresar una fecha
        await page.locator('#form_CAMB_FECHA').fill(`${formatDate(otroMes)}`);

        // Clickear fuera del input de la fecha
        await page.getByText('Cambio de Fecha', {exact: true}).click();

        // Se debe mostrar un mensaje con la diferencia de interes por el cambio de fecha
        await expect(page.getByText('Diferencia de interes por cambio de fecha es:')).toBeVisible();

        // Quitar el check de cambio de fecha
        await page.getByLabel('CAMBIO DE FECHA', {exact: true}).uncheck();

        // El tipo de cuota no debe estar visible
        await expect(tipoCuota).not.toBeVisible();
    });

    test('Cambio de Plazo y de Tasa', async () => {
        // Cambios solicitados

        // Cambio de Plazo
        await page.getByLabel('CAMBIO DE PLAZO').check();

        // El campo para el cambio de plazo se debe mostrar
        const campoCambioPlazo = page.locator('#form_CAMB_PLAZO');
        await expect(campoCambioPlazo).toBeVisible();

        // Cambiar el plazo
        await campoCambioPlazo.fill('72');

        // Cambio de Tasa
        await page.getByLabel('CAMBIO DE TASA').check();

        // El campo para el cambio de tasa se debe mostrar
        const campoCambioTasa = page.locator('#form_CAMB_TASA');
        await expect(campoCambioTasa).toBeVisible();

        // Cambiar la tasa
        await campoCambioTasa.fill('15');

        // Tipos de cuota
        const cuotaOriginal = page.locator('text=Cuota Original');
        const CuotaSugerida = page.locator('text=Cuota Sugerida');

        // Cuota original debe estar visible
        await expect(cuotaOriginal).toBeVisible();

        // Click en algun lugar para que se realice el calculo
        await page.getByText('Razones').click();

        // La cuota sugerida debe estar visible
        await expect(CuotaSugerida).toBeVisible();

        // La Cuota Sugerid debe estar marcada
        expect(await page.isChecked('(//INPUT[@type="radio"])[2]')).toBeTruthy();

        // Distribucion de cuotas
        await expect(page.getByText('Siguiente Cuota')).toBeVisible();
        await expect(page.getByText('Distribuido')).toBeVisible();
        await expect(page.getByText('Última Cuota')).toBeVisible();

        // Elegir Distribucion Siguiente Cuota
        await page.getByLabel('Siguiente Cuota').check();

        // Razones
        await page.locator('#form_COMENTARIOS').fill('Necesita mas tiempo para los pagos');

        // Boton de Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        // Esperar que se abra una nueva pestaña con el reporte de la reprogramacion
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]);

        // Cerrar la pagina con el reporte
        await newPage.close();

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
    