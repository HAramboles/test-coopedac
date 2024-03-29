import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { 
    dataCerrar, 
    selectBuscar, 
    inputFechaSolicitud, 
    inputPrimerPago, 
    fechaSolicitudCredito, 
    usuarioAproboSolicitud, 
    dataVer, 
    formBuscar,
    buscarPorNombre,
    crearBuscarPorCedula
} from './utils/data/inputsButtons';
import { unMesDespues, diaSiguiente, diaAnterior, diaActualFormato } from './utils/functions/fechas';
import { url_base, url_solicitud_credito } from './utils/dataPages/urls';
import { generarLetrasAleatorias, generarNumerosAleatorios } from './utils/functions/functionsRandom';
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
const cantMonto:string = '125,000';

// Numeros para la garantia de vehiculos
let numerosChasis = (generarLetrasAleatorias() + generarNumerosAleatorios(4))
let numerosPlaca = (generarLetrasAleatorias() + generarNumerosAleatorios(4))

// Pruebas
test.describe.serial('Pruebas con la Solicitud de Credito - Crediautos - Persona Juridica', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
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
        await page.locator(`text=${nombre} ${apellido}`).click();

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
        // Click a credito consumo
        await page.getByText('CONSUMO').click();

        // Tipo de garantia
        await page.getByLabel('Tipo Garantía').click();
        // Click en garantia prendarias
        await page.getByText('PRENDARIAS').click();

        // Oferta
        await page.getByLabel('Oferta').click();
        // Elegir credito crediautos
        await page.getByText('CRÉDIAUTOS', {exact: true}).click();

        // Grupo
        await page.getByLabel('Grupo').click();
        await page.getByLabel('Grupo').fill('vegamovil');
        // Elegir grupo vegamovil
        await page.getByRole('option', {name: 'VEGAMOVIL', exact: true}).click();

        // Esperar tres segundos
        await page.waitForTimeout(3000);

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

        // El tipo de cuota debe ser Insoluto
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
        await page.locator('#loan_form_MONTO').fill(cantMonto);

        // Tasa
        const campoTasa = page.getByLabel('Tasa');
        await expect(campoTasa).toHaveValue('15.64%');

        // Plazo
        await page.getByPlaceholder('CANTIDAD').click();
        await page.getByPlaceholder('CANTIDAD').fill('60');

        // Los plazos deben ser mensuales
        await expect(page.locator('text=MENSUAL')).toBeVisible();

        // Agregar un Proveedor
        await page.locator('#loan_form_ID_PROVEEDOR').click();
        // Eleghir Vegamovil como proveedor
        await page.getByText('Vegamovil, S.R.L').click();

        // Agregar una cuenta del proveedor para desembolsar
        await page.locator(`${selectBuscar}`).first().click();
        // Seleccionar una cuenta de ahorros del proveedor
        await page.getByText('AHORROS NORMALES | 00100100050126').click();

        // Finalidad
        await page.getByLabel('Finalidad').click();
        // Elegir propiedad o vivienda
        await page.getByRole('option', {name: 'PRENDARIO'}).click();

        // Destino o proposito
        await page.getByPlaceholder('Destino o propósito').click();
        await page.getByPlaceholder('Destino o propósito').fill('Prestamo para Vehiculos');

        // Los valores del monto, tasa y plazo deben estar correctos
        await expect(page.locator('#loan_form_MONTO')).toHaveValue(`RD$ ${cantMonto}`);
        await expect(page.locator('#loan_form_TASA')).toHaveValue('15.64%');
        await expect(page.locator('#loan_form_PLAZO')).toHaveValue('60');

        // Via desembolso
        await expect(page.getByText('Vía Desembolso')).toBeVisible();

        // El monto de la cuota debe estar visible
        const inputCuota = page.locator('#loan_form_CUOTA');
        await expect(inputCuota).toHaveValue('RD$ 3,015.9');

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

        // Agregar Abonos Programados
        const seccionAbonosProgramados = page.locator('text=Abonos Programados');
        await expect(seccionAbonosProgramados).toBeVisible();
        await seccionAbonosProgramados.click();

        // Mensaje de informacion de Abonos Programados
        await expect(page.locator('text=Al agregar pagos extraordinarios a la solicitud la cuota podría variar')).toBeVisible();

        // Tipo de Abono
        await expect(page.locator('text=Recurrente')).toBeVisible();
        const abonoParcial = page.locator('text=Parcial');
        await expect(abonoParcial).toBeVisible();

        // Click a la opcion de abono parcial
        await abonoParcial.click();

        // No. Cuota
        await page.locator('#form_NO_CUOTA').fill('60');

        // Monto del abono
        await page.locator('#form_MONTO_ABONOS').fill('50000');

        // Click al boton de Agregar Abono
        const botonAgregarAbono = page.getByRole('button', {name: 'plus Agregar', exact: true});
        await expect(botonAgregarAbono).toBeVisible();
        await botonAgregarAbono.click();

        // Se debe agregar el abono en la tabla de abonos
        await expect(page.getByRole('cell', {name: '60'})).toBeVisible();
        await expect(page.getByRole('cell', {name: '50,000'})).toBeVisible();

        // La cuota debe calcularse nuevamente
        await expect(page.getByText('Calculando Cuotas')).toBeVisible();

        // Click en algun lugar de la pagina
        await tituloPrincipal.click();

        // La cuota debe cambiar al agregarse un abono programado
        await expect(inputCuota).toHaveValue('RD$ 2,461.21');

        // Cerrar y abrir la seccion de Abonos programados
        await seccionAbonosProgramados.click();
        await page.waitForTimeout(2000);
        await seccionAbonosProgramados.click();

        // El abono programado agregado debe estar visible
        await expect(page.getByRole('cell', {name: '60'})).toBeVisible();
        await expect(page.getByRole('cell', {name: '50,000'})).toBeVisible();

        // Click en guardar y continuar
        GuardaryContinuar();
    });

    test('Paso 3 - Cargos del prestamo', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=3`);

        // El titulo principal debe estar visible
        await expect(page.getByRole('heading', {name: 'CARGOS'})).toBeVisible();

        // Debe de haber un cargo
        await expect(page.getByRole('row', {name: 'CONTRATO'})).toBeVisible();

        // Click al boton de Guardar Cargos
        await page.getByRole('button', {name: 'Guardar Cargos'}).click();

        // Debe mostrarse una alerta de que los cargos se han guardado
        await expect(page.locator('text=Cargos del préstamo guardados exitosamente.')).toBeVisible();

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

    test('Paso 5 - Perfil Financiero', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=5`);

        // Las tres secciones del paso 5 deben estar visibles
        await expect(page.locator('text=ESTADO DE SITUACION')).toBeVisible();
        await expect(page.locator('text=ESTADO DE RESULTADOS')).toBeVisible();
        await expect(page.locator('text=FLUJO DE EFECTIVO')).toBeVisible();

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 6 - Representantes legales', async () => {
        // El titulo principal debe estar visible
        await expect(page.getByRole('heading', {name: 'REPRESENTANTES LEGALES'})).toBeVisible();
        
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=6`);

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 7 - Codeudores y Garantias', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=7`);

        // Click al boton de agregar garantia
        await page.getByRole('button', {name: 'Agregar Garantía'}).click();

        // Debe salir un modal
        await expect(page.locator('text=SELECCIONAR OPCIÓN')).toBeVisible();

        // Click a la opcion de nueva garantia
        await page.locator('text=Nueva garantía').click();

        // Debe salir un modal para agregar la garantia y elegir el tipo de garantia
        await page.getByRole('combobox').click();
        await page.getByText('GARANTIA VEHICULO', {exact: true}).click();

        // Elegir que el socio es propietario de la garantia
        await page.getByRole('checkbox').click();

        // Luego de seleccionar que el socio es el propietario de la garantia debe salir su nombre
        await expect(page.locator(`text=${nombre} ${apellido}`)).toBeVisible();

        // Valor tasado
        const valorTasado = page.getByPlaceholder('VALOR TASADO');
        await valorTasado.click();
        await valorTasado.fill('RD$ 125000');

        // Agregar atributos a la garantia
        await expect(page.locator('text=ATRIBUTOS DE LA GARANTÍA')).toBeVisible();

        // Chasis
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(0).click();
        await page.getByPlaceholder('Valor Atributo').fill(`${numerosChasis}`);

        // Placa
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(0).click();
        await page.getByPlaceholder('Valor Atributo').fill(`${numerosPlaca}`);

        // Modelo
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(1).click();
        await page.getByPlaceholder('Valor Atributo').fill('350Z');

        // Marca
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(2).click();
        await page.getByPlaceholder('Valor Atributo').fill('NISSAN');

        // Click en guardar
        await page.getByRole('button', {name: 'save Guardar'}).click();

        // Esperar a que cargue la pagina
        await page.waitForTimeout(3000);

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 8 - Referencias', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=8`);

        // Los tres titulos deben estar visibles
        await expect(page.getByText('Familiares mas Cercanos')).toBeVisible();
        await expect(page.getByText('Referencias Morales o Personales')).toBeVisible();
        await expect(page.getByText('Referencias Comerciales')).toBeVisible();

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 9 - Documentos', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=9`);

        // El boton de agregar documentos debe estar visible
        await expect(page.getByRole('button', {name: 'Agregar documentos'})).toBeVisible();

        // Subir Cedula del Deudor
        const subirCedulaDeudorPromesa = page.waitForEvent('filechooser');
        await page.getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirCedulaDeudor = await subirCedulaDeudorPromesa;
        await subirCedulaDeudor.setFiles(`${firma}`);

        // Esperar que la Cedula se haya subido
        await expect(page.getByRole('link', {name: 'CEDULA DEUDOR'})).toBeVisible();

        // Subir el Informe Buro Credito (DataCredito)
        const subirInformeBuroCreditoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '3 INFORME BURO CREDITO (DATACREDITO) upload Cargar delete'}).getByRole('cell', {name: 'upload Cargar'}).locator('button').click();
        const subirInformeBuroCredito = await subirInformeBuroCreditoPromesa;
        await subirInformeBuroCredito.setFiles(`${firma}`);

        // Cerrar la alerta que se genera al subir la imagen
        await page.locator(`${dataCerrar}`).last().click();

        // Esperar que el Informe Buro Credito (DataCredito) se haya subido
        await expect(page.getByRole('link', {name: 'INFORME BURO CREDITO (DATACREDITO)'})).toBeVisible();

        // Subir el Evidencia de Ingresos
        const subirEvidenciaIngresosPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '4 EVIDENCIA DE INGRESOS upload Cargar delete'}).getByRole('cell', {name: 'upload Cargar'}).locator('button').click();
        const subirEvidenciaIngresos = await subirEvidenciaIngresosPromesa;
        await subirEvidenciaIngresos.setFiles(`${firma}`);

        // Cerrar la alerta que se genera al subir la imagen
        await page.locator(`${dataCerrar}`).last().click();

        // Esperar que el Informe Buro Credito (DataCredito) se haya subido
        await expect(page.getByRole('link', {name: 'EVIDENCIA DE INGRESOS'})).toBeVisible();

        // Subir Solicitud de Prestamo Llena y Firmada
        const subirSolicitudPrestamoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '5 SOLICTUD DE PRESTAMO LLENA Y FIRMADA upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirSolicitudPrestamo = await subirSolicitudPrestamoPromesa;
        await subirSolicitudPrestamo.setFiles(`${firma}`);

        // Esperar que la Solicitud de Prestamo Llena y Firmada se haya subido
        await expect(page.locator('text=Documentos requerdios del préstamo guardados exitosamente.').last()).toBeVisible();

        // Cerrar la alerta que se genera al subir la imagen
        await page.locator(`${dataCerrar}`).last().click();

        // Esperar que el Informe Buro Credito (DataCredito) se haya subido
        await expect(page.getByRole('link', {name: 'EVIDENCIA DE INGRESOS'}).first()).toBeVisible();

        // Subir Tabla de amortizacion
        const subirTablaAmortizacionPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '10 TABLA AMORTIZACION upload Cargar delete'}).getByRole('cell', {name: 'upload Cargar'}).locator('button').click();
        const subirTablaAmortizacion = await subirTablaAmortizacionPromesa;
        await subirTablaAmortizacion.setFiles(`${firma}`);

        // Cerrar la alerta que se genera al subir la imagen
        await page.locator(`${dataCerrar}`).last().click();

        // Esperar que la Tabla de Amortizacion se haya subido
        await expect(page.getByRole('link', {name: 'TABLA AMORTIZACION'})).toBeVisible();

        // Subir Contrato
        const subirContratoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '11 CONTRATO upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirContrato = await subirContratoPromesa;
        await subirContrato.setFiles(`${firma}`);

        // Cerrar la alerta que se genera al subir la imagen
        await page.locator(`${dataCerrar}`).last().click();

        // Esperar que el Contrato se haya subido
        await expect(page.getByRole('link', {name: 'CONTRATO'})).toBeVisible();

        // Esperar que todos los documentos se hayan subido
        await page.waitForTimeout(3000);   

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

        // Cerrar las paginas que se abren con los diferentes reportes
        CerrarPaginasReportes();
    });

    test('Cambiar el estado de la Solicitud de Solicitado a En Proceso (Analisis)', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);

        // Elegir buscar por nombre del socio
        await page.locator(`${buscarPorNombre}`).click();

        // Buscar la solicitud creada
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

        // La url debe de tener que la solicitud esta en estado solicitado
        await expect(page).toHaveURL(/\/solicitado/);
        
        // Ir a la ultima seccion 
        const seccionDocumentos = page.getByRole('button', {name: '9 Documentos'});
        await expect(seccionDocumentos).toBeVisible();
        await seccionDocumentos.click();

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

        // Cerrar las paginas que se abren con los diferentes reportes
        CerrarPaginasReportes();
    });

    test('Cambiar el estado de la Solicitud de En Proceso (Analisis) a Aprobado', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);

        // Cambiar el estado de las solicitudes de Solicitado a En Proceso (Analisis)
        await page.locator('text=SOLICITADO').click();
        await page.locator('text=EN PROCESO (ANALISIS)').click();

        // Elegir buscar por nombre del socio
        await page.locator(`${buscarPorNombre}`).click();

        // Buscar la solicitud creada
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // La solicitud buscada debe estar visible
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

        // Esperar que cargue la pagina
        await page.waitForTimeout(5000);

        // Debe estar en el primer paso de la solicitud
        await expect(page.getByRole('heading', {name: 'Solicitante', exact: true})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Datos del Solicitante'})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Lugar de Trabajo Solicitante'})).toBeVisible();

        // Esperar que cargue la pagina
        await page.waitForTimeout(3000);

        // Dirigirse a la ultima seccion
        const seccionAnalisis = page.getByRole('button', {name: '10 Análisis'});
        await expect(seccionAnalisis).toBeVisible();
        await seccionAnalisis.click();

        // El titulo de proceso, analisis debe estar visible
        await expect(page.getByRole('heading', {name: '(EN PROCESO (ANALISIS))'})).toBeVisible();

        // El nombre de la persona debe estar visible en un titulo
        await expect(page.getByRole('heading', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Esperar a que la pagina cargue
        await page.waitForTimeout(2000);

        // Agregar un comentario
        const campoComentario = page.getByPlaceholder('Comentario');
        await campoComentario.click();
        await page.waitForTimeout(1000);
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

        // Cerrar las paginas que se abren con los diferentes reportes
        CerrarPaginasReportes();
    });

    test('Desembolsar la solicitud', async () => {
        // La url debe regresar a las solicitudes en proceso
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=en_proceso__analisis`);

        // Cambiar el estado de las solicitudes de En Proceso a Aprobado
        await page.locator('text=EN PROCESO (ANALISIS)').click();
        await page.locator('text=APROBADO').click();

        // Elegir buscar por nombre del socio
        await page.locator(`${buscarPorNombre}`).click();

        // Buscar la solicitud creada
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // La solicitud buscada debe estar visible
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();

        // La url debe de tener que la solicitud esta en aprobado
        await expect(page).toHaveURL(/\/aprobado/);

        // Esperar que carguen los datos
        await page.waitForTimeout(5000);

        // Dirigirse a la ultima seccion
        const seccionDesembolso = page.getByRole('button', {name: '10 Desembolso'});
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

        // Debe estar visible una tabla con los datos del prestamo
        await expect(page.getByText(`RD$ ${cantMonto}`).first()).toBeVisible();
        await expect(page.getByText('RD$ 2,461.21')).toBeVisible();
        await expect(page.getByText('Plazo:60 Meses')).toBeVisible();
        await expect(page.getByText('Tasa:15.64%')).toBeVisible();
        await expect(page.getByText('DEPOSITO A CUENTA')).toBeVisible();
        await expect(page.getByText('Tipo de Crédito:CONSUMO')).toBeVisible();
        //await expect(page.getByText('Oferta:CRÉDIAUTOS')).toBeVisible();
        await expect(page.getByText('Grupo:VEGAMOVIL')).toBeVisible();

        // La cuenta de cobro debe estar visible
        await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // EL boton de Imprimir Solicitud debe estar visible
        const botonImprimirContrato = page.getByRole('button', {name: 'Imprimir Contrato'});
        await expect(botonImprimirContrato).toBeVisible();

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
            await expect(botonDesembolsar).toBeVisible();
            await botonDesembolsar.scrollIntoViewIfNeeded();
            await botonDesembolsar.click();

            // Cerrar las paginas que se abren con los diferentes reportes
            CerrarPaginasReportes();

        } else {
            // Volver al paso anterior
            await page.getByRole('button', {name: 'Anterior'}).click();

            // La URL debe cambiar
            await expect(page).toHaveURL(/\/?step=9/);

            // Esperar que la pagina cargue
            await page.waitForTimeout(3000);

            // Volver al paso 10
            await page.getByRole('button', {name: 'Siguiente'}).click();

            // La URL debe cambiar
            await expect(page).toHaveURL(/\/?step=10/);

            // Esperar que la pagina cargue
            await page.waitForTimeout(3000);

            // Mostrar el monto a desembolsar
            await montoDesembolsar.click({clickCount: 4});

            // Desembolsar la solicitud
            const botonDesembolsar = page.getByRole('button', {name: 'Desembolsar'});
            await expect(botonDesembolsar).toBeVisible();
            await botonDesembolsar.scrollIntoViewIfNeeded();
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
        await page.waitForTimeout(6000);

        // La solicitud de credito desembolsada debe estar visible
        await expect(page.getByRole('row', {name: 'CRÉDIAUTOS'})).toBeVisible();
    });

    test('Guardar el codigo del prestamo en el state', async () => {
        // Copiar el codigo de la cuenta
        await page.getByRole('row', {name: 'CRÉDIAUTOS'}).getByRole('cell').nth(0).click({clickCount: 4});
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
        await expect(page.getByRole('row', {name: 'CRÉDIAUTOS'})).toBeVisible();

        // Guardar el codigo del prestamo en el state
        await page.evaluate((idPrestamo) => window.localStorage.setItem('codigoPrestamoCrediauto', `${idPrestamo}`), `${idPrestamo}`);
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
