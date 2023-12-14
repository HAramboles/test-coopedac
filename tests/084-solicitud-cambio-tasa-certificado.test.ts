import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { selectBuscar, dataEdit } from './utils/data/inputsButtons';
import { url_base, url_solicitud_cambio_tasa_certificado } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Nombre y apellido del firmante
let nombreFirmante: string | null;
let apellidoFirmante: string | null;

// Pruebas
test.describe.serial('Pruebas con la Solicitud de Cambio de Tasa de un Certificado', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Nombre y apellido de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Nombre y apellidos del firmante almacenada en el state
        nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
    });

    const AgregarCertificado = async () => {
        // Boton Agregar Certificado
        const agregarCertificado = page.getByRole('button', {name: 'Agregar Certificado'});
        // Debe estar visible
        await expect(agregarCertificado).toBeVisible();
        // Click en el boton
        await agregarCertificado.click();
    };

    test('Ir a la opcion de Solicitud cambio de tasa de certificado', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Solic. Cambio Tasa Cert.
        await page.getByRole('menuitem', {name: 'Solic. Cambio Tasa Cert.'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_cambio_tasa_certificado}`);
    });

    test('Buscar el Certificado - Inversion Pagaderas de un Socio', async () => {
        // Titulo principal
        await expect(page.locator('h1').filter({hasText: 'SOLICITUD CAMBIO DE TASA CERTIFICADO'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Elegir la cuenta de certificado inversion pagaderas
        await page.getByText('INVERSION PAGADERAS').click();

        // Descripcion de cuenta, debe estar el tipo de cuenta elegido
        await expect(page.locator('#form_DESC_CUENTA')).toHaveValue('INVERSION PAGADERAS');

        // Monto Apertura
        await expect(page.locator('#form_MONTO_APERTURA')).toHaveValue('50.00');

        // Tasa de interes
        await expect(page.locator('#form_TASA')).toHaveValue('5.00');

        // Plazo
        await expect(page.locator('#form_PLAZO')).toHaveValue('24');

        // Boton Agregar Certificado
        const botonAgregar = page.getByRole('button', {name: 'Agregar Certificado'});
        await expect(botonAgregar).toBeVisible();

        // Click al boton de agregar certificado sin colocar una tasa
        await botonAgregar.click();

        // Debe salir un mensaje de error
        await expect(page.getByText('Tasa Nueva es requerido.')).toBeVisible();

        // Agregar una Nueva Tasa
        await page.locator('#form_NUEVA_TASA').fill('10');
    });

    test('Firmantes del Certificado - iNVERSION Pagaderas', async () => {
        // Titulo de la seccion
        await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();

        // Nombre del titular
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Debe mostarse el tipo de firmante
        await expect(page.getByRole('cell', {name: 'TITULAR'})).toBeVisible();

        // Nombre del copropietario
        await expect(page.getByRole('cell', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();

        // Debe mostarse el tipo de firmante
        await expect(page.getByRole('cell', {name: 'CO-PROPIETARIO'})).toBeVisible();
    });

    test('En la Tabla de los Certificados debe agregarse el Certificado', async () => {
        // Boton de Agregar Certificado
        AgregarCertificado();

        // El Certificado debe estar en la Tabla de los Certificados

        // Nombre del Socio
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Monto de Apertura
        await expect(page.getByRole('cell', {name: '50.00'})).toBeVisible();

        // Tasa Anterior
        await expect(page.getByRole('cell', {name: '5.00'})).toBeVisible();

        // Nueva Tasa
        await expect(page.getByRole('cell', {name: '10', exact: true})).toBeVisible();
        
        // Plazo
        await expect(page.getByRole('cell', {name: '24', exact: true})).toBeVisible();
    });

    test('Buscar el Certificado - Financieros Reinvertidas del Socio', async () => {
        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);
        // Elegir la cuenta de certificado financieros reinvertidas
        await page.getByText('FINANCIEROS REINVERTIDAS').click();

        // Descripcion de cuenta, debe estar el tipo de cuenta elegido
        await expect(page.locator('#form_DESC_CUENTA')).toHaveValue('FINANCIEROS REINVERTIDAS');

        // Monto Apertura
        await expect(page.locator('#form_MONTO_APERTURA')).toHaveValue('50.00');

        // Tasa de interes
        await expect(page.locator('#form_TASA')).toHaveValue('8.00');

        // Plazo
        await expect(page.locator('#form_PLAZO')).toHaveValue('36');

        // Agregar una Nueva Tasa
        await page.locator('#form_NUEVA_TASA').fill('12');
    });

    test('Firmantes del Certificado - Financieros Reinvertidas', async () => {
        // Nombre del titular
        await expect(page.getByRole('row', {name: `${nombre} ${apellido} TITULAR`})).toBeVisible();

        // Debe mostarse el tipo de firmante
        await expect(page.getByRole('cell', {name: 'TITULAR'})).toBeVisible();

        // Nombre del copropietario
        await expect(page.getByRole('cell', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();

        // Debe mostarse el tipo de firmante
        await expect(page.getByRole('cell', {name: 'CO-PROPIETARIO'})).toBeVisible();
    });

        test('En la Tabla de los Certificados deben estar los dos Certificados Agregados', async () => {
        // Agregar Certificado
        AgregarCertificado();

        // Titulo de la seccion
        await expect(page.locator('h1').filter({hasText: 'CERTIFICADOS'})).toBeVisible();

        // Deben estar el titular de los certificados
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`}).first()).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`}).last()).toBeVisible();

        // Monto de Apertura de los dos Certificados
        await expect(page.getByRole('cell', {name: '50.00'}).first()).toBeVisible();
        await expect(page.getByRole('cell', {name: '50.00'}).last()).toBeVisible();

        // Tasa de los dos Certificados
        await expect(page.getByRole('cell', {name: '5.00'})).toBeVisible();
        await expect(page.getByRole('cell', {name: '8.00'})).toBeVisible();

        // Nueva Tasa
        await expect(page.getByRole('cell', {name: '10', exact: true})).toBeVisible();
        await expect(page.getByRole('cell', {name: '12', exact: true})).toBeVisible();

        // Plazo de los dos Certificados
        await expect(page.getByRole('cell', {name: '24', exact: true})).toBeVisible();
        await expect(page.getByRole('cell', {name: '36', exact: true})).toBeVisible();
    }); 

    test('Editar el Certificado - Inversion Pagaderas ya agergado', async () => {
        // Editar el primer certificado agregado, el de Inversion Pagaderas
        await page.getByRole('row', {name: 'INVERSION PAGADERAS'}).locator(`${dataEdit}`).click();

        // Aparece un modal para editar la tasa
        const modalEditarTasa = page.getByText('Modificar tasa');
        await expect(modalEditarTasa).toBeVisible();

        // Mensaje del modal
        await expect(page.getByText('Por favor indique la nueva tasa del certificado:')).toBeVisible();

        // Tasa Actual
        await expect(page.locator('#form_TASA_ACTUAL')).toHaveValue('5');

        // Tasa Nueva
        const nuevaTasa = page.locator('#form_TASA_NUEVA');
        await expect(nuevaTasa).toHaveValue('10');

        // Colocar una nueva tasa
        await nuevaTasa.clear();
        await nuevaTasa.fill('15');
        await page.waitForTimeout(1000);

        // Click al boton de Aceptar del modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // El modal debe desaparecer
        await expect(modalEditarTasa).not.toBeVisible();

        // La nueva tasa debe estar en la tabla
        await expect(page.getByRole('cell', {name: '15', exact: true})).toBeVisible();
    });

    test('Guadar las Solicitudes de Cambio de Tasa', async () => {
        // Boton de Guadar
        const botonGuardar = page.getByRole('button', {name: 'Guardar'});
        await expect(botonGuardar).toBeVisible();
        await botonGuardar.click();

        // Aparece un modal de confirmacion
        await expect(page.getByText('¿Desea guardar los cambios?')).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Se abre una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');

        // Cerrar la pagina con el reporte
        await page1.close();

        // Debe regresar a la pagina y tiene que estar un modal de confirmacion
        await expect(page.locator('text=Se ha(n) realizado la(s) solicitud(es) correctamente.')).toBeVisible();

        // Click en Aceptar
        await page.locator('button').filter({hasText: 'Aceptar'}).click();
    });

    test.afterAll(async () => {
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
});
