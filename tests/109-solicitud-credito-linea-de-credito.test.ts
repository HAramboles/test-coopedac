import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { 
    dataCerrar, 
    selectBuscar, 
    formBuscar, 
    inputFechaSolicitud, 
    inputPrimerPago, 
    valorAdmisibleCredito, 
    buscarPorNombre,
    crearBuscarPorCedula
} from './utils/data/inputsButtons';
import { diaActualFormato, unMesDespues, diaSiguiente, diaAnterior } from './utils/functions/fechas';
import { url_base, url_solicitud_credito } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre y apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Monto solicitado para el prestamo
const cantMonto:string = '200,000';

// Imagen de los documentos
const firma = './tests/utils/img/firma.jpg';

// Pruebas
test.describe.serial('Prueba con la Solicitud de Linea de Credito', () => {
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
        const botonGuardaryContinuar = page.locator('button:has-text("Guardar y Continuar")');
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

    test('Navegar a la opcion de Solicitud de Credito', async () => {
        // Negocios
        await page.getByRole('menuitem', {name: 'NEGOCIOS'}).click();

        // Procesos
        await page.getByRole('menuitem', {name: 'PROCESOS'}).click();
        
        // Solicitud de Credito
        await page.getByRole('menuitem', {name: 'Solicitud de Crédito'}).click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);
    });

    test('Boton Nueva Solicitud', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();

        // El listado de las transferencias debe ser solicitado
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
        await page.getByText('COMERCIALES').click();

        // Tipo de garantia
        await page.getByLabel('Tipo Garantía').click();
        // Click en garantia hipotecaria
        await page.getByText('PRENDARIAS', {exact: true}).click();

        // Oferta
        await page.getByLabel('Oferta').click();
        // Elegir credito hipotecaria
        await page.getByText('LÍNEA DE CRÉDITO').click();

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

        // En el tipo de cuota se coloca automaticamente solo interes
        await expect(page.getByText('SOLO INTERES')).toBeVisible();

        // Monto
        await page.locator('#loan_form_MONTO').click();
        await page.locator('#loan_form_MONTO').fill(`${cantMonto}`);

        // Tasa
        const campoTasa = page.getByLabel('Tasa');
        await expect(campoTasa).toHaveValue('13.95%');

        // Plazo
        await page.getByPlaceholder('CANTIDAD').click();
        await page.getByPlaceholder('CANTIDAD').fill('12');

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
        // Elegir propiedad o vivienda
        await page.getByRole('option', {name: 'LINEA DE CREDITO'}).click();

        // Destino o proposito
        await page.getByPlaceholder('Destino o propósito').click();
        await page.getByPlaceholder('Destino o propósito').fill('Solicitar una Linea de Credito');

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

        // Esperar que carguen los cargos
        await page.waitForTimeout(2000);

        // Deben mostrarse los tres cargos
        await expect(page.getByRole('cell', {name: 'CONTRATO'})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'GASTOS LEGALES', exact: true})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'BURO DE CREDITO (DATACREDITO)'})).toBeVisible();

        // Click al boton de guardar cargos
        const botonGuardarCargos = page.getByRole('button', {name: 'Guardar Cargos'});
        await expect(botonGuardarCargos).toBeVisible();
        await botonGuardarCargos.click();

        // Esperar que los cargos se guarden
        await page.waitForTimeout(3000);

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
        await page.getByText('GARANTIA COMERCIAL', {exact: true}).click();

        // Elegir que el socio es propietario de la garantia
        await page.getByRole('checkbox').click();

        // Luego de seleccionar que el socio es el propietario de la garantia debe salir su nombre
        await expect(page.locator(`text=${nombre} ${apellido}`)).toBeVisible();

        // Valor tasado
        const valorTasado = page.getByPlaceholder('VALOR TASADO');
        await valorTasado.click();
        await valorTasado.fill(`RD$ ${cantMonto}`);

        // Valor admisible
        await expect(page.locator(`${valorAdmisibleCredito}`)).toHaveValue('RD$ 200,000');

        // Agregar atributos a la garantia
        await expect(page.locator('text=ATRIBUTOS DE LA GARANTÍA')).toBeVisible();

        // El atributo de la garantia comercial deben estar visible
        await expect(page.locator('text=NZA')).toBeVisible();

        // NZA
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').first().click();
        await page.getByPlaceholder('Valor Atributo').clear();
        await page.getByPlaceholder('Valor Atributo').fill('4589');

        // Click en guardar
        await page.getByRole('button', {name: 'save Guardar'}).click();

        // Debe aparecer una alerta de que la garantia se guardo correctamente
        await expect(page.locator('text=Garantías del préstamo guardadas exitosamente.')).toBeVisible();

        // El modal de agregar garantia debe desaparecer
        await expect(modalAgregarGarantia).not.toBeVisible();

        // Debe mostrarse la garantia agregada
        await expect(page.getByRole('cell', {name: 'GARANTIA COMERCIAL'})).toBeVisible();
        await expect(page.getByRole('cell', {name: 'RD$ 200,000.00'}).first()).toBeVisible();
        await expect(page.getByRole('cell', {name: 'RD$ 200,000.00'}).nth(1)).toBeVisible();

        await page.waitForTimeout(2000);

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
        
        // Subir Contrato
        const subirContratoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '11 CONTRATO upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirContrato = await subirContratoPromesa;
        await subirContrato.setFiles(`${firma}`);  

        await page.waitForTimeout(3000);

        // Esperar que el cONTRATO se haya subido
        await expect(page.getByRole('link', {name: 'CONTRATO'})).toBeVisible();
        
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

        // Elegir buscar por nombre del socio
        await page.locator(`${buscarPorNombre}`).click();

        // Buscar la solicitud
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();

        // La url debe de tener que la solicitud esta en estado solicitado
        await expect(page).toHaveURL(/\/solicitado/);

        // Esperar que carguen los datos de la solicitud
        await page.waitForTimeout(5000);
        
        // Ir a la ultima seccion 
        const seccionDocumentos = page.getByRole('button', {name: '9 Documentos'});
        await expect(seccionDocumentos).toBeVisible();
        await seccionDocumentos.click();

        // Esperar que carguen los datos 
        await page.waitForTimeout(3000);

        // El documento debe estar visibles
        await expect(page.locator('div').filter({hasText: 'CEDULA DEUDOR'}).nth(4)).toBeVisible();

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

        // Buscar la solicitud de linea de credito creada
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Esperar que carguen los datos
        await page.waitForTimeout(3000);

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

        // Esperar que carguen los datos de la solicitud
        await page.waitForTimeout(7000);

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

        // Esperar que la pagina cargue
        await page.waitForTimeout(5000);

        // Agregar un comentario
        const campoComentario = page.getByPlaceholder('Comentario');
        await campoComentario.click();
        await campoComentario.fill('Linea de Credito Aprobada');
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
        
        // Click en Aceptar y se debe abrir otra pagina con el reporte de aprobacion
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

        // Buscar la solicitud de linea de credito creada
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Esperar que carguen los datos
        await page.waitForTimeout(3000);

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();

        // La url debe de tener que la solicitud esta en proceso
        await expect(page).toHaveURL(/\/aprobado/);

        // Esperar que carguen los datos
        await page.waitForTimeout(4000);

        // Debe estar en el primer paso de la solicitud
        await expect(page.getByRole('heading', {name: 'Solicitante', exact: true})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Datos del Solicitante'})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Lugar de Trabajo Solicitante'})).toBeVisible();

        // Dirigirse a la ultima seccion
        const seccionDesembolso = page.getByRole('button', {name: '10 Desembolso'});
        await expect(seccionDesembolso).toBeVisible();
        await seccionDesembolso.click();

        // El nombre y el apellido del socio deben estar visibles
        await expect(page.getByText(`Socio: ${nombre} ${apellido}`)).toBeVisible();

        // EL boton de Imprimir Solicitud debe estar visible
        const botonImprimirContrato = page.getByRole('button', {name: 'Imprimir Contrato'});
        await expect(botonImprimirContrato).toBeVisible();

        // Debe estar visible una tabla con los datos del prestamo
        await expect(page.getByText(`RD$ ${cantMonto}`).first()).toBeVisible();
        await expect(page.getByText('RD$ 2,325.00')).toBeVisible();
        await expect(page.getByText('Plazo:12 Meses')).toBeVisible();
        await expect(page.getByText('Tasa:13.95%')).toBeVisible();
        await expect(page.getByText('DEPOSITO A CUENTA')).toBeVisible();
        await expect(page.getByText('Tipo de Crédito:COMERCIALES')).toBeVisible();
        //await expect(page.getByText('Oferta:LÍNEA DE CRÉDITO')).toBeVisible();
        await expect(page.getByText('Grupo:SIN GARANTIA')).toBeVisible();

        // La tabla de cuentas de cobros debe estar visible
        await expect(page.getByRole('row', {name: 'Principal Tipo de cuenta No. Cuenta Titular Acciones'})).toBeVisible();

        // La cuenta de cobro debe estar visible
        await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
        await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Esperar que el input de monto a desembolsar este visible
        await page.waitForTimeout(4000);

        // Desembolsar la mitad de la linea, es decir, 100,000 pesos
        await page.getByText('RD$ 0.00').first().click();
        await page.waitForTimeout(1000);
        await page.locator('#form_MONTO_DESEMBOLSAR').fill('RD$ 100000');
        await page.locator('#form_MONTO_DESEMBOLSAR').click();

        // Esperar dos segundos
        await page.waitForTimeout(2000);

        // Click fuera del checkbox
        await page.getByRole('cell', {name: 'Monto a Desembolsar :'}).click();

        // Click a Desembolsar
        const botonDesembolsar = page.getByRole('button', {name: 'Desembolsar'});
        await expect(botonDesembolsar).toBeVisible();
        await botonDesembolsar.click();

        // Cerrar las paginas que se abren con los diferentes reportes
        CerrarPaginasReportes();
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
        await expect(page.getByRole('row', {name: 'LÍNEA DE CRÉDITO'})).toBeVisible();
    });

    test('Guardar el codigo del prestamo en el state', async () => {
        // Copiar el codigo de la cuenta
        await page.getByRole('row', {name: 'LÍNEA DE CRÉDITO'}).getByRole('cell').nth(0).click({clickCount: 4});
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
        await expect(page.getByRole('row', {name: 'LÍNEA DE CRÉDITO'})).toBeVisible();

        // Guardar el codigo del prestamo en el state
        await page.evaluate((idPrestamo) => window.localStorage.setItem('codigoPrestamoLineaCredito', `${idPrestamo}`), `${idPrestamo}`);
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});