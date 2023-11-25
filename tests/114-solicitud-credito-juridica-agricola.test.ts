import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { 
    dataCerrar, 
    selectBuscar, 
    formBuscar, 
    inputFechaSolicitud, 
    inputPrimerPago,
    fechaSolicitudCredito,
    usuarioAproboSolicitud,
    dataVer,
    formComentario
} from './utils/data/inputsButtons';
import { unMesDespues, diaSiguiente, diaAnterior, diaActualFormato } from './utils/functions/fechas';
import { url_base, url_solicitud_credito } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { userCorrectoUpperCase } from './utils/data/usuarios';
import { generarNumerosAleatorios } from './utils/functions/functionsRandom';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre de la persona juridica
let cedulaEmpresa: string | null;
let nombreEmpresa: string | null;

// Nombre, apellido de la persona fisica relacionada
let nombrePersona: string | null;
let apellidoPersona: string | null;

// Imagen de los documentos
const firma = './tests/utils/img/firma.jpg';

// Monto solicitado para el prestamo
const cantMonto:string = '300,000';

// Numero garantia agricola
let numerosGarantia:string = generarNumerosAleatorios(4);

// Pruebas
test.describe.serial('Pruebas con la Solicitud de Credito Agricola - Persona Juridica', async () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear la page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula y nombre de la persona juridica almacenada en el state
        cedulaEmpresa = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridica'));
        nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));

        // Nombre y apellido de la persona fisica relacionada almacenada en el state
        nombrePersona = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        apellidoPersona = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));
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

        // Buscar al socio
        await page.locator(`${selectBuscar}`).fill(`${cedulaEmpresa}`);
        // Seleccionar al socio
        await page.locator(`text=${nombreEmpresa}`).click();

        // El nombre de la persona debe estar visible
        await expect(page.locator('h1').filter({hasText: `${nombreEmpresa}`})).toBeVisible();

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
        await page.getByText('COMERCIALES').click();

        // Tipo de garantia
        await page.getByLabel('Tipo Garantía').click();
        // Click en garantia hipotecaria
        await page.getByRole('option', {name: 'CERTIFICADOS'}).click();

        // Oferta
        await page.getByLabel('Oferta').click();
        // Elegir credito hipotecaria
        await page.getByText('CRÉDITO AGRÍCOLA').click();

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

        // El tipo de cuota debe ser Insoluto
        await expect(page.getByText('SOLO INTERES')).toBeVisible();

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
        await expect(campoTasa).toHaveValue('13.95%');

        // Plazo
        await page.getByPlaceholder('CANTIDAD').click();
        await page.getByPlaceholder('CANTIDAD').fill('48');

        // Los plazos deben ser semestrales
        await expect(page.locator('text=SEMESTRAL')).toBeVisible();

        // Agregar una cuenta del socio para desembolsar
        await page.locator(`${selectBuscar}`).first().click();
        // La cuenta de aportaciones no debe estar visible
        await expect(page.locator('span').filter({hasText: 'APORTACIONES'})).not.toBeVisible(); 

        // Seleccionar la cuenta de ahorros
        await page.getByText('AHORROS NORMALES').click();

        // Finalidad
        await page.getByLabel('Finalidad').click();
        // Elegir propiedad o vivienda
        await page.getByRole('option', {name: 'AGROPECUARIO'}).click();

        // Destino o proposito
        await page.getByPlaceholder('Destino o propósito').click();
        await page.getByPlaceholder('Destino o propósito').fill('Iniciar con negocio agricola');

        // Los valores del monto, tasa y plazo deben estar correctos
        await expect(page.locator('#loan_form_MONTO')).toHaveValue(`RD$ ${cantMonto}`);
        await expect(page.locator('#loan_form_TASA')).toHaveValue('13.95%');
        await expect(page.locator('#loan_form_PLAZO')).toHaveValue('48');

        // Via desembolso
        await expect(page.getByText('Vía Desembolso')).toBeVisible();

        // El monto de la cuota debe estar visible
        await expect(page.locator('#loan_form_CUOTA')).toHaveValue('RD$ 20,925');

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
        await expect(page.getByRole('cell', {name: `${nombreEmpresa}`})).toBeVisible();

        // Click en guardar y continuar
        GuardaryContinuar();
    });

    test('Paso 3 - Cargos del prestamo', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=3`);

        // El titulo principal debe estar visible
        await expect(page.getByRole('heading', {name: 'CARGOS'})).toBeVisible();

        // Deben mostrarse dos cargos en la tabla
        await expect(page.getByRole('cell', {name: 'CONTRATO'})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'DATACREDITO'})).toBeVisible();

        // Colocar una cantidad para el cargo Contrato
        const cargoContrato = page.locator('(//td[@class="ant-table-cell montoPorcentajeSolicitud"])').first();
        await cargoContrato.click();
        await page.getByPlaceholder('MONTO O PORCENTAJE').fill('50');

        // Colocar una cantidad para el cargo Contrato
        const cargoDatacredito = page.locator('(//td[@class="ant-table-cell montoPorcentajeSolicitud"])').last();
        await cargoDatacredito.click();
        await page.getByPlaceholder('MONTO O PORCENTAJE').fill('50');

        // Click al boton de Guardar Cargos
        const botonGuardarCargos = page.getByRole('button', {name: 'Guardar Cargos'});
        await expect(botonGuardarCargos).toBeVisible();
        await botonGuardarCargos.click();

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
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=4`);

        // El titulo principal debe estar visible
        await expect(page.locator('text=DEUDAS PENDIENTES')).toBeVisible();

        // Boton de Agregar deudas
        await expect(page.getByRole('button', {name: 'Agregar'})).toBeVisible();

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 5 - Perfil Financiero', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=5`);

        // Las tres secciones del paso 5 deben estar visibles
        await expect(page.locator('text=ESTADO DE SITUACION')).toBeVisible();
        await expect(page.locator('text=ESTADO DE RESULTADOS')).toBeVisible();
        await expect(page.locator('text=FLUJO DE EFECTIVO')).toBeVisible();

        // Colocar un monto en el campo de Total Ingresos
        await page.getByText('RD$ 0.00').first().click();
        await page.getByPlaceholder('MONTO').fill('RD$ 500000');

        await page.waitForTimeout(2000);

        // Click fuera del input
        await page.getByText('TOTAL INGRESOS').click();

        // Esperar que se actualice los ingresos
        await page.waitForTimeout(2000);

        // Colocar un monto en el campo de Total Gastos
        await page.getByText('RD$ 0.00').first().click();
        await page.getByPlaceholder('MONTO').fill('RD$ 150000');

        // Click fuera del input
        await page.getByText('TOTAL INGRESOS').click();

        // Esperar que se actualice los gastos
        await page.waitForTimeout(2000);

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 6 - Representantes legales', async () => {
        // El titulo principal debe estar visible
        await expect(page.getByRole('heading', {name: 'REPRESENTANTES LEGALES'})).toBeVisible();
        
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=6`);

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 7 - Codeudores y Garantias', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=7`);

        // // Titulo de Coedudores
        // await expect(page.locator('h1').filter({hasText: 'CODEUDORES'})).toBeVisible();

        // // Click al boton de Agregar Codeudor
        // const botonCodeudor = page.getByRole('button', {name: 'Agregar Codeudor'});
        // await expect(botonCodeudor).toBeVisible();
        // await botonCodeudor.click();

        // // Se abre un modal
        // const modal = page.locator('text=SELECCIONAR RELACIONADO');
        // await expect(modal).toBeVisible();

        // // Buscar a la persona fisica
        // await page.locator(`${formBuscar}`).fill(`${nombrePersona} ${apellidoPersona}`);

        // // Click a la opcion de la persona buscada
        // await page.getByText(`${nombrePersona} ${apellidoPersona}`).click();

        // // Se abre un modal colocar el tipo de relacion
        // await expect(page.locator('text=SELECCIONAR TIPO DE RELACIÓN')).toBeVisible();

        // // Click al tipo de relacion
        // await page.getByRole('combobox').click();

        // // Elegir la opcion de codeudor
        // await page.getByRole('option', {name: 'CO-DEUDOR(A)'}).click();

        // // Click al boton de Aceptar
        // await page.getByRole('button', {name: 'Aceptar'}).click();

        // // Debe aparecer una alerta de operacion exitosa
        // await expect(page.locator('text=Relacionados guardados exitosamente.')).toBeVisible();

        // await page.getByText('Agregar', {exact: true}).click();

        // // Cerrar el modal
        // await page.getByRole('button', {name: 'close', exact: true}).click();

        // // El modal no debe estar visible
        // await expect(modal).not.toBeVisible();

        // // Click al boton de agregar garantia
        // await page.getByRole('button', {name: 'Agregar Garantía'}).click();

        // // Debe salir un modal
        // await expect(page.locator('text=SELECCIONAR OPCIÓN')).toBeVisible();

        // // Click a la opcion de nueva garantia
        // await page.locator('text=Nueva garantía').click();

        // // Debe salir un modal para agregar la garantia
        // const modalGarantia = page.locator('#form').getByRole('heading', {name: 'Garantías'});
        // await expect(modalGarantia).toBeVisible();

        // // Debe salir un modal para agregar la garantia y elegir el tipo de garantia
        // await page.getByRole('combobox').click();
        // await page.getByText('GARANTIA AGRICOLA', {exact: true}).click();

        // // Elegir que el socio es propietario de la garantia
        // await page.getByRole('checkbox').click();

        // // Luego de seleccionar que el socio es el propietario de la garantia debe salir su nombre
        // await expect(page.locator(`text=${nombreEmpresa}`)).toBeVisible();

        // // Valor tasado
        // const valorTasado = page.getByPlaceholder('VALOR TASADO');
        // await valorTasado.click();
        // await valorTasado.fill('RD$ 200000');

        // // Agregar atributos a la garantia
        // await expect(page.locator('text=ATRIBUTOS DE LA GARANTÍA')).toBeVisible();

        // // Chasis
        // await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(0).click();
        // await page.getByPlaceholder('Valor Atributo').fill(`${numerosGarantia}`);

        // // Click en guardar
        // await page.getByRole('button', {name: 'save Guardar'}).click();

        // // El modal de agregar Garantias debe cerrarse
        // await expect(modalGarantia).not.toBeVisible();

        // Debe mostrarse un mensaje de informacion acerca de la garantia liquida
        await expect(page.getByText('Si agrega más de una garantia tenga en cuanta que estas se despignoran en el mismo orden que son agregadas.')).toBeVisible();

        // Click al boton de agregar garantia liquida
        await page.getByRole('button', {name: 'Agregar Garantia Liquida'}).click();

        // Debe salir un modal para agregar la garantia liquida
        await expect(page.getByRole('heading', {name: 'Agregar Garantía Líquida'}).first()).toBeVisible();

        // El modal debe tener por defecto, el tipo de cuenta Ahorros Normales
        await expect(page.getByText('CERTIFICADOS').first()).toBeVisible();

        // Click al selector para buscar socios
        await page.locator(`${selectBuscar}`).nth(1).click();

        // Debe mostrarse la cuenta de Ahorros Normales de la persona
        const cuentaAhorros = page.getByRole('option', {name: 'FINANCIEROS REINVERTIDAS'});
        await expect(cuentaAhorros).toBeVisible();
        // Click a la opcion de la cuenta de ahorros de la persona
        await cuentaAhorros.click();

        // Se debe agregar la cuenta seleccionada
        await expect(page.locator('#form_TIPO_CUENTA_DESC').first()).toHaveValue('FINANCIEROS REINVERTIDAS');

        // Ingresar el monto a utilizar
        const inputMontoPrestamo = page.getByRole('spinbutton', {name: 'VALOR DE LA GARANTÍA'});
        await inputMontoPrestamo.clear();
        await inputMontoPrestamo.fill('100000');

        // Click fuera del input y al mismo tiempo debe mostrarse el monto maximo a utilizar
        await page.locator('text=El monto máximo utilizable es').nth(1).click();

        // Click al boton de Aceptar del modal
        const botonAceptarModal = page.getByRole('button', {name: 'Aceptar'}).nth(1);
        await expect(botonAceptarModal).toBeVisible();
        await botonAceptarModal.click();

        // Debe agregarse la cuenta de la garantia liquida agregada
        await expect(page.getByRole('cell', {name: `${nombreEmpresa}`})).toBeVisible();

        // Debe mostrarse el monto de la garantia liquida en la tabla
        await expect(page.getByText('RD$$ 100,000.00')).toBeVisible();

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 8 - Referencias', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=8`);

        // Los tres titulos deben estar visibles
        await expect(page.getByText('Familiares mas Cercanos')).toBeVisible();
        await expect(page.getByText('Referencias Morales o Personales')).toBeVisible();
        const tituloReferenciasComerciales = page.getByText('Referencias Comerciales');
        await expect(tituloReferenciasComerciales).toBeVisible();

        // // Click al titulo de Referencias Comerciales
        // await tituloReferenciasComerciales.click();

        // // Se muestra la persona agregada como codeudor
        // await expect(page.getByRole('cell', {name: `${nombrePersona} ${apellidoPersona}`})).toBeVisible();

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 9 - Documentos', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=9`);

        // Subir Informe de Buro Credito
        const subirBuroCreditoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '3 INFORME BURO CREDITO (DATACREDITO) upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirBuroCredito = await subirBuroCreditoPromesa;
        await subirBuroCredito.setFiles(`${firma}`);

        await page.waitForTimeout(3000);

        // Esperar que el Buro Credito se haya subido
        await expect(page.getByRole('link', {name: 'INFORME BURO CREDITO (DATACREDITO)'})).toBeVisible();

        // Cerrar la alerta que se genera al subir la imagen
        await page.locator(`${dataCerrar}`).last().click();

        // Subir Solicitud de Prestamo Llena y Firmada
        const subirCartaPrestamoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '5 SOLICTUD DE PRESTAMO LLENA Y FIRMADA upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirCartaPrestamo = await subirCartaPrestamoPromesa;
        await subirCartaPrestamo.setFiles(`${firma}`);

        // Esperar que la Solicitud de Prestamo Llena y Firmada se haya subido
        await expect(page.locator('text=Documentos requerdios del préstamo guardados exitosamente.').last()).toBeVisible();

        // Cerrar la alerta que se genera al subir la imagen
        await page.locator(`${dataCerrar}`).last().click();

        // Subir Tabla de amortizacion
        const subirTablaAmortizacionPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '10 TABLA AMORTIZACION upload Cargar delete'}).getByRole('cell', {name: 'upload Cargar'}).locator('button').click();
        const subirTablaAmortizacion = await subirTablaAmortizacionPromesa;
        await subirTablaAmortizacion.setFiles(`${firma}`);

        await page.waitForTimeout(3000);

        // Esperar que la Tabla de Amortizacion se haya subido
        await expect(page.locator('text=Documentos requerdios del préstamo guardados exitosamente.').last()).toBeVisible();

        // Subir Contrato
        const subirContratoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '11 CONTRATO upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirContrato = await subirContratoPromesa;
        await subirContrato.setFiles(`${firma}`);

        // Cerrar la alerta que se genera al subir la imagen
        await page.locator(`${dataCerrar}`).last().click();

        // Esperar que el Contrato se haya subido
        await expect(page.getByRole('link', {name: 'CONTRATO'})).toBeVisible();
        
        // Subir Pagare Notarial
        const subirPagareNotarialPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '12 PAGARE NOTARIAL upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirPagareNotarial = await subirPagareNotarialPromesa;
        await subirPagareNotarial.setFiles(`${firma}`);  

        await page.waitForTimeout(3000);

        // Esperar que el Pagare Notarial se haya subido
        await expect(page.getByRole('link', {name: 'PAGARE NOTARIAL'})).toBeVisible();
        
        // Subir Instancia de credito llena y firmada
        const subirInstanciaCreditoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '13 INSTANCIA DE CREDITO LLENA Y FIRMADA upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirInstanciaCredito = await subirInstanciaCreditoPromesa;
        await subirInstanciaCredito.setFiles(`${firma}`);

        await page.waitForTimeout(3000);

        // Esperar que la Instancia de Credito se haya subido
        await expect(page.getByRole('link', {name: 'INSTANCIA DE CREDITO LLENA Y FIRMADA'})).toBeVisible();
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
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);

        // Buscar la solicitud creada
        await page.locator(`${formBuscar}`).fill(`${nombreEmpresa}`);

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombreEmpresa}`}).getByRole('button', {name: 'edit'}).click();

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
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);

        // Cambiar el estado de las solicitudes de Solicitado a En Proceso (Analisis)
        await page.locator('text=SOLICITADO').click();
        await page.locator('text=EN PROCESO (ANALISIS)').click();

        // Buscar la solicitud creada
        await page.locator(`${formBuscar}`).fill(`${nombreEmpresa}`);

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombreEmpresa}`}).getByRole('button', {name: 'edit'}).click();

        // Dirigirse a la ultima seccion
        const seccionAnalisis = page.getByRole('button', {name: '10 Análisis'});
        await expect(seccionAnalisis).toBeVisible();
        await seccionAnalisis.click();

        // El titulo de proceso, analisis debe estar visible
        await expect(page.getByRole('heading', {name: '(EN PROCESO (ANALISIS))'})).toBeVisible();

        // El nombre de la persona debe estar visible en un titulo
        await expect(page.getByRole('heading', {name: `${nombreEmpresa}`})).toBeVisible();

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

        // Cerrar las paginas que se abren con los diferentes reportes
        CerrarPaginasReportes();
    });

    test('Desembolsar la solicitud', async () => {
        // La url debe regresar a las solicitudes en proceso
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=en_proceso__analisis`);

        // Cambiar el estado de las solicitudes de En Proceso a Aprobado
        await page.locator('text=EN PROCESO (ANALISIS)').click();
        await page.locator('text=APROBADO').click();

        // Buscar la solicitud creada
        await page.locator(`${formBuscar}`).fill(`${nombreEmpresa}`);

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombreEmpresa}`}).getByRole('button', {name: 'eye'}).click();

        // La url debe de tener que la solicitud esta en aprobado
        await expect(page).toHaveURL(/\/aprobado/);

        // Esperar que carguen los datos
        await page.waitForTimeout(10000);

        // Dirigirse a la ultima seccion
        const seccionDesembolso = page.getByRole('button', {name: '10 Desembolso'});
        await expect(seccionDesembolso).toBeVisible();
        await seccionDesembolso.click();

        // Esperar que cargue la pagina
        await page.waitForTimeout(2000);

        // El nombre y el apellido del socio deben estar visibles 
        await expect(page.getByText(`Socio: ${nombreEmpresa}`)).toBeVisible(); 

        // La fecha de solicitud dee estar visible y ser la fecha actual
        await expect(page.locator(`${fechaSolicitudCredito}`)).toHaveValue(`${diaActualFormato}`);

        // El usuario que aprobro debe estar visible
        await expect(page.locator(`${usuarioAproboSolicitud}`)).toHaveValue(`${userCorrectoUpperCase}`);

        // EL boton de Imprimir Solicitud debe estar visible
        const botonImprimirContrato = page.getByRole('button', {name: 'Imprimir Contrato'});
        await expect(botonImprimirContrato).toBeVisible();

        // La tabla de cuentas de cobros debe estar visible
        await expect(page.getByRole('row', {name: 'Principal Tipo de cuenta No. Cuenta Titular Acciones'})).toBeVisible();

        // La cuenta de cobro debe estar visible
        await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombreEmpresa}`})).toBeVisible();

        // El monto a desembolsar debe estar visible
        await expect(page.getByText(`RD$ ${cantMonto}`).nth(1)).toBeVisible();

        // Desembolsar la solicitud
        const botonDesembolsar = page.getByRole('button', {name: 'Desembolsar'});
        await expect(botonDesembolsar).toBeVisible();
        await botonDesembolsar.click();

        // Cerrar las paginas que se abren con los diferentes reportes
        CerrarPaginasReportes();
    });

    test('Buscar la Solicitud de Credito en estado Desembolsado', async () => {
        // La url debe regresar a las solicitudes en aprobado
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=aprobado`);

        // Cambiar el estado de las solicitudes de Aprobado a Desembolsado
        await page.locator('text=APROBADO').click();
        await page.locator('text=DESEMBOLSADO').click();

        // Buscar a la persona juridica
        await page.locator(`${formBuscar}`).fill(`${nombreEmpresa}`);

        // Debe mostrarse el prestamo desembolsado en la tabla
        await expect(page.getByRole('row', {name: `${nombreEmpresa}`})).toBeVisible();
    });
    
    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});