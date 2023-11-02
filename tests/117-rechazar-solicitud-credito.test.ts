import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { 
    url_base, 
    dataCerrar, 
    selectBuscar, 
    browserConfig, 
    inputFechaSolicitud, 
    inputPrimerPago, 
    formBuscar,
    contextConfig,
    valorAdmisibleCredito,
    formComentarios,
    dataVer,
    dataEdit,
    ariaAgregar
} from './utils/dataTests';
import { diaActualFormato, unMesDespues, diaSiguiente, diaAnterior } from './utils/functions/fechas';
import { url_solicitud_credito } from './utils/urls';

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
const cantMonto:string = '300,000';

// Pruebas
test.describe.serial('Pruebas Reachazando una Solicitud de Credito', () => {
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
        await page.getByText('HIPOTECARIOS').click();

        // Tipo de garantia
        await page.getByLabel('Tipo Garantía').click();
        // Click en garantia hipotecaria
        await page.getByText('HIPOTECARIAS').click();

        // Oferta
        await page.getByLabel('Oferta').click();
        // Elegir credito hipotecaria
        await page.getByText('CRÉDITO HIPOTECARIO').click();

        // Grupo
        await page.getByLabel('Grupo').click();
        await page.getByLabel('Grupo').fill('sin gara');
        // Elegir grupo sin garantia
        await page.getByRole('option', {name: 'SIN GARANTIA'}).click();

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

        // Cambiar el tipo de cuota
        await page.getByText('INSOLUTO').click()
        await page.getByText('SOLO INTERES').click();

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
        await campoTasa.click();
        await campoTasa.clear();

        // Colocar una tasa por encima de lo permitido que es de 17%
        await campoTasa.fill('100');
        // Clickear fuera del campo
        await page.getByText('Plazo', {exact: true}).click();
        
        // Debe salir un modal
        await expect(page.locator('text=Tasa Máxima para esta oferta es: 17.00')).toBeVisible();
        // Click en Aceptar
        await page.locator('text=Aceptar').click();

        // Ingresar una Tasa Correcta
        await campoTasa.fill('15');

        // Plazo
        await page.getByPlaceholder('CANTIDAD').click();
        await page.getByPlaceholder('CANTIDAD').fill('48');

        // Los plazos deben ser mensuales
        const plazos = page.locator('text=MENSUAL');
        await expect(plazos).toBeVisible();
        await plazos.click();

        // Deben mostrarse las opciones disponibles para el plazo
        await expect(page.getByRole('option', {name: 'ANUAL'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'BIMENSUAL'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'CUATRIMESTRAL'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'DIARIO'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'QUINCENAL'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'SEMANAL'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'SEMESTRAL'})).toBeVisible();
        await expect(page.getByRole('option', {name: 'TRIMESTRAL', exact: true})).toBeVisible();

        // Agregar una cuenta del socio para desembolsar
        await page.locator(`${selectBuscar}`).first().click();
        // La cuenta de aportaciones no debe estar visible
        await expect(page.locator('span').filter({hasText: 'APORTACIONES'})).not.toBeVisible(); 

        // Seleccionar la cuenta de ahorros
        await page.getByText('AHORROS NORMALES').click();

        // Finalidad
        await page.getByLabel('Finalidad').click();
        // Elegir propiedad o vivienda
        await page.getByText('PROPIEDAD O VIVIENDA').click();

        // Destino o proposito
        await page.getByPlaceholder('Destino o propósito').click();
        await page.getByPlaceholder('Destino o propósito').fill('comprar una casa');

        // Los valores del monto, tasa y plazo deben estar correctos
        await expect(page.locator('#loan_form_MONTO')).toHaveValue(`RD$ ${cantMonto}`);
        await expect(page.locator('#loan_form_TASA')).toHaveValue('15%');
        await expect(page.locator('#loan_form_PLAZO')).toHaveValue('48');

        // Via desembolso
        await expect(page.getByTitle('DEPOSITO A CUENTA')).toBeVisible();

        // El monto de la cuota debe estar visible
        await expect(page.locator('#loan_form_CUOTA')).toHaveValue('RD$ 3,750');

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

    test('Paso 3 - Cargos del prestamo', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=3`);

        // El titulo principal debe estar visible
        await expect(page.getByRole('heading', {name: 'CARGOS'})).toBeVisible();
        
        // Esperara 4 segundos
        await page.waitForTimeout(4000);

        // Deben mostrarse los cargos de seguro de vida y de buro credito
        await expect(page.getByRole('cell', {name: 'SEGURO DE VIDA'})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'BURO DE CREDITO (DATACREDITO)'})).toBeVisible();

        // Debe estar visible el cargo de Contrato
        await expect(page.getByRole('cell', {name: 'CONTRATO'})).toBeVisible();

        // Colocar una cantidad para los cargos
        const cargos = page.locator('(//td[@class="ant-table-cell montoPorcentajeSolicitud"])').nth(1);
        await cargos.click();

        // await page.locator('#VALOR').fill('50');
        await page.getByPlaceholder('MONTO O PORCENTAJE').fill('50');

        // Guardar los cargos
        await page.getByRole('button', {name: 'Guardar Cargos', }).click();

        // Boton de agregar cargos 
        const agregarCuota = page.locator(`${ariaAgregar}`);
        await expect(agregarCuota).toBeVisible();

        // Esperara 4 segundos
        await page.waitForTimeout(4000);

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

        // Debe salir un modal par agregar la garantia
        const modalAgregarGarantia =page.locator('#form').getByRole('heading', {name: 'Garantías'});
        await expect(modalAgregarGarantia).toBeVisible();

        // Debe salir un modal para agregar la garantia y elegir el tipo de garantia
        await page.getByRole('combobox').click();
        await page.getByText('HIPOTECA', {exact: true}).click();

        // Elegir que el socio es propietario de la garantia
        await page.getByRole('checkbox').click();

        // Luego de seleccionar que el socio es el propietario de la garantia debe salir su nombre
        await expect(page.locator(`text=${nombre} ${apellido}`)).toBeVisible();

        // Valor tasado
        const valorTasado = page.getByPlaceholder('VALOR TASADO');
        await valorTasado.click();
        await valorTasado.fill(`RD$ ${cantMonto}`);

        // Valor admisible
        await expect(page.locator(`${valorAdmisibleCredito}`)).toHaveValue('RD$ 240,000');

        // Agregar atributos a la garantia
        await expect(page.locator('text=ATRIBUTOS DE LA GARANTÍA')).toBeVisible();

        // Los atributos de la garantia de hipoteca deben estar visible
        await expect(page.locator('text=SUPERFICIE')).toBeVisible(); 
        await expect(page.locator('text=MATRICULA')).toBeVisible();

        // Superficie
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').first().click();
        await page.getByPlaceholder('Valor Atributo').fill('Terreno');

        // Matricula
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').last().click();
        await page.getByPlaceholder('VALOR ATRIBUTO').fill('1550');

        // Click en guardar
        await page.getByRole('button', {name: 'save Guardar'}).click();

        // Debe aparecer una alerta de que la garantia se guardo correctamente
        await expect(page.locator('text=Garantías del préstamo guardadas exitosamente.')).toBeVisible();

        // El modal de agregar garantia debe desaparecer
        await expect(modalAgregarGarantia).not.toBeVisible();

        // Editar la garantia agregada
        
        // Click al boton de editar
        const botonEditar = page.locator(`${dataEdit}`);
        await expect(botonEditar).toBeVisible();
        await botonEditar.click();

        // El modal de agregar garantia aparece nuevamente
        await expect(modalAgregarGarantia).toBeVisible();

        // Editar el valor tasado
        await valorTasado.click();
        await valorTasado.clear();
        await valorTasado.fill('RD$ 400000');

        // Valor admisible
        await expect(page.locator(`${valorAdmisibleCredito}`)).toHaveValue('RD$ 320,000');

        // Editar la matricula
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').last().click();
        await page.getByPlaceholder('VALOR ATRIBUTO').fill('3840');

        // Esperar a que se agregue el nuevo valor de la matricula
        await page.waitForTimeout(2000);

        // Click fuera del input
        await page.locator('text=ATRIBUTOS DE LA GARANTÍA').click();
        
        // Esperar que se actualice el valor de la matricula
        await page.waitForTimeout(2000);

        // Click al boton de Actualizar
        const botonActualizar = page.getByRole('button', {name: 'Actualizar'});
        await expect(botonActualizar).toBeVisible();
        await botonActualizar.click();

        // El modal de agregar garantia debe desaparecer nuevamente
        await expect(modalAgregarGarantia).not.toBeVisible();

        // Solo debe mostrarse una garantia
        await expect(page.getByRole('cell', {name: 'HIPOTECA'})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'RD$ 400,000.00'})).toBeVisible();

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

        // Click en finalizar
        await page.getByRole('button', {name: 'check Finalizar'}).click();

        // Debe salir un modal, diciendo que debe agregar los documentos necesarios
        await expect(page.getByText('Debe adjuntar todos los documentos requeridos.')).toBeVisible();
        // Click en aceptar
        await page.getByRole('button', {name: 'check Aceptar'}).click();

        // Cerrar alertas
        await page.locator(`${dataCerrar}`).last().click();
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
        
        // Subir Informe del Subgerente de Negocios
        const subirSubgerenteNegociosPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '14 INFORME DEL SUBGERENTE DE NEGOCIOS upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirSubgerenteNegocios = await subirSubgerenteNegociosPromesa;
        await subirSubgerenteNegocios.setFiles(`${firma}`);  

        await page.waitForTimeout(3000);

        // Esperar que el Informe del Subgerente de Negocios se haya subido
        await expect(page.getByRole('link', {name: 'INFORME DEL SUBGERENTE DE NEGOCIOS'})).toBeVisible();
        
        // Subir Instancia de credito llena y firmada
        const subirInstanciaCreditoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '13 INSTANCIA DE CREDITO LLENA Y FIRMADA upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirInstanciaCredito = await subirInstanciaCreditoPromesa;
        await subirInstanciaCredito.setFiles(`${firma}`);

        await page.waitForTimeout(3000);

        // Esperar que la Instancia de Credito se haya subido
        await expect(page.getByRole('link', {name: 'INSTANCIA DE CREDITO LLENA Y FIRMADA'})).toBeVisible();

        // Subir Tabla de amortizacion
        const subirTablaAmortizacionPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '10 TABLA AMORTIZACION upload Cargar delete'}).getByRole('cell', {name: 'upload Cargar'}).locator('button').click();
        const subirTablaAmortizacion = await subirTablaAmortizacionPromesa;
        await subirTablaAmortizacion.setFiles(`${firma}`);

        await page.waitForTimeout(3000);

        // Esperar que la Tabla de Amortizacion se haya subido
        await expect(page.locator('text=Documentos requerdios del préstamo guardados exitosamente.').last()).toBeVisible();
        
        // Subir Cedula del Deudor
        const subirCedulaDeudorPromesa = page.waitForEvent('filechooser');
        await page.getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirCedulaDeudor = await subirCedulaDeudorPromesa;
        await subirCedulaDeudor.setFiles(`${firma}`);

        await page.waitForTimeout(3000);

        // Esperar que la Cedula se haya subido
       await expect(page.locator('text=Documentos requerdios del préstamo guardados exitosamente.').last()).toBeVisible();
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

        // Esperar que la pagina cargue
        await page.waitForTimeout(3000);

        // Buscar la solicitud creada
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Esperar que la solicitud buscada aparezca
        await page.waitForTimeout(2000);

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

        // La url debe de tener que la solicitud esta en estado solicitado
        await expect(page).toHaveURL(/\/solicitado/);

        // Esperar que cargue la pagina
        await page.waitForTimeout(5000);

        // Debe estar en el primer paso de la solicitud
        await expect(page.getByRole('heading', {name: 'Solicitante', exact: true})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Datos del Solicitante'})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Lugar de Trabajo Solicitante'})).toBeVisible();
        
        // Ir a la ultima seccion 
        const seccionDocumentos = page.getByRole('button', {name: '9 Documentos'});
        await expect(seccionDocumentos).toBeVisible();
        await seccionDocumentos.click();

        // Los documentos deben estar visibles
        await expect(page.getByRole('link', {name: 'SOLICTUD DE PRESTAMO LLENA Y FIRMADA'}).first()).toBeVisible();
        await expect(page.getByRole('link', {name: 'INFORME BURO CREDITO (DATACREDITO)'}).first()).toBeVisible();
        await expect(page.getByRole('link', {name: 'INFORME DEL SUBGERENTE DE NEGOCIOS'}).first()).toBeVisible();
        await expect(page.getByRole('link', {name: 'INSTANCIA DE CREDITO LLENA Y FIRMADA'}).first()).toBeVisible();
        await expect(page.getByRole('link', {name: 'TABLA AMORTIZACION'}).first()).toBeVisible();
        await expect(page.getByRole('link', {name: 'CEDULA DEUDOR'}).first()).toBeVisible();

        // Click en la firma de la Cedula deudor para visualizar
        await page.getByRole('link', {name: 'CEDULA DEUDOR'}).first().click();

        // Aprece un modal con la imagen de la firma
        await expect(page.getByRole('dialog', {name: 'CEDULA DEUDOR'})).toBeVisible();

        // Cerrar la imagen de la firma
        await page.getByRole('button', {name: 'Close'}).click();

        // Esperar que la imagen de la firma este cerrada
        await page.waitForTimeout(2000);

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

    test('Cambiar el estado de la Solicitud de En Proceso (Analisis) a Rechazado', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);

        // Cambiar el estado de las solicitudes de Solicitado a En Proceso (Analisis)
        await page.locator('text=SOLICITADO').click();
        await page.locator('text=EN PROCESO (ANALISIS)').click();

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

        // Esperar que cargue la pagina
        await page.waitForTimeout(5000);

        // Debe estar en el primer paso de la solicitud
        await expect(page.getByRole('heading', {name: 'Solicitante', exact: true})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Datos del Solicitante'})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Lugar de Trabajo Solicitante'})).toBeVisible();

        // Dirigirse a la ultima seccion
        const seccionAnalisis = page.getByRole('button', {name: '10 Análisis'});
        await expect(seccionAnalisis).toBeVisible();
        await seccionAnalisis.click();

        // El titulo de proceso, analisis debe estar visible
        await expect(page.getByRole('heading', {name: '(EN PROCESO (ANALISIS))'})).toBeVisible();

        // El nombre de la persona debe estar visible en un titulo
        await expect(page.getByRole('heading', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Agregar un comentario
        const campoComentario = page.getByPlaceholder('Comentario');
        await campoComentario.click();
        await campoComentario.fill('Solicitud de Credito Rechazada');
        // Guardar Comentario
        await page.getByRole('button', {name: 'Guardar'}).click();

        // Debe mostrarse un mensaje de que el comentario se guardo correctamente
        await expect(page.locator('text=Prestamos observacion almacenada exitosamente.')).toBeVisible();

        // Esperar que se guarde el comentario
        await page.waitForTimeout(2000);

        // Cambiar la categoria de la solicitud
        await page.getByRole('button', {name: 'ellipsis'}).click();
        // Debe estar visible el estado de rechazado
        await expect(page.getByText('APROBADO', {exact: true})).toBeVisible();
        // Debe estar visible el estado de solicitado
        await expect(page.getByText('SOLICITADO', {exact: true})).toBeVisible();

        // Cambiar el estado a Aprobado
        await page.getByText('RECHAZADO', {exact: true}).click();
        await page.getByText('¿Está seguro que desea pasar el préstamo a estado RECHAZADO?').click();   
        
        // Click en Aceptar
        const botonAceptar = page.getByRole('button', {name: 'check Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        await page.waitForTimeout(3000);

        // Debe salir un modal de para colocar la razon de rechazo
        await expect(page.getByText('RAZÓN DEL RECHAZO')).toBeVisible();

        // Colocar un comentario como razon de rechazo
        await page.locator(`${formComentarios}`).fill('Debe saldar los demas prestamos que posee');

        // Click al boton de Aceptar
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Cerrar las paginas que se abren con los diferentes reportes
        CerrarPaginasReportes();
    });

    test('Buscar la Solicitud de Credito Rechazada', async () => {
        // La url debe regresar a las solicitudes en proceso
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=en_proceso__analisis`);
        
        // Cambiar el estado de las solicitudes de En Proceso a Aprobado
        await page.locator('text=EN PROCESO (ANALISIS)').click();
        await page.locator('text=RECHAZADO').click();

        // Buscar la solicitud rechazada de la persona
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Debe aparecer la solicitud rechazada
        await expect(page.getByRole('row', {name: `CRÉDITO HIPOTECARIO ${nombre} ${apellido} RD$ 300,000.00`})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});