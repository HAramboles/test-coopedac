import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataCerrar, selectBuscar, formBuscar, browserConfig } from './utils/dataTests';

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
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

test.describe.serial('Pruebas con la Solicitud de Credito - Crediautos - Persona Juridica', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: browserConfig.headless,
            args: browserConfig.args
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

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
        await page.getByText('PRENDARIAS').click();

        // Oferta
        await page.getByLabel('Oferta').click();
        // Elegir credito hipotecaria
        await page.getByText('CRÉDIAUTOS (VEHÍCULOS)').click();

        // Grupo
        await page.getByLabel('Grupo').click();
        await page.getByLabel('Grupo').fill('vegamovil');
        // Elegir grupo sin garantia
        await page.getByRole('option', {name: 'VEGAMOVIL', exact: true}).click();

        // El tipo de cuota debe ser Insoluto
        await expect(page.getByText('INSOLUTO')).toBeVisible();

        // Monto
        await page.locator('#loan_form_MONTO').click();
        await page.locator('#loan_form_MONTO').fill('125000');

        // Tasa
        const campoTasa = page.getByLabel('Tasa');
        await campoTasa.click();
        await campoTasa.clear();;

        // Ingresar una Tasa
        await campoTasa.fill('5');

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
        await page.getByText('AHORROS NORMALES').first().click();

        // Agregar un cuenta para cobrar
        await page.locator(`${selectBuscar}`).last().click();
        // La cuenta de aportaciones no debe estar visible
        await expect(page.locator('span').filter({hasText: 'APORTACIONES'})).not.toBeVisible(); 
        
        // Seleccionar la cueta de ahorros
        await page.getByText('AHORROS NORMALES').last().click();

        // Finalidad
        await page.getByLabel('Finalidad').click();
        // Elegir propiedad o vivienda
        await page.getByRole('option', {name: 'PRENDARIO'}).click();

        // Destino o proposito
        await page.getByPlaceholder('Destino o propósito').click();
        await page.getByPlaceholder('Destino o propósito').fill('Prestamo para Vehiculos');

        // Los valores del monto, tasa y plazo deben estar correctos
        await expect(page.locator('#loan_form_MONTO')).toHaveValue('RD$ 125,000');
        await expect(page.locator('#loan_form_TASA')).toHaveValue('5%');
        await expect(page.locator('#loan_form_PLAZO')).toHaveValue('60');

        // Via desembolso
        await expect(page.getByText('Vía Desembolso')).toBeVisible();

        // El monto de la cuota debe estar visible
        await expect(page.locator('#loan_form_CUOTA')).toHaveValue('RD$ 2,358.9');

        // Click en guardar y continuar
        GuardaryContinuar();
    });
    test('Paso 3 - Cargos del prestamo', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=3`);

        // El titulo principal debe estar visible
        await expect(page.getByRole('heading', {name: 'CARGOS'})).toBeVisible();

        // Debe de haber un cargo
        await expect(page.getByRole('row', {name: 'CUOTA ADMISION X CAMBIO CATEGORIA'})).toBeVisible();

        // Click al boton de Guardar Cargos
        await page.getByRole('button', {name: 'Guardar Cargos'}).click();

        // Debe mostrarse una alerta de que los cargos se han guardado
        await expect(page.locator('text=Cargos del préstamo guardados exitosamente.')).toBeVisible();
        
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
        await page.getByPlaceholder('MONTO').fill('RD$ 5,0000');

        // Click fuera del input
        await page.getByText('TOTAL INGRESOS').click();

        // Colocar un monto en el campo de Total Gastos
        await page.getByText('RD$ 0.00').click();
        await page.getByPlaceholder('MONTO').fill('RD$ 1,5000');

        // Click fuera del input
        await page.getByText('TOTAL INGRESOS').click();

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

        // Click al boton de agregar garantia
        await page.getByRole('button', {name: 'Agregar Garantía'}).click();

        // Debe salir un modal
        await expect(page.locator('text=SELECCIONAR OPCIÓN')).toBeVisible();

        // Click a la opcion de nueva garantia
        await page.locator('text=Nueva garantía').click();

        // Debe salir un modal para agregar la garantia y elegir el tipo de garantia
        await page.getByRole('combobox').click();
        await page.getByText('VEHÍCULO PRIVADO', {exact: true}).click();

        // Elegir que el socio es propietario de la garantia
        await page.getByRole('checkbox').click();

        // Luego de seleccionar que el socio es el propietario de la garantia debe salir su nombre
        await expect(page.locator(`text=${nombreEmpresa}`)).toBeVisible();

        // Valor tasado
        const valorTasado = page.getByPlaceholder('VALOR TASADO');
        await valorTasado.click();
        await valorTasado.fill('RD$ 125000');

        // Agregar atributos a la garantia
        await expect(page.locator('text=ATRIBUTOS DE LA GARANTÍA')).toBeVisible();

        // Placa
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(0).click();
        await page.getByPlaceholder('Valor Atributo').fill('HGIT159');

        // Chasis
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(0).click();
        await page.getByPlaceholder('Valor Atributo').fill('LKER752');

        // Tipo de Vehiculo
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(1).click();
        await page.getByPlaceholder('Valor Atributo').fill('CARRO');

        // Marca
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(2).click();
        await page.getByPlaceholder('Valor Atributo').fill('NISSAN');

        // Modelo
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(3).click();
        await page.getByPlaceholder('Valor Atributo').fill('350Z');

        // Color
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(4).click();
        await page.getByPlaceholder('Valor Atributo').fill('GRIS');

        // Año
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(5).click();
        await page.getByPlaceholder('Valor Atributo').fill('2016');

        // Click en guardar
        await page.getByRole('button', {name: 'save Guardar'}).click();

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 8 - Referencias', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=8`);

        // Los tres titulos deben estar visibles
        await expect(page.getByRole('heading', {name: 'Familiares mas Cercanos'})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Referencias Morales o Personales'})).toBeVisible();
        await expect(page.getByRole('heading', {name: 'Referencias Comerciales'})).toBeVisible();

        // Click en actualizar y continuar
        GuardaryContinuar();
    });

    test('Paso 9 - Documentos', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=9`);

        // El titulo principal debe esatr visible
        await expect(page.getByRole('heading', {name: 'Lista de documentos'})).toBeVisible();

        // Subir Solicitud de Prestamo Llena y Firmada
        const subirSolicitudPrestamoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '5 SOLICTUD DE PRESTAMO LLENA Y FIRMADA upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirSolicitudPrestamo = await subirSolicitudPrestamoPromesa;
        await subirSolicitudPrestamo.setFiles(`${firma}`);

        // Esperar que la Solicitud de Prestamo Llena y Firmada se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])')).toBeVisible();

        // Subir Evidencia de Ingresos
        const subirEvidenciaIngresosPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '4 EVIDENCIA DE INGRESOS upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirEvidenciaIngresos = await subirEvidenciaIngresosPromesa;
        await subirEvidenciaIngresos.setFiles(`${firma}`);

        // Esperar que la Evidencia de Ingresos se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])').nth(1)).toBeVisible();

        // Subir Informe de Buro Credito
        const subirBuroCreditoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '3 INFORME BURO CREDITO (DATACREDITO) upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirBuroCredito = await subirBuroCreditoPromesa;
        await subirBuroCredito.setFiles(`${firma}`);

        // Esperar que el Informe de Buro Credito se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])').nth(2)).toBeVisible();

        // Subir Instancia de credito llena y firmada
        const subirInstanciaCreditoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '13 INSTANCIA DE CREDITO LLENA Y FIRMADA upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirInstanciaCredito = await subirInstanciaCreditoPromesa;
        await subirInstanciaCredito.setFiles(`${firma}`);

        // Esperar que la Instancia de credito llena y firmada se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])').nth(3)).toBeVisible();

        // Subir Pagare Notarial
        const subirPagareNotarialPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '12 PAGARE NOTARIAL upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirPagareNotarial = await subirPagareNotarialPromesa;
        await subirPagareNotarial.setFiles(`${firma}`);

        // Esperar que el Pagare Notarial se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])').nth(4)).toBeVisible();

        // Subir Contrato
        const subirContratoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '11 CONTRATO upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirContrato = await subirContratoPromesa;
        await subirContrato.setFiles(`${firma}`);

        // Esperar que el Contrato se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])').nth(5)).toBeVisible();

        // Subir Cedula del Deudor
        const subirCedulaDeudorPromesa = page.waitForEvent('filechooser');
        await page.getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirCedulaDeudor = await subirCedulaDeudorPromesa;
        await subirCedulaDeudor.setFiles(`${firma}`);

        // Esperar que la Cedula se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])').nth(6)).toBeVisible();
    });

    test('Finalizar con la creacion de la Solicitud', async () => {
        // Boton de Finalizar
        const botonFinalizar = page.getByRole('button', {name: 'check Finalizar'});
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();

        // Se deben abrir tres nuevas ventanas con diferentes reportes
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page'); 
        const page3 = await context.waitForEvent('page');
        
        // Cerrar la pagina con la solicitud
        await page1.close();

        // Cerrar la pagina con la tabla de amortizacion
        await page2.close();

        // Cerrar la pagina con el tercer reporte
        await page3.close();
    });

    test('Cambiar el estado de la Solicitud de Solicitado a En Proceso (Analisis)', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);

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

        // Se deben abrir tres nuevas ventanas con diferentes reportes
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page'); 
        const page3 = await context.waitForEvent('page');
        
        // Cerrar la pagina con la solicitud
        await page1.close();

        // Cerrar la pagina con la tabla de amortizacion
        await page2.close();

        // Cerrar la pagina con el tercer reporte
        await page3.close();
    });

    test('Cambiar el estado de la Solicitud de En Proceso (Analisis) a Aprobado', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);

        // Cambiar el estado de las solicitudes de Solicitado a En Proceso (Analisis)
        await page.locator('text=SOLICITADO').click();
        await page.locator('text=EN PROCESO (ANALISIS)').click();

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

        // Esperar que se abra una nueva pestaña con el reporte
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');
        
        // Cerrar la pagina con el reporte 
        await page1.close();
        await page2.close();
    });

    test('Desembolsar la solicitud', async () => {
        // La url debe regresar a las solicitudes en proceso
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=en_proceso__analisis`);

        // Cambiar el estado de las solicitudes de En Proceso a Aprobado
        await page.locator('text=EN PROCESO (ANALISIS)').click();
        await page.locator('text=APROBADO').click();

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombreEmpresa}`}).getByRole('button', {name: 'eye'}).click();

        // La url debe de tener que la solicitud esta en aprobado
        await expect(page).toHaveURL(/\/aprobado/);

        // Dirigirse a la ultima seccion
        const seccionDesembolso = page.getByRole('button', {name: '10 Desembolso'});
        await expect(seccionDesembolso).toBeVisible();
        await seccionDesembolso.click();

        // El nombre y el apellido del socio deben estar visibles
        await expect(page.getByText(`Socio: ${nombreEmpresa}`)).toBeVisible(); 

        // EL boton de Imprimir Solicitud debe estar visible
        const botonImprimirContrato = page.getByRole('button', {name: 'Imprimir Contrato'});
        await expect(botonImprimirContrato).toBeVisible();

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