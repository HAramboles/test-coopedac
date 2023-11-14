import { Browser, BrowserContext, chromium, expect, Locator, Page, test } from '@playwright/test';
import { selectBuscar, formComentarios, formBuscar } from './utils/data/inputsButtons';
import { url_base, url_solicitud_reprogramacion, url_reprogramacion_creditos } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Seccion de Cambios Solicitados
let tituloCambiosSolicitados: Locator;
let cambioFecha: Locator;
let cambioTasa: Locator;
let cambioPlazo: Locator;

// Cedula, nombre y apellido de la persona
let cedula: string|null;
let nombre: string|null;
let apellido: string | null;

// Pruebas
test.describe.serial('Pruebas con la Solicitud de Reprogramacion de Creditos', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una nueva page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
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
        await expect(page).toHaveURL(`${url_solicitud_reprogramacion}?filter=pendientes`);

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
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Seleccionar a la persona buscada
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Se debe mostrar el credito crediauto de la persona
        await expect(page.getByRole('row', {name: 'CRÉDIAUTOS edit eye'}).getByRole('cell', {name: 'CRÉDIAUTOS'})).toBeVisible();

        // Editar la solicitud
        await page.getByRole('row', {name: 'CRÉDIAUTOS edit eye'}).getByRole('button', {name: 'edit'}).click();
    });

    test('Datos de la Solicitud', async () => {
        // Datos del socio
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOCIO'})).toBeVisible();

        // El nombre del socio debe estar visible
        await expect(page.locator('#form_NOMBRE')).toHaveValue(`${nombre} ${apellido}`);

        // Datos del credito
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL CRÉDITO'})).toBeVisible();

        // Monto Desembolsado
        await expect(page.locator('#form_DESEMBOLSADO')).toHaveValue('RD$ 125,000');

        // Tipo de garantia
        await expect(page.locator('#form_ID_CLASE_GARANTIA')).toHaveValue('PRENDARIAS');

        // Tipo credito 
        await expect(page.locator('#form_ID_TIPO_PRESTAMO')).toHaveValue('CONSUMO');

        // Oferta
        await expect(page.locator('#form_DESC_OFERTA')).toHaveValue('CRÉDIAUTOS');

        // Grupo
        await expect(page.locator('#form_DESC_GRUPO')).toHaveValue('VEGAMOVIL');
    });
        
    test('La seccion de Cambios Solicitados debe estar visible', async () => {
        // El titulo de la seccion debe estar visible
        await expect(tituloCambiosSolicitados).toBeVisible();

        // Deben estar visibles los radios para reprogramar el credito
        await expect(cambioFecha).toBeVisible();
        await expect(cambioPlazo).toBeVisible();
        await expect(cambioTasa).toBeVisible();
    });

    test('Pruebas con Cambio de Plazo', async () => {
        // Cambios solicitados
        await expect(tituloCambiosSolicitados).toBeVisible();

        // Cambio de plazo
        await cambioPlazo.check();

        // Tipo de cuota
        const tipoCuota = page.locator('text=Cuota Original: RD$ 3,015.90');

        // El tipo de cuota debe estar visible 
        await expect(tipoCuota).toBeVisible();

        // Ingresar una plazo diferente al solicitado
        await page.locator('#form_CAMB_PLAZO').fill('80');

        // Clickear fuera del input de la fecha
        await page.getByText('CAMBIOS SOLICITADOS').click();

        // Se debe mostrarse la cuota sugerida
        await expect(page.getByText('Cuota Sugerida:')).toBeVisible();
                    
        // Razones
        await page.locator(`${formComentarios}`).fill('Se requiere de mas plazos para pagar el credito');

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

    test('Ir a la opcion de Reprogramacion de Creditos', async () => {
        // Click en Contraer todo
        await page.getByText('Contraer todo').click();

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
        const botonConfirmar = page.getByRole('row', {name: `${nombre} ${apellido} CRÉDIAUTOS`}).getByRole('button', {name: 'check-circle'});
        await botonConfirmar.click();
    });

    test('Datos del Credito', async () => {
        // Debe mostrarse la solicitud con los datos
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOCIO'})).toBeVisible();

        // El nombre del socio debe estar visible
        await expect(page.locator('#form_NOMBRE')).toHaveValue(`${nombre} ${apellido}`);

        // Datos del credito
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL CRÉDITO'})).toBeVisible();

        // Monto Desembolsado
        await expect(page.locator('#form_DESEMBOLSADO')).toHaveValue('RD$ 125,000');

        // Tipo de garantia
        await expect(page.locator('#form_ID_CLASE_GARANTIA')).toHaveValue('PRENDARIAS');

        // Tipo credito 
        await expect(page.locator('#form_ID_TIPO_PRESTAMO')).toHaveValue('CONSUMO');

        // Oferta
        await expect(page.locator('#form_DESC_OFERTA')).toHaveValue('CRÉDIAUTOS');

        // Grupo
        await expect(page.locator('#form_DESC_GRUPO')).toHaveValue('VEGAMOVIL');
    }); 

    test('Cambios Solicitados al Credito', async () => {
        // Cambios Solicitados
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOCIO'})).toBeVisible();

        // Cambio de Fecha
        await expect(page.locator('#form_CAMB_PLAZO')).toHaveValue('80');

        // Distribucion de Cuota
        await page.getByLabel('Siguiente Cuota').check();

        // Razones
        await expect(page.getByText('SE REQUIERE DE MAS PLAZOS PARA PAGAR EL CREDITO')).toBeVisible();
    });

    test('Salir del modal de Aceptar la Reprogramacion', async () => {
        // Click al boton de Cancelar
        const botonCancelar = page.getByRole('button', {name: 'Cancelar'});
        await expect(botonCancelar).toBeVisible();
        await botonCancelar.click();

        // Debe aparecer un mensaje de confirmacion
        await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();
        
        // Click al boton de Aceptar del modal de confirmacion
        await page.getByRole('button', {name: 'check Aceptar'}).nth(1).click();

        // El modal debe desaparecer
        await expect(page.locator('h1').filter({hasText: 'DATOS DEL SOCIO'})).not.toBeVisible();
    });

    test('Anular la Solicitud de Reprogramacion', async () => {
        // Boton anular
        const botonAnular = page.getByRole('row', {name: `${nombre} ${apellido} CRÉDIAUTOS`}).getByRole('button', {name: 'stop' });
        await botonAnular.click();

        // Debe aparecer un mensaje de anulacion
        await expect(page.getByText('Razón del Rechazo')).toBeVisible();

        // Digitar una razon de la anulacion de la reprogramacion del credito
        await page.locator('#form_OBSERVACION').fill('Error del cliente, el plazo original es el correcto');

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Debe aparecer un mensaje de confirmacion
        await expect(page.getByText('¿Está seguro que desea inhabilitar este registro?')).toBeVisible();

        // Clik en aceptar del modal de confirmacion
        await page.getByRole('button', {name: 'check Aceptar'}).nth(1).click();

        // El modal debe cerrarse
        await expect(page.getByText('Razón del Rechazo')).not.toBeVisible();

        // La solicitud de reprogramcion no debe mostrarse
        await expect(page.getByRole('row', {name: `${nombre} ${apellido} CRÉDIAUTOS`})).not.toBeVisible();
    });

    test.afterAll(async () => {
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
