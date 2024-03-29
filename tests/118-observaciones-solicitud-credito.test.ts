import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { 
    dataCerrar, 
    selectBuscar, 
    inputFechaSolicitud, 
    inputPrimerPago,
    formComentario,
    fechaSolicitudCredito,
    usuarioAproboSolicitud,
    dataVer,
    formBuscar,
    buscarPorNombre,
    crearBuscarPorCedula,
    noData
} from './utils/data/inputsButtons';
import { url_base, url_solicitud_credito } from './utils/dataPages/urls';
import { diaActualFormato, unMesDespues, diaSiguiente, diaAnterior } from './utils/functions/fechas';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { userCorrectoUpperCase } from './utils/data/usuarios';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Imagen de los documentos
const firma = './tests/utils/img/firma.jpg';

// Monto solicitado para el prestamo
const cantMonto:string = '20,000';

// Pruebas
test.describe.serial('Prueba con la Solicitud de Credito', () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

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

    // Funcion para cerrar las paginas que se abren con los diferentes reportes en los pasos de la solicitud de credito
    const CerrarPaginasReportes = async () => {
        context.on('page', async (page) => {
            await page.waitForTimeout(1000);
            await page.close();
        });
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

    test('No debe mostrarse un Error Innterno', async () => {
        // Titulo del error
        await expect(page.getByText('Error Interno')).not.toBeVisible();

        // Subtitulo del error
        await expect(page.getByText('AUTOMATIC_INTERNAL_ERROR')).not.toBeVisible();

        // Mensaje del error
        await expect(page.getByText("Cannot read properties of undefined (reading 'ESTADO_PRESTAMO')")).not.toBeVisible();
    });

    test('Paso 1 - Datos del Solicitante', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=1`);

        // Deben estar visibles los tres titulos del primer paso
        await expect(page.getByRole('heading', {name: 'Solicitante', exact: true})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Datos del Solicitante'})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Lugar de Trabajo Solicitante'})).toBeVisible();

        // El radio de buscada por cedula debe estar marcado
        await expect(page.locator(`${crearBuscarPorCedula}`)).toBeChecked();

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
        await page.getByText('CRÉDITO GERENCIAL / AHORROS -1M').click();

        // Grupo
        await page.getByLabel('Grupo').click();
        await page.getByLabel('Grupo').fill('sin gara');
        // Elegir grupo sin garantia
        await page.getByRole('option', {name: 'SIN GARANTIA'}).click();

        // Fecha Solicitud debe ser el dia actual
        await expect(page.locator(`${inputFechaSolicitud}`)).toHaveValue(`${diaActualFormato}`);

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
        await page.locator(`${inputFechaSolicitud}`).fill(`${diaActualFormato}`);

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

        // Tipo de cuota
        await expect(page.getByText('INSOLUTO')).toBeVisible();

        // Ver los rangos de la oferta
        await page.locator(`${dataVer}`).click();

        // Debe aparecer un modal qe ue contenga los efectos
        const modalRangos = page.locator('h1').filter({hasText: 'DETALLES DE RANGO'});
        await expect(modalRangos).toBeVisible();

        // Debe mostrarse la tabla con los rangos
        await expect(page.getByRole('columnheader', {name: 'Moneda'})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'Monto'})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'Tasa'})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'Plazo'})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'Mora'})).toBeVisible();

        // Click al boton de Aceptar
        await page.getByRole('button', {name: 'check Aceptar'}).click();

        // El modal debe desaparecer
        await expect(modalRangos).not.toBeVisible();

        // Monto
        await page.locator('#loan_form_MONTO').click();
        await page.locator('#loan_form_MONTO').fill(`${cantMonto}`);

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
        await page.getByRole('option', {name: 'CONSUMO'}).click();

        // Destino o proposito
        await page.getByPlaceholder('Destino o propósito').click();
        await page.getByPlaceholder('Destino o propósito').fill('Asuntos Personales');

        // Los valores del monto, tasa y plazo deben estar correctos
        await expect(page.locator('#loan_form_MONTO')).toHaveValue(`RD$ ${cantMonto}`);
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

        // Click a la seccion de Tabla de amortizacion
        await page.getByText('Amortización').click();

        // Boton de Imprimir
        const botonImprimir = page.getByRole('button', {name: 'Imprimir'});
        await expect(botonImprimir).toBeVisible();
        await botonImprimir.click();
        
        // Esperar a que se abra una nueva pagina con el reporte de la tabla de amortizacion
        const page1 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte de la tabla de amortizacion
        await page1.close();

        // Debe regresar a la pagina de Solicitud de Credito
        await expect(page.getByRole('heading', {name: 'CARGOS'})).toBeVisible();
        
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

        // Debe mostrarse un mensaje de informacion
        await expect(page.getByText('Si agrega más de una garantia tenga en cuanta que estas se despignoran en el mismo orden que son agregadas.')).toBeVisible();

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

        // Ingresar un monto mayor al monto del prestamo
        const inputMontoPrestamo = page.getByRole('spinbutton', {name: 'VALOR DE LA GARANTÍA'});
        await inputMontoPrestamo.fill('50000');

        // Boton de Aceptar del modal de Agregar Garantia Liquida
        const botonAceptarModal = page.getByRole('button', {name: 'Aceptar'}).nth(1);
        await expect(botonAceptarModal).toBeVisible();
        await botonAceptarModal.click();

        // Debe aparecer una alerta de error
        await expect(page.getByText('El total de las garantías no debe ser mayor al monto del préstamo.')).toBeVisible();

        // Cerrar la alerta de error
        await page.locator('a').nth(2).click();

        // Ingresar el monto correcto a usar
        await inputMontoPrestamo.clear();
        await inputMontoPrestamo.fill(`${cantMonto}`);

        // Click fuera del input y al mismo tiempo debe mostrarse el monto maximo a utilizar
        await page.locator('text=El monto máximo utilizable es').nth(1).click();

        // Click al boton de Aceptar del modal
        await botonAceptarModal.click();

        // Debe agregarse la cuenta de la garantia liquida agregada
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Debe mostrarse el monto de la garantia liquida en la tabla
        await expect(page.getByText('RD$$ 20,000.00')).toBeVisible();

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 6 - Documentos', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=6`);
        
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
        await page.getByRole('button', {name: 'Close'}).click();

        // Subir Solicitud de Prestamo Llena y Firmada
        const subirInstanciaCreditoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '5 SOLICTUD DE PRESTAMO LLENA Y FIRMADA upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirInstanciaCredito = await subirInstanciaCreditoPromesa;
        await subirInstanciaCredito.setFiles(`${firma}`);

        await page.waitForTimeout(3000);

        // Esperar que la Solicitud de Prestamo Llena y Firmada se haya subido
        await expect(page.getByRole('link', {name: 'SOLICTUD DE PRESTAMO LLENA Y FIRMADA'})).toBeVisible();

        // Subir Tabla de amortizacion
        const subirTablaAmortizacionPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '10 TABLA AMORTIZACION upload Cargar delete'}).getByRole('cell', {name: 'upload Cargar'}).locator('button').click();
        const subirTablaAmortizacion = await subirTablaAmortizacionPromesa;
        await subirTablaAmortizacion.setFiles(`${firma}`);

        await page.waitForTimeout(3000);

        // Esperar que la Tabla de Amortizacion se haya subido
        await expect(page.getByRole('link', {name: 'TABLA AMORTIZACION'})).toBeVisible();
    });

    test('Finalizar con la creacion de la Solicitud', async () => {
        // Boton de Finalizar
        const botonFinalizar = page.getByRole('button', {name: 'check Finalizar'});
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();

        // Cerrar las paginas que se abren con los diferentes reportes
        CerrarPaginasReportes();
    });

    test('Agregar una Observacion al Prestamo', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);

        // Cambiar el estado en Aprobado
        await page.locator('text=SOLICITADO').click();
        await page.locator('text=APROBADO').click();

        // Elegir buscar por nombre del socio
        await page.locator(`${buscarPorNombre}`).click();

        // Buscar la solicitud
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

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
        await page.locator('#form_FECHA_ENTREGA').fill(`${diaActualFormato}`);

        // Click a Enter
        await page.keyboard.press('Enter');

        // Click al boton de Aplicar
        await page.getByRole('button', {name: 'Aplicar'}).click();

        // El mensaje de error del departamento no debe aparecer
        await expect(page.locator('text="DEPARTAMENTO" is not allowed')).not.toBeVisible();

        // El modal de Observaciones debe desaparecer
        await expect(modalObservaciones).not.toBeVisible(); 
    });

    test('Marcar como completada la Observacion colocado al Prestamo', async () => {
        // La url debe estar en las solicitudes aprobadas
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=aprobado`);

        // El estado de las solicitudes debe ser Aprobado
        await expect(page.locator('#form').getByText('APROBADO')).toBeVisible();

        // Elegir buscar por nombre del socio
        await page.locator(`${buscarPorNombre}`).click();

        // Buscar la solicitud creada
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

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
        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();

        // La url debe de tener que la solicitud esta en aprobado
        await expect(page).toHaveURL(/\/aprobado/);

        // Esperar que carguen los datos
        await page.waitForTimeout(5000);

        // Debe estar en el primer paso de la solicitud
        await expect(page.getByRole('heading', {name: 'Solicitante', exact: true})).toBeVisible();
        await page.getByRole('heading', {name: 'Solicitante', exact: true}).click({clickCount: 4});
        await page.waitForTimeout(1000);

        await expect(page.getByRole('heading', {name: 'Datos del Solicitante'})).toBeVisible();
        await page.getByRole('heading', {name: 'Datos del Solicitante'}).click({clickCount: 4});
        await page.waitForTimeout(1000);

        await expect(page.getByRole('heading', {name: 'Lugar de Trabajo Solicitante'})).toBeVisible();
        await page.getByRole('heading', {name: 'Lugar de Trabajo Solicitante'}).click({clickCount: 4});
        await page.waitForTimeout(1000);

        // El input con el nombre de la persoan debe estar visible
        const inputNombrePersona = page.locator('#client_form_NOMBRE');
        await expect(inputNombrePersona).toHaveValue(`${nombre} ${apellido}`);
        await inputNombrePersona.click({clickCount: 4});

        // El boton de firma debe estar visible
        const botonVerFirmas = page.locator('text=Ver firmas');
        await expect(botonVerFirmas).toBeVisible();

        // Dirigirse al tercer paso
        const seccionCargos = page.getByRole('button', {name: '3 Cargos Del Préstamo'});
        await expect(seccionCargos).toBeVisible();
        await seccionCargos.click();

        // El titulo del tercer paso debe estar visible
        await expect(page.getByRole('heading', {name: 'CARGOS'})).toBeVisible();

        // Esperar que se muestre que no hay datos en la tabla
        await page.waitForTimeout(1000);

        // En la tabla no deben de haber datos
        await expect(page.locator(`text=${noData}`)).toBeVisible();
    
        // Dirigirse a la ultima seccion
        const seccionDesembolso = page.getByRole('button', {name: '7 Desembolso'});
        await expect(seccionDesembolso).toBeVisible();
        await seccionDesembolso.click();

        // Esperar que cargue la pagina
        await page.waitForTimeout(2000);

        // El nombre y el apellido del socio deben estar visibles 
        await expect(page.getByText(`Socio: ${nombre} ${apellido}`)).toBeVisible();
        
        // La fecha de solicitud dee estar visible y ser la fecha actual
        await expect(page.locator(`${fechaSolicitudCredito}`)).toHaveValue(`${diaActualFormato}`);

        // El usuario que aprobro debe estar visible
        await expect(page.locator(`${usuarioAproboSolicitud}`)).toHaveValue(`${userCorrectoUpperCase}`);

        // EL boton de Imprimir Solicitud debe estar visible
        const botonImprimirContrato = page.getByRole('button', {name: 'Imprimir Contrato'});
        await expect(botonImprimirContrato).toBeVisible();

        // Debe estar visible una tabla con los datos del prestamo
        await expect(page.getByText(`RD$ ${cantMonto}`).first()).toBeVisible();
        await expect(page.getByText('RD$ 877.43')).toBeVisible();
        await expect(page.getByText('Plazo:24 Meses')).toBeVisible();
        await expect(page.getByText('Tasa:5.00%')).toBeVisible();
        await expect(page.getByText('DEPOSITO A CUENTA')).toBeVisible();
        await expect(page.getByText('Tipo de Crédito:CONSUMO')).toBeVisible();
        //await expect(page.getByText('Oferta:CRÉDITO GERENCIAL / AHORROS -1M')).toBeVisible();
        await expect(page.getByText('Grupo:SIN GARANTIA')).toBeVisible();

        // La tabla de cuentas de cobros debe estar visible
        await expect(page.getByRole('row', {name: 'Principal Tipo de cuenta No. Cuenta Titular Acciones'})).toBeVisible();

        // La cuenta de cobro debe estar visible
        await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Esperar 5 segundos
        await page.waitForTimeout(5000);

        // Monto a desembolsar
        const montoDesembolsar = page.getByText(`RD$ ${cantMonto}`).nth(1);

        // El monto a desembolsar debe estar visible
        if (await montoDesembolsar.isVisible()) {
            // Mostrar el monto a desembolsar
            await montoDesembolsar.click({clickCount: 4});

            // Desembolsar la solicitud
            const botonDesembolsar = page.getByRole('button', {name: 'Desembolsar'});
            await botonDesembolsar.scrollIntoViewIfNeeded();
            await expect(botonDesembolsar).toBeVisible();
            await botonDesembolsar.click();

            // Cerrar las paginas que se abren con los diferentes reportes
            CerrarPaginasReportes();

        } else {
            // Volver al paso anterior
            await page.getByRole('button', {name: 'Anterior'}).click();

            // La URL debe cambiar
            await expect(page).toHaveURL(/\/?step=6/);

            // Esperar que la pagina cargue
            await page.waitForTimeout(3000);

            // Volver al paso 10
            await page.getByRole('button', {name: 'Siguiente'}).click();

            // La URL debe cambiar
            await expect(page).toHaveURL(/\/?step=7/);

            // Esperar que la pagina cargue
            await page.waitForTimeout(6000);

            // Mostrar el monto a desembolsar
            await montoDesembolsar.click({clickCount: 4});

            // Desembolsar la solicitud
            const botonDesembolsar = page.getByRole('button', {name: 'Desembolsar'});
            await botonDesembolsar.scrollIntoViewIfNeeded();
            await expect(botonDesembolsar).toBeVisible();
            await botonDesembolsar.click();

            // Cerrar las paginas que se abren con los diferentes reportes
            CerrarPaginasReportes();
        };
    });

    test('Buscar la Solicitud de Credito en estado Desembolsado', async () => {
        // La url debe regresar a las solicitudes en proceso
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=aprobado`);

        // Cambiar el estado de las solicitudes de En Proceso a Aprobado
        await page.locator('text=APROBADO').click();
        await page.locator('text=DESEMBOLSADO').click();

        // Esperar que la pagina cargue
        await page.waitForTimeout(3000);

        // Elegir buscar por nombre del socio
        await page.locator(`${buscarPorNombre}`).click();

        // Buscar la solicitud creada
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Esperar que se muestre la solicitud buscada
        await page.waitForTimeout(3000);

        // La solicitud de credito desembolsada debe estar visible
        await expect(page.getByRole('row', {name: 'CRÉDITO GERENCIAL / AHORROS -1M'})).toBeVisible();
    });

    test('Guardar el codigo del prestamo en el state', async () => {
        // Copiar el codigo de la cuenta
        await page.getByRole('row', {name: 'CRÉDITO GERENCIAL / AHORROS -1M'}).getByRole('cell').nth(0).click({clickCount: 4});
        await page.locator('body').press('Control+c');

        // Eelgir buscar por id prestamo
        await page.locator('(//INPUT[@type="radio"])[1]').click();
        await page.waitForTimeout(2000);

        // Buscar el prestamo por el codigo
        await page.locator(`${formBuscar}`).clear();
        await page.locator(`${formBuscar}`).press('Control+v');
        await page.locator(`${formBuscar}`).press('Backspace');

        // Esperar que se muestre el prestamo buscado
        await page.waitForTimeout(2000);

        // El prestamo debe estar visible en la tabla
        let idPrestamo = await page.locator(`${formBuscar}`).getAttribute('value');
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
        await expect(page.getByRole('row', {name: 'CRÉDITO GERENCIAL / AHORROS -1M'})).toBeVisible();

        // Guardar el codigo del prestamo en el state
        await page.evaluate((idPrestamo) => window.localStorage.setItem('codigoPrestamoAhorro', `${idPrestamo}`), `${idPrestamo}`);
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Guardar nuevamente el Storage con el codigo del prestamo
        await context.storageState({path: 'state.json'});
        
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
