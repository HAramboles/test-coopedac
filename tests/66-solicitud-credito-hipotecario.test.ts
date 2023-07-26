import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataCerrar, selectBuscar, ariaCerrar } from './utils/dataTests';

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
            headless: false,
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
        await expect(botonGuardaryContinuar).toHaveClass("ant-btn css-lvymt ant-btn-primary ant-btn-sm  ");
        await expect(botonGuardaryContinuar).toBeVisible();
        // presionar el boton
        await botonGuardaryContinuar.click();
    };

    test('Ir a la opcion de Solicitud de Credito', async () => {
        // Negocios
        await page.locator('text=NEGOCIOS').click();

        // Procesos
        await page.locator('text=PROCESOS').click();
        
        // Solicitud de Credito
        await page.locator('text=Solicitud de Crédito').click();

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();

        // Condicion por si el tipo de solicitud llega sin datos o con datos
        const estadoSolicitud = page.getByTitle('SOLICITADO', {exact: true});

        if (await estadoSolicitud.isHidden()) {
            // Si no llega el tipo de captacion, manualmente dirigise a la url de las aportaciones
            await page.goto(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);
        } else if (await estadoSolicitud.isVisible()) {
            // La URL debe de cambiar
            await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);

            // El titulo debe estar visible
            await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();
        };
    });

    test('Boton Nueva Solicitud', async () => {
        // El listado de las solicitudes debe ser solicitado
        await expect(page.locator('text=SOLICITADO')).toBeVisible({timeout: 20000});

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

        // Cambiar el tipo de cuota
        await page.getByText('INSOLUTO').click()
        await page.getByText('SOLO INTERES').click();

        // Monto
        await page.locator('#loan_form_MONTO').click();
        await page.locator('#loan_form_MONTO').fill('50000');

        // Tasa
        const campoTasa = page.getByLabel('Tasa');
        await campoTasa.click();
        await campoTasa.clear();

        // Colocar una tasa por encima de lo permitido que es de 90%
        await campoTasa.fill('100');
        // Clickear fuera del campo
        await page.getByText('Plazo', {exact: true}).click();
        
        // Debe salir un modal
        await expect(page.locator('text=Tasa Máxima para esta oferta es: 99.00')).toBeVisible();
        // Click en Aceptar
        await page.locator('text=Aceptar').click();

        // Ingresar una Tasa Correcta
        await campoTasa.fill('10');

        // Plazo
        await page.getByPlaceholder('CANTIDAD').click();
        await page.getByPlaceholder('CANTIDAD').fill('48');

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
        // Elegir propiedad o vivienda
        await page.getByText('PROPIEDAD O VIVIENDA').click();

        // Destino o proposito
        await page.getByPlaceholder('Destino o propósito').click();
        await page.getByPlaceholder('Destino o propósito').fill('comprar una casa');

        // Los valores del monto, tasa y plazo deben estar correctos
        await expect(page.locator('#loan_form_MONTO')).toHaveValue('RD$ 50,000');
        await expect(page.locator('#loan_form_TASA')).toHaveValue('10%');
        await expect(page.locator('#loan_form_PLAZO')).toHaveValue('48');

        // Via desembolso
        await expect(page.getByText('Vía Desembolso')).toBeVisible();

        // El monto de la cuota debe estar visible
        await expect(page.locator('#loan_form_CUOTA')).toHaveValue('RD$ 416.67');

        // Click en guardar y continuar
        GuardaryContinuar();
    });

    test('Paso 3 - Cargos del prestamo', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=3`);

        // El titulo principal debe estar visible
        await expect(page.getByRole('heading', {name: 'CARGOS'})).toBeVisible();

        // Colocar una cantidad para los cargos
        const cargos = page.locator('(//td[@class="ant-table-cell montoPorcentajeSolicitud"])');
        await cargos.click({timeout: 20000});
        await page.locator('#VALOR').fill('50', {timeout: 20000});

        // Guardar los cargos
        await page.getByRole('button', {name: 'Guardar Cargos', }).click({timeout: 15000});

        // Boton de agregar cargos 
        const agregarCuota = page.locator('[aria-label="plus"]');
        await expect(agregarCuota).toBeVisible({timeout: 15000});
        await agregarCuota.click({timeout: 15000});
    
        // Debe salir un modal
        const modal = page.locator('text=AGREGAR CARGO');
        await expect(modal).toBeVisible();

        // Boton Cancelar
        await page.getByRole('dialog').getByRole('button', {name: 'stop Cancelar'}).click();

        // Debe salir un modal de confirmacion
        await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();

        // Click en aceptar
        await page.getByRole('dialog').getByRole('button', {name: 'check Aceptar'}).click();

        // El modal debe desaparecer
        await expect(modal).not.toBeVisible();

        // Deben aparecer dos alertas
        await expect(page.locator('text=Prestamo almacenado exitosamente.')).toBeVisible();
        await expect(page.locator('text=Cargos del préstamo guardados exitosamente.')).toBeVisible();

        // Cerrar las alertas
        await page.locator(`${ariaCerrar}`).first().click();
        await page.locator(`${ariaCerrar}`).last().click();
        
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
        await page.getByText('HIPOTECA', {exact: true}).click();

        // Elegir que el socio es propietario de la garantia
        await page.getByRole('checkbox').click();

        // Luego de seleccionar que el socio es el propietario de la garantia debe salir su nombre
        await expect(page.locator(`text=${nombre} ${apellido}`)).toBeVisible();

        // Valor tasado
        const valorTasado = page.getByPlaceholder('VALOR TASADO');
        await valorTasado.click();
        await valorTasado.fill('RD$ 63000');

        // Agregar atributos a la garantia
        await expect(page.locator('text=ATRIBUTOS DE LA GARANTÍA')).toBeVisible();

        // Los atributos de la garantia de hipoteca deben estar visible
        await expect(page.locator('text=SUPERFICIE')).toBeVisible();
        await expect(page.locator('text=LIBRO')).toBeVisible();
        await expect(page.locator('text=FOLIO')).toBeVisible();
        await expect(page.locator('text=UBICACIÓN')).toBeVisible();
        await expect(page.locator('text=MATRICULA')).toBeVisible();

        // Superficie
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(0).click();
        await page.getByPlaceholder('Valor Atributo').fill('Terreno');

        // Libro
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(0).click();
        await page.getByPlaceholder('VALOR ATRIBUTO').fill('2847');

        // Folio
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(1).click();
        await page.getByPlaceholder('VALOR ATRIBUTO').fill('3604');

        // Ubicacion
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(2).click();
        await page.getByPlaceholder('Valor Atributo').fill('La Vega');

        // Matricula
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(3).click();
        await page.getByPlaceholder('VALOR ATRIBUTO').fill('1550');

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

        // Click en finalizar
        await page.getByRole('button', {name: 'check Finalizar'}).click();

        // Debe salir un modal, diciendo que debe agregar los documentos necesarios
        await expect(page.getByText('Debe adjuntar todos los documentos requeridos.')).toBeVisible();
        // Click en aceptar
        await page.getByRole('button', {name: 'check Aceptar'}).click();
        
        // Subir Carta de Trabajo
        const subirCartaTrabajoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '4 CARTA DE TRABAJO upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirCartaTrabajo = await subirCartaTrabajoPromesa;
        await subirCartaTrabajo.setFiles(`${firma}`);

        // Esperar que la Carta de Trabajo se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])')).toBeVisible();

        // Subir Informe de Buro Credito
        const subirBuroCreditoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '3 INFORME BURO CREDITO (DATACREDITO) upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirBuroCredito = await subirBuroCreditoPromesa;
        await subirBuroCredito.setFiles(`${firma}`);

        // Esperar que el Buro Credito se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])').nth(1)).toBeVisible();
        
        // Subir Informe del Subgerente de Negocios
        const subirSubgerenteNegociosPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '14 INFORME DEL SUBGERENTE DE NEGOCIOS upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirSubgerenteNegocios = await subirSubgerenteNegociosPromesa;
        await subirSubgerenteNegocios.setFiles(`${firma}`);  

        // Esperar que el Informe del Subgerente de Negocios se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])').nth(2)).toBeVisible();
        
        // Subir Instancia de credito llena y firmada
        const subirInstanciaCreditoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '13 INSTANCIA DE CREDITO LLENA Y FIRMADA upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirInstanciaCredito = await subirInstanciaCreditoPromesa;
        await subirInstanciaCredito.setFiles(`${firma}`);

        // Esperar que la Instancia de Credito se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])').nth(3)).toBeVisible();

        // Subir Tabla de amortizacion
        const subirTablaAmortizacionPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '10 TABLA AMORTIZACION upload Cargar delete'}).getByRole('cell', {name: 'upload Cargar'}).locator('button').click();
        const subirTablaAmortizacion = await subirTablaAmortizacionPromesa;
        await subirTablaAmortizacion.setFiles(`${firma}`);

        // Esperar que la Tabla de Amortizacion se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])').nth(4)).toBeVisible();
        
        // Subir Cedula del Deudor
        const subirCedulaDeudorPromesa = page.waitForEvent('filechooser');
        await page.getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirCedulaDeudor = await subirCedulaDeudorPromesa;
        await subirCedulaDeudor.setFiles(`${firma}`);

        // Esperar que la Cedula se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])').nth(5)).toBeVisible();
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
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

        // La url debe de tener que la solicitud esta en estado solicitado
        await expect(page).toHaveURL(/\/solicitado/);

        // Ir a la seccion de datos prestamos 
        const datosPrestamos = page.getByRole('button', {name: '2 Datos Préstamos'})
        await expect(datosPrestamos).toBeVisible();
        await datosPrestamos.click();

        // La tasa debe estar visible y calculada
        const tasa = page.locator('#loan_form_CUOTA');
        await expect(tasa).toHaveAttribute('value', 'RD$ 416.67');
        
        // Ir a la ultima seccion 
        const seccionDocumentos = page.getByRole('button', {name: '9 Documentos'});
        await expect(seccionDocumentos).toBeVisible();
        await seccionDocumentos.click();

        // Los documentos deben estar visibles
        await expect(page.locator('div').filter({hasText: 'CARTA DE TRABAJO'}).nth(4)).toBeVisible();

        await expect(page.locator('div').filter({hasText: 'INFORME BURO CREDITO (DATACREDITO)'}).nth(4)).toBeVisible();

        await expect(page.locator('div').filter({hasText: 'INFORME DEL SUBGERENTE DE NEGOCIOS'}).nth(4)).toBeVisible();

        await expect(page.locator('div').filter({hasText: 'TABLA AMORTIZACION'}).nth(4)).toBeVisible();

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
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

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

    test('Cambiar de estado la solicitud de Aprobado a En Proceso y viceversa', async () => {
        // La url debe regresar a las solicitudes en proceso
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=en_proceso__analisis`);
        
        // Cambiar el estado de las solicitudes de En Proceso a Aprobado
        await page.locator('text=EN PROCESO (ANALISIS)').click();
        await page.locator('text=APROBADO').click();

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();

        // Dirigirse a la ultima seccion
        const seccionDesembolso = page.getByRole('button', {name: '10 Desembolso'});
        await expect(seccionDesembolso).toBeVisible();
        await seccionDesembolso.click();

        // Cambiar la categoria de la solicitud
        await page.getByRole('button', {name: 'ellipsis'}).click();
        // Debe estar visible el estado de solicitado
        await expect(page.getByText('SOLICITADO', {exact: true})).toBeVisible();
        // Cambiar el estado a Aprobado
        await page.getByText('EN PROCESO (ANALISIS)', {exact: true}).click();
        await expect(page.getByText('¿Está seguro que desea pasar el préstamo a estado EN PROCESO (ANALISIS)?')).toBeVisible();
        // Click en Aceptar 
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Cambiar el estado de las solicitudes de Aprobado a En Proceso
        const solicitudesAprobadas = page.getByText('APROBADO', {exact: true});
        await expect(solicitudesAprobadas).toBeVisible();
        await solicitudesAprobadas.click();
        await page.getByText('EN PROCESO (ANALISIS)', {exact: true}).click();

        // La url debe cambiar a las solicitudes en proceso
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=en_proceso__analisis`);

        // Elegir la solicitud 
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

        // Dirigirse a la ultima seccion
        const seccionAnalisis = page.getByRole('button', {name: '10 Análisis'});
        await expect(seccionAnalisis).toBeVisible();
        await seccionAnalisis.click();

        // El titulo de proceso, analisis debe estar visible
        await expect(page.getByRole('heading', {name: '(EN PROCESO (ANALISIS))'})).toBeVisible();

        // El nombre de la persona debe estar visible en un titulo
        await expect(page.getByRole('heading', {name: `${nombre} ${apellido}`})).toBeVisible();

        // El comentario anterior debe estar visible
        await expect(page.getByText('Credito Aprobado')).toBeVisible();

        // Cambiar la categoria de la solicitud
        await page.getByRole('button', {name: 'ellipsis'}).click();
        // Debe estar visible el estado de rechazado
        await expect(page.getByText('RECHAZADO', {exact: true})).toBeVisible();
        // Debe estar visible el estado de solicitado
        await expect(page.getByText('SOLICITADO', {exact: true})).toBeVisible();

        // Cmabiar el estado a Aprobado
        await page.getByText('APROBADO', {exact: true}).click();
        await page.getByText('¿Está seguro que desea pasar el préstamo a estado APROBADO?').click();   
        
        // Click en Aceptar y se debe abrir otra pagina con la solicitud
        const botonAceptar = page.getByRole('button', {name: 'check Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();
        
       // Esperar que se abra una nueva pestaña con la solicitud
       const page1 = await context.waitForEvent('page');
        
       // Cerrar la pagina con la solicitud 
       await page1.close();
    });

    test('Desembolsar la solicitud', async () => {
        // La url debe regresar a las solicitudes en proceso
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=en_proceso__analisis`);

        // Cambiar el estado de las solicitudes de En Proceso a Aprobado
        await page.locator('text=EN PROCESO (ANALISIS)').click();
        await page.locator('text=APROBADO').click();

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();

        // La url debe de tener que la solicitud esta en aprobado
        await expect(page).toHaveURL(/\/aprobado/);

        // Dirigirse a la ultima seccion
        const seccionDesembolso = page.getByRole('button', {name: '10 Desembolso'});
        await expect(seccionDesembolso).toBeVisible();
        await seccionDesembolso.click();

        // El nombre y el apellido del socio deben estar visibles
        await expect(page.getByText(`Socio: ${nombre} ${apellido}`)).toBeVisible();

        // Boton de cambiar estado de solicitud
        await page.getByRole('button', {name: 'ellipsis'}).click();
        // Debe estar visible el estado de rechazado
        await expect(page.getByText('EN PROCESO (ANALISIS)', {exact: true})).toBeVisible();
        // Debe estar visible el estado de solicitado
        await expect(page.getByText('SOLICITADO', {exact: true})).toBeVisible();  

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
        
        // Cerrar la pagina con el reporte 
        await page1.close();
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});