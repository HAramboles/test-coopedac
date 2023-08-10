import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataCerrar, selectBuscar, formBuscar, ariaCerrar, browserConfig } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Imagen de los documentos
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Pruebas
test.describe.serial('Prueba con la Solicitud de Credito', () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json',
        });

        // Crear una nueva page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre y apellidos de la persona almacenada en el state
        cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    // Funcion con el boton de continuar, que se repite en cada seccion del registro
    const GuardaryContinuar = async () => {
        // continuar
        const botonGuardaryContinuar = page.locator('button:has-text("Guardar y continuar")');
        // Esperar a que este visible
        await expect(botonGuardaryContinuar).toBeVisible();
        // presionar el boton
        await botonGuardaryContinuar.click();
    };

    test('Ir a la opcion de Solicitud de Credito', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();
        
        // Solicitud de Credito
        await page.getByRole('menuitem', {name: 'Solicitud de Crédito'}).click();

        // La URL debe de cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();
    });

    test('Boton Nueva Solicitud', async () => {
        // El listado de las solicitudes debe ser solicitado
        await expect(page.locator('text=SOLICITADO')).toBeVisible();

        // Boton Nueva Solicitud
        const botonNuevaSolicitud = page.getByRole('button', {name: 'Nueva Solicitud'});
        await expect(botonNuevaSolicitud).toBeVisible();
        await botonNuevaSolicitud.click();
    });

    test('Paso 1 - Datos del Solicitante', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=1`);

        // Deben estar visibles los tres titulos del primer paso
        await expect(page.getByRole('heading', {name: 'Solicitante', exact: true})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Datos del Solicitante'})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Lugar de Trabajo Solicitante'})).toBeVisible();

        // Buscar al socio
        await page.locator(`${selectBuscar}`).fill(`${cedula}`);
        // Seleccionar al socio
        await page.locator(`text=${cedula}`).click();

        // El nombre de la persona debe estar visible
        await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

        // Ver la firma del solicitante
        const botonVerFirmas = page.locator('text=Ver firmas');
        await expect(botonVerFirmas).toBeVisible();
        await botonVerFirmas.click();

        // Se debe mostrar la firma
        await expect(page.locator('(//img[@class="ant-image-preview-img"])')).toBeVisible();

        // Cerrar la imagen de la firma
        await page.locator(`${dataCerrar}`).click();

        // Click al boton de guardar y continuar 
        GuardaryContinuar();

        // Se debe mostrar un modal
        await expect(page.locator('text=No se ha actualizado la información laboral de la persona. ¿Desea continuar?')).toBeVisible();
        
        // Click en Aceptar
        await page.locator('text=Aceptar').click();
    });

    test('Paso 2 - Datos Prestamo', async () => {
        // La URL no debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=2`);

        // El titulo principal debe estar visible
        await expect(page.getByRole('heading', {name: 'Generales del Crédito'})).toBeVisible();

        // Tipo de credito
        await page.getByLabel('Tipo Crédito').click();
        // Click a credito hipotecario
        await page.getByText('CONSUMO').click();

        // Tipo de garantia
        await page.getByLabel('Tipo Garantía').click();
        // Click en garantia hipotecaria
        await page.getByText('AHORROS', {exact: true}).click();

        // Oferta
        await page.getByLabel('Oferta').click();
        // Elegir credito hipotecaria
        await page.getByText('CRÉDITO CON GARANTÍAS DE AHORROS').click();

        // Grupo
        await page.getByLabel('Grupo').click();
        await page.getByLabel('Grupo').fill('sin gara');
        // Elegir grupo sin garantia
        await page.getByRole('option', {name: 'SIN GARANTIA'}).click();

        // tipo de cuota
        await expect(page.getByText('INSOLUTO')).toBeVisible();

        // Monto
        await page.locator('#loan_form_MONTO').click();
        await page.locator('#loan_form_MONTO').fill('20000');

        // Tasa
        const campoTasa = page.getByLabel('Tasa');
        await campoTasa.click();
        await campoTasa.clear();;

        // Ingresar una Tasa Correcta
        await campoTasa.fill('5');

        // Plazo
        await page.getByPlaceholder('CANTIDAD').click();
        await page.getByPlaceholder('CANTIDAD').fill('24');

        // Los plazos deben ser mensuales
        await expect(page.locator('text=MENSUAL')).toBeVisible();

        // Agregar una cuenta del socio para desembolsar
        await page.locator(`${selectBuscar}`).first().click();
        // La cuenta de aportaciones no debe estar visible
        await expect(page.locator('span').filter({hasText: 'APORTACIONES'})).not.toBeVisible(); 

        // Seleccionar la cuenta de ahorros
        await page.getByText('AHORROS NORMALES').click();

        // Agregar un cuenta para cobrar
        await page.locator(`${selectBuscar}`).last().click();
        // La cuenta de aportaciones no debe estar visible
        await expect(page.locator('span').filter({hasText: 'APORTACIONES'})).not.toBeVisible(); 
        
        // Seleccionar la cueta de ahorros
        await page.getByText('AHORROS NORMALES').last().click();

        // Finalidad
        await page.getByLabel('Finalidad').click();
        // Elegir consumo
        await page.getByRole('option', { name: 'CONSUMO' }).click();

        // Destino o proposito
        await page.getByPlaceholder('Destino o propósito').click();
        await page.getByPlaceholder('Destino o propósito').fill('Asuntos Personales');

        // Los valores del monto, tasa y plazo deben estar correctos
        await expect(page.locator('#loan_form_MONTO')).toHaveValue('RD$ 20,000');
        await expect(page.locator('#loan_form_TASA')).toHaveValue('5%');
        await expect(page.locator('#loan_form_PLAZO')).toHaveValue('24');

        // Via desembolso
        await expect(page.getByText('Vía Desembolso')).toBeVisible();

        // Click en guardar y continuar
        GuardaryContinuar();
    });

    test('Paso 3 - Cargos del prestamo', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=3`);

        // El titulo principal debe estar visible
        await expect(page.getByRole('heading', {name: 'CARGOS'})).toBeVisible();
        
        // Click en guardar y continuar
        GuardaryContinuar();
    });

    test('Paso 4 - Deudas', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=4`);

        // El titulo principal debe estar visible
        await expect(page.locator('text=DEUDAS PENDIENTES')).toBeVisible();

        // Boton de Agregar deudas
        await expect(page.getByRole('button', {name: 'Agregar'})).toBeVisible();

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 5 - Codeudores y Garantias', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=5`);

        // Debe mostrase solamente el titulo de garantias liquidas
        await expect(page.locator('h1').filter({hasText: 'GARANTÍAS LÍQUIDAS'})).toBeVisible();

        // Debe mostrarse un aviso indicando el tipo de garantia que se debe agregar a la solicitud
        await expect(page.getByText('Oferta require Garantía(s) Líquidas del siguiente tipo: AHORROS.')).toBeVisible();

        // Click al boton de agregar garantia
        await page.getByRole('button', {name: 'Agregar Garantia'}).click();

        // Debe salir un modal para agregar la garantia liquida
        await expect(page.getByRole('heading', {name: 'Agregar Garantía Líquida'}).first()).toBeVisible();

        // El modal debe tener por defecto, el tipo de cuenta Ahorros Normales
        await expect(page.getByText('AHORROS NORMALES').first()).toBeVisible();

        // Click al selector para buscar socios
        await page.locator(`${selectBuscar}`).nth(1).click();

        // Debe mostrarse la cuenta de Ahorros Normales de la persona
        const cuentaAhorros = page.getByRole('option', {name: 'AHORROS NORMALES'});
        await expect(cuentaAhorros).toBeVisible();
        // Click a la opcion de la cuenta de ahorros de la persona
        await cuentaAhorros.click();

        // Se debe agregar la cuenta seleccionada
        await expect(page.locator('#form_TIPO_CUENTA_DESC').first()).toHaveValue('AHORROS NORMALES');

        // Ingresar el monto a usar
        await page. getByRole('spinbutton', {name: 'VALOR DE LA GARANTÍA'}).fill('20000');

        // Click fuera del input y al mismo tiempo debe mostrarse el monto maximo a utilizar
        await page.locator('text=El monto máximo utilizable es').nth(1).click();

        // Click al boton de Aceptar del modal
        await page.getByRole('button', {name: 'Aceptar'}).nth(1).click();

        // Debe aparecer una alerta indicando que la garantia se agrego correctamente
        await expect(page.locator('text=Garantías del préstamo guardadas exitosamente.')).toBeVisible();

        // Debe agregarse la cuenta de la garantia liquida agregada
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 6 - Documentos', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=6`);

        // El titulo principal debe esatr visible
        await expect(page.getByRole('heading', {name: 'Lista de documentos'})).toBeVisible();
        
        // Subir Cedula Deudor
        const subirCartaTrabajoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '1 CEDULA DEUDOR upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirCartaTrabajo = await subirCartaTrabajoPromesa;
        await subirCartaTrabajo.setFiles(`${firma}`);

        // Esperar que la Cedula del Deudor se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])')).toBeVisible();
    });

    test('Finalizar con la creacion de la Solicitud', async () => {
        // Boton de Finalizar
        const botonFinalizar = page.getByRole('button', {name: 'check Finalizar'});
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();

        // Luego no debe sair ningun reporte

        // Por ahora se abre una ventana con el reporte de Aprobado
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con la solicitud
        await page1.close();
    });

    test('Anular la Solicitud Creada', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);

        // Cambiar el estado de las solicitudes a Aprobado
        await page.locator('text=SOLICITADO').click();
        await page.locator('text=APROBADO').click();

        // Cerrar las alertas
        await page.locator(`${ariaCerrar}`).first().click();
        await page.locator(`${ariaCerrar}`).last().click();

        // Buscar la solicitud creada
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Click en el boton de Anular
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'delete'}).click();

        // Aparece un mensaje de confirmacion
        await expect(page.getByText('Anular solicitud', {exact: true})).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'check Aceptar'}).click();

        // Aparece otro modal para colocar el motivo de la anulacion
        await expect(page.locator('text=Escriba una razón de anulación')).toBeVisible();

        // Ingresar la razon de la anulacion
        await page.locator('#form_RAZON_ANULACION').fill('El socio necesita otro tipo de prestamo');

        // Click al boton de Aceptar
        await page.getByRole('dialog', { name: 'Escriba una razón de anulación' }).getByRole('button', {name: 'check Aceptar'}).click();

        // Aparece una alerta de que la solicitud fue anulada
        await expect(page.locator('text=Prestamo actualizado exitosamente')).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});