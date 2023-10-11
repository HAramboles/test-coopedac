import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { 
    url_base, 
    dataCerrar, 
    selectBuscar, 
    browserConfig, 
    inputFechaSolicitud, 
    inputPrimerPago, 
    ariaAgregar, 
    formComentario 
} from './utils/dataTests';
import { url_solicitud_credito } from './utils/urls';
import { formatDate, unMesDespues, diaSiguiente, diaAnterior } from './utils/fechas';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';

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
const firma2 = './tests/firma2.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

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

    test.beforeEach(async () => { // Info para el reporte de Allure
        await allure.owner('Hector Aramboles');
        await allure.severity(Severity.CRITICAL);
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
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);

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
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=1`);

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
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=2`);

        // El titulo principal debe estar visible
        const tituloPrincipal = page.getByRole('heading', {name: 'Generales del Crédito'});
        await expect(tituloPrincipal).toBeVisible();

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
        await page.getByText('CRÉDITO GERENCIAL / AHORROS').click();

        // Grupo
        await page.getByLabel('Grupo').click();
        await page.getByLabel('Grupo').fill('sin gara');
        // Elegir grupo sin garantia
        await page.getByRole('option', {name: 'SIN GARANTIA'}).click();

        // Fecha Solicitud debe ser el dia actual
        await expect(page.locator(`${inputFechaSolicitud}`)).toHaveValue(`${formatDate(new Date())}`);

        // Fecha Primer Pago debe ser 31 dias despues de la fecha de solicitud
        await expect(page.locator(`${inputPrimerPago}`)).toHaveValue(`${unMesDespues}`);

        // Colocar el dia siguiente como fecha solicitud
        await page.locator(`${inputFechaSolicitud}`).clear();
        await page.locator(`${inputFechaSolicitud}`).fill(`${diaSiguiente}`);

        // Click fuera del input
        await tituloPrincipal.click();

        // Debe aparecer un mensaje de error
        await expect(page.locator('#loan_form_FECHA_APERTURA_help').getByText('Rango de Fecha inválido.')).toBeVisible();

        // Colocar la fecha de solicitud correcta
        await page.locator(`${inputFechaSolicitud}`).clear();
        await page.locator(`${inputFechaSolicitud}`).fill(`${formatDate(new Date())}`);

        // Colocar en la fecha de primer pago una fecha anterior a la de solicitud
        await page.locator(`${inputPrimerPago}`).clear();
        await page.locator(`${inputPrimerPago}`).fill(`${diaAnterior}`);

        // Click fuera del input
        await tituloPrincipal.click();

        // Debe aparecer un mensaje de error
        await expect(page.locator('#loan_form_DIA_PAGO_help').getByText('Rango de Fecha inválido.')).toBeVisible();

        // Colocar la fecha de primer pago correcta
        await page.locator(`${inputPrimerPago}`).clear();
        await page.locator(`${inputPrimerPago}`).fill(`${unMesDespues}`);

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

        // Seccion Cuentas de Cobros
        await expect(page.locator('text=Cuentas de cobro')).toBeVisible();
        
        // Agregar una cuenta de Cobro
        await page.locator(`${selectBuscar}`).last().click();

        // Seleccionar la cuenta de ahorros
        await page.getByRole('option', {name: 'AHORROS NORMALES'}).click();

        // Click al boton de Agregar Cuenta
        const botonAgregarCuenta = page.getByRole('button', {name: 'Agregar cuenta'});
        await expect(botonAgregarCuenta).toBeVisible();
        await botonAgregarCuenta.click();

        // Se deben agregar los datos a la tabla de las cuentas
        await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Click en guardar y continuar
        GuardaryContinuar();
    });

    test('Volver al Paso 2 y el Cambio de Oferta debe estar Deshabilitado', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=3`);

        // El titulo principal debe estar visible
        await expect(page.getByRole('heading', {name: 'CARGOS'})).toBeVisible();

        // Click a la opcion del Paso 2
        await page.getByRole('button', {name: '2 Datos Préstamos'}).click();

        // La URL no debe regresar al paso 2
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=2`);

        // El titulo principal debe estar visible
        const tituloPrincipal = page.getByRole('heading', {name: 'Generales del Crédito'});
        await expect(tituloPrincipal).toBeVisible();

        // Los selectores para cambiar de oferta deben estar deshabilitados
        await expect(page.getByLabel('Tipo Crédito')).toBeDisabled();
        await expect(page.getByLabel('Tipo Garantía')).toBeDisabled();
        await expect(page.getByLabel('Oferta')).toBeDisabled();

       // Click en guardar y continuar
       GuardaryContinuar();
    });

    test('Paso 3 - Cargos del prestamo', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=3`);

        // El titulo principal debe estar visible
        await expect(page.getByRole('heading', {name: 'CARGOS'})).toBeVisible();

        // Click al boton de Agregar Cargo
        await page.locator(`${ariaAgregar}`).click();

        // Debe salir un modal
        const modal = page.locator('text=AGREGAR CARGO');
        await expect(modal).toBeVisible();

        // Buscar un subconcepto para el cargo
        await page.locator('#form_DESC_CARGO').click();
        // Elegir hipoteca
        await page.locator('text=HIPOTECA').click();

        // El tipo valor, la cuenta contable y el rango cargo deben estar deshabilitados
        await expect(page.locator('#form_TIPO_VALOR')).toBeDisabled();
        await expect(page.locator('#form_CUENTA_CONTABLE')).toBeDisabled();
        await expect(page.locator('#form_ID_RANGO')).toBeDisabled();

        // Boton Cancelar
        await page.getByRole('dialog').getByRole('button', {name: 'stop Cancelar'}).click();

        // Debe salir un modal de confirmacion
        await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();

        // Click en aceptar
        await page.getByRole('dialog').getByRole('button', {name: 'check Aceptar'}).click();

        // El modal debe desaparecer
        await expect(modal).not.toBeVisible();

        // Click en guardar y continuar
        GuardaryContinuar();
    });

    test('Paso 4 - Deudas', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=4`);

        // El titulo principal debe estar visible
        await expect(page.locator('text=DEUDAS PENDIENTES')).toBeVisible();

        // Boton de Agregar deudas
        await expect(page.getByRole('button', {name: 'Agregar'})).toBeVisible();

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 5 - Codeudores y Garantias', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=5`);

        // Debe mostrase solamente el titulo de garantias liquidas
        await expect(page.locator('h1').filter({hasText: 'GARANTÍAS LÍQUIDAS'})).toBeVisible();

        // Debe mostrarse un aviso indicando el tipo de garantia que se debe agregar a la solicitud
        await expect(page.getByText('Oferta require Garantía(s) Líquidas del siguiente tipo: AHORROS.')).toBeVisible();

        // Click al boton de agregar garantia
        await page.getByRole('button', {name: 'Agregar Garantia Liquida'}).click();

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
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=6`);

        // Click al boton de Agregar Documento
        const botonAgregarDocumento = page.getByRole('button', {name: 'Agregar documentos'});
        await expect(botonAgregarDocumento).toBeVisible();
        await botonAgregarDocumento.click();

        // Aparece un modal para elegir el documento a agregar
        const modalAgregarDocumento = page.getByRole('heading', {name: 'Agregar Documento'});
        await expect(modalAgregarDocumento).toBeVisible();

        // Elegir un documento
        await page.locator('#form_ID_REQUISITO').click();
        // Elegir el documento contrato
        await page.getByRole('option', {name: 'CONTRATO'}).click();

        // Subir el Contrato
        const subirContratoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('button', {name: 'upload Cargar'}).nth(2).click();
        const subirCedulaContrato = await subirContratoPromesa;
        await subirCedulaContrato.setFiles(`${firma2}`);

        // La imagen del contrato debe estar visible
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])')).toBeVisible();

        // Click al boton de Aceptar del modal
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Aprece un mensaje de Operacion Exitosa
        await expect(page.locator('text=Operación Exitosa').last()).toBeVisible();

        // El documento debe aparecer en la lista de documentos
        await expect(page.getByRole('link', {name: 'CONTRATO'})).toBeVisible();

        // Eliminar el documento Contrato
        await page.getByRole('button', {name: 'delete'}).nth(2).click();

        // Aparece un menasaje de confirmacion
        await expect(page.locator('text=¿Está seguro de eliminar este documento?')).toBeVisible();

        // Click al boton de Aceptar del mensaje
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // El documento debe desaparecer de la lista de documentos
        await expect(page.getByRole('link', {name: 'CONTRATO'})).not.toBeVisible();

        // Subir Cedula del Deudor
        const subirCedulaDeudorPromesa = page.waitForEvent('filechooser');
        await page.getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirCedulaDeudor = await subirCedulaDeudorPromesa;
        await subirCedulaDeudor.setFiles(`${firma}`);

        // Esperar que la Cedula se haya subido
        await expect(page.getByRole('link', {name: 'CEDULA DEUDOR'})).toBeVisible();

        // Click en la firma de la Cedula deudor para visualizar
        await page.getByRole('link', {name: 'CEDULA DEUDOR'}).click();

        // Aprece un modal con la imagen de la firma
        await expect(page.getByRole('dialog', {name: 'CEDULA DEUDOR'})).toBeVisible();

        // Cerrar la imagen de la firma
        await page.getByLabel('Close', {exact: true}).click();
    });

    test('Finalizar con la creacion de la Solicitud', async () => {
        // Boton de Finalizar
        const botonFinalizar = page.getByRole('button', {name: 'check Finalizar'});
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();

        // Esperar que se abran tres nuevas pestañas con los reportes
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');
        const page3 = await context.waitForEvent('page');

        // Cerrar todas las paginas
        await page3.close();
        await page2.close();
        await page1.close();
    });

    test('Agregar una Observacion al Prestamo', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'file-search'}).click();

        // Debe aparecer un modal para agregar las observaciones al prestamo
        const modalObservaciones = page.locator('text=OBSERVACIONES SOLICITUD DE CRÉDITO');
        await expect(modalObservaciones).toBeVisible();

        // Nombre del Socio en el modal de obvercaciones
        await expect(page.locator('#form_NOMBRE_SOCIO')).toHaveValue(`${nombre} ${apellido}`);

        // El tipo de Observacion debe ser Control Interno
        await expect(page.getByTitle('CONTROL INTERNO')).toBeVisible();

        // Click al selector de observacion para elegir una
        await page.locator(`${formComentario}`).click();
        // Elegir una observacion
        await page.getByTitle('En solicitud de crédito firma socio deudor').getByText('En solicitud de crédito firma socio deudor').click();

        // Se debe agregar la observacion a la tabla de observaciones
        await expect(page.getByRole('cell', {name: 'En solicitud de crédito firma socio deudor'})).toBeVisible();

        // Click al boton de Fecha posible entrega
        await page.locator('text=SIN FECHA').click();

        // Colocar una fecha como posible entrega
        await page.locator('#form_FECHA_ENTREGA').fill(`${formatDate(new Date())}`);

        // Click a Enter
        await page.keyboard.press('Enter');

        // Click al boton de Aplicar
        await page.getByRole('button', {name: 'Aplicar'}).click();

        // El mensaje de error del departamento no debe aparecer
        await expect(page.locator('text="DEPARTAMENTO" is not allowed')).not.toBeVisible();

        // El modal de Observaciones debe desaparecer
        await expect(modalObservaciones).not.toBeVisible(); 
    });

    test('Cambiar el estado de la Solicitud de Solicitado a En Proceso (Analisis)', async () => {
        // La url debe de tener que la solicitud esta en estado solicitado
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();
        
        // Ir a la ultima seccion 
        const seccionDocumentos = page.getByRole('button', {name: '6 Documentos'});
        await expect(seccionDocumentos).toBeVisible();
        await seccionDocumentos.click();

        // Esperar que carge la cedula del deudor
        await page.waitForTimeout(4000);

        // El documento debe estar visible
        await expect(page.getByRole('link', {name: 'CEDULA DEUDOR'}).first()).toBeVisible();

        // Cambiar el estado de la solicitud
        await page.getByRole('button', {name: 'ellipsis'}).click();
        // Debe estar visible el estado nulo
        await expect(page.getByText('NULO')).toBeVisible();
        // Cambiar el estado a En Proceso
        await page.getByText('EN PROCESO (ANALISIS)').click();
        
        // Debe salir un modal de confirmacion
        await expect(page.getByText('¿Está seguro que desea pasar el préstamo a estado EN PROCESO (ANALISIS)?')).toBeVisible();

        // Click en Aceptar y se debe abrir otra pagina con la solicitud
        const botonAceptar = page.getByRole('button', {name: 'check Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Esperar que se abran tres nuevas pestañas con los reportes
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');
        const page3 = await context.waitForEvent('page');

        // Cerrar todas las paginas
        await page3.close();
        await page2.close();
        await page1.close();
    });

    test('Cambiar el estado de la Solicitud de En Proceso (Analisis) a Aprobado', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);

        // Cambiar el estado de las solicitudes de Solicitado a En Proceso (Analisis)
        await page.locator('text=SOLICITADO').click();
        await page.locator('text=EN PROCESO (ANALISIS)').click();

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

        // Esperar cuatro segundos
        await page.waitForTimeout(4000);
        
        // Dirigirse a la ultima seccion
        const seccionAnalisis = page.getByRole('button', {name: '7 Análisis'});

        // if (await seccionAnalisis.isHidden()) {
        //     await expect(page.getByRole('button', {name: '2 Datos Préstamos'})).toBeVisible();
        //     await page.getByRole('button', {name: '7 Análisis'}).click();
        // } else if (await seccionAnalisis.isVisible()) {
        //     await expect(seccionAnalisis).toBeVisible();
        //     await seccionAnalisis.click();
        // }

        await expect(seccionAnalisis).toBeVisible();
        await seccionAnalisis.click();

        // El titulo de proceso, analisis debe estar visible
        await expect(page.getByRole('heading', {name: '(EN PROCESO (ANALISIS))'})).toBeVisible();

        // El nombre de la persona debe estar visible en un titulo
        await expect(page.getByRole('heading', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Agregar un comentario
        const campoComentario = page.getByPlaceholder('Comentario');
        await campoComentario.click();
        await campoComentario.fill('Credito Aprobado');
        // Guardar Comentario
        await page.getByRole('button', {name: 'Guardar'}).click();

        // Debe mostrarse un mensaje de que el comentario se guardo correctamente
        await expect(page.locator('text=Prestamos observacion almacenada exitosamente.')).toBeVisible();

        // Cambiar la categoria de la solicitud
        await page.getByRole('button', {name: 'ellipsis'}).click();
        // Debe estar visible el estado de rechazado
        await expect(page.getByText('RECHAZADO', {exact: true})).toBeVisible();
        // Debe estar visible el estado de solicitado
        await expect(page.getByText('SOLICITADO', {exact: true})).toBeVisible();

        // Cambiar el estado a Aprobado
        await page.getByText('APROBADO', {exact: true}).click();
        await page.getByText('¿Está seguro que desea pasar el préstamo a estado APROBADO?').click();   
        
        // Click en Aceptar y se debe abrir otra pagina con el reporte de Aprobacion
        const botonAceptar = page.getByRole('button', {name: 'check Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close();
    });

    test('Marcar como completada la Observacion colocado al Prestamo', async () => {
        // La url debe regresar a las solicitudes en proceso
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=en_proceso__analisis`);

        // Cambiar el estado de las solicitudes de En Proceso a Aprobado
        await page.locator('text=EN PROCESO (ANALISIS)').click();
        await page.locator('text=APROBADO').click();

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'file-search'}).click();

        // Debe aparecer un modal para agregar las observaciones al prestamo
        const modalObservaciones = page.locator('text=OBSERVACIONES SOLICITUD DE CRÉDITO');
        await expect(modalObservaciones).toBeVisible();

        // Nombre del Socio en el modal de obvercaciones
        await expect(page.locator('#form_NOMBRE_SOCIO')).toHaveValue(`${nombre} ${apellido}`);

        // La observacion agregada anteriormente debe estar en la tabla de las obversaciones
        await expect(page.getByRole('cell', {name: 'En solicitud de crédito firma socio deudor'})).toBeVisible();

        // Click al boton de Marcar como Completada
        await page.getByRole('button', {name: 'check-circle'}).click();

        // Debe aparecer un modal de confirmacion
        await expect(page.locator('text=¿Desea marcar esta observación como completada?.')).toBeVisible();

        // Click al boton de Aceptar del modal de confirmacion
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Aparece una alerta de operacion exitosa
        await expect(page.locator('text=Datos actualizados.')).toBeVisible();

        // La observacion debe aparecer como completada
        await expect(page.getByRole('button', {name: 'check', exact: true})).toBeVisible();

        // Click al boton de Aplicar
        await page.getByRole('button', {name: 'Aplicar'}).click();

        // El modal de Observaciones debe desaparecer
        await expect(modalObservaciones).not.toBeVisible(); 
    });

    test('Desembolsar la solicitud', async () => {
        // Las solicitudes deben estar en estado Aprobado
        //await expect(page.locator('text=APROBADO')).toBeVisible();

        await expect(page.locator('#form').getByText('APROBADO')).toBeVisible();
        //await expect(page.locator('#form_STATUS_list_0').getByText('APROBADO')).toBeVisible();

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();

        // La url debe de tener que la solicitud esta en aprobado
        await expect(page).toHaveURL(/\/aprobado/);

        // Dirigirse a la ultima seccion
        const seccionDesembolso = page.getByRole('button', {name: '7 Desembolso'});
        await expect(seccionDesembolso).toBeVisible();
        await seccionDesembolso.click();

        // El nombre y el apellido del socio deben estar visibles 
        await expect(page.getByText(`Socio: ${nombre} ${apellido}`)).toBeVisible(); 

        // EL boton de Imprimir Solicitud debe estar visible
        const botonImprimirContrato = page.getByRole('button', {name: 'Imprimir Contrato'});
        await expect(botonImprimirContrato).toBeVisible();

        // La tabla de cuentas de cobros debe estar visible
        await expect(page.getByRole('row', {name: 'Principal Tipo de cuenta No. Cuenta Titular Acciones'})).toBeVisible();

        // La cuenta de cobro debe estar visible
        await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Desembolsar la solicitud
        const botonDesembolsar = page.getByRole('button', {name: 'Desembolsar'});
        await expect(botonDesembolsar).toBeVisible();
        await botonDesembolsar.click();

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
