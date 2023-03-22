import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Imagen de los documentos
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Pruebas

test.describe('Prueba con la Solicitud de Credito', () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: true,
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json',
        });

        // Crear una nueva page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    // Funcion con el boton de continuar, que se repite en cada seccion del registro
    const GuardaryContinuar = async () => {
        // continuar
        const botonGuardaryContinuar = page.locator('button:has-text("Guardar y Continuar")');
        // presionar el boton
        await botonGuardaryContinuar.click();
    };

    test('Navegar a la opcion de Solicitud de Credito', async () => {
        // Negocios
        await page.locator('text=NEGOCIOS').click();

        // Procesos
        await page.locator('text=PROCESOS').click();
        
        // Solicitud de Credito
        await page.locator('text=Solicitud de Crédito').click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);
    });

    test('Probar el boton de Cancelar', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();

        // El listado de las transferencias debe ser solicitado
        await expect(page.locator('text=SOLICITADO')).toBeVisible();

        // Boton Nueva Solicitud
        const botonNuevaSolicitud = page.locator('text=Nueva Solicitud');
        await expect(botonNuevaSolicitud).toBeVisible();
        await botonNuevaSolicitud.click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=1`);

        // Boton de Cancelar
        const botonCancelar = page.getByRole('button', {name: 'stop Cancelar'});
        await expect(botonCancelar).toBeVisible();
        // Click al boton
        await botonCancelar.click();

        // Debe salir un modal
        await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();

        // Click en Aceptar
        await page.locator('text=Aceptar').click();

        // Debe regresar al inicio
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);
    });

    test('Boton Nueva Solicitud', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();

        // El listado de las transferencias debe ser solicitado
        await expect(page.locator('text=SOLICITADO')).toBeVisible();

        // Boton Nueva Solicitud
        const botonNuevaSolicitud = page.locator('text=Nueva Solicitud');
        await expect(botonNuevaSolicitud).toBeVisible();
        await botonNuevaSolicitud.click();
    });

    test('Paso 1 - Datos del Solicitante', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=1`);

        // Deben estar visibles los tres titulos del primer paso
        await expect(page.getByRole('heading', { name: 'Solicitante', exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Datos del Solicitante' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Lugar de Trabajo Solicitante' })).toBeVisible();

        // Cedula almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));

        // Buscar al socio
        await page.locator('#select-search').fill(`${cedula}`);
        // Seleccionar al socio
        await page.locator(`text=${cedula}`).click();

        // Nombres y apellidos almacenados en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // El nombre de la persona debe estar visible
        await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

        // Ver la firma del solicitante
        const botonVerFirmas = page.locator('text=Ver firmas');
        await expect(botonVerFirmas).toBeVisible();
        await botonVerFirmas.click();

        // Se debe mostrar la firma
        await expect(page.locator('(//img[@class="ant-image-preview-img"])')).toBeVisible();

        // Cerrar la imagen de la firma
        await page.locator('[data-icon="close"]').click();

        // Click al boton de guardar y continuar 
        GuardaryContinuar();

        // Se debe mostrar un modal
        await expect(page.locator('text=No se ha actualizado la información laboral de la persona. ¿Desea continuar?')).toBeVisible();
        // Click en Aceptar
        await page.locator('text=Aceptar').click();
    });

    test('Paso 2 - Datos Prestamo', async () => {
        // La URL debe cambiar
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
        await page.getByRole('option', { name: 'SIN GARANTIA' }).click();

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
        await page.getByText('Plazo').click();
        
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

        // Cambiar el tipo de cuota
        await page.getByText('INSOLUTO').click()
        await page.getByText('SOLO INTERES').click();

        // Finalidad
        await page.getByLabel('Finalidad').click();
        // Elegir propiedad o vivienda
        await page.getByText('PROPIEDAD O VIVIENDA').click();

        // Destino o proposito
        await page.getByPlaceholder('Destino o propósito').click();
        await page.getByPlaceholder('Destino o propósito').fill('comprar una casa');

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
        await cargos.click();
        await page.locator('#VALOR').fill('50');

        // Guardar los cargos
        await page.getByRole('button', {name: 'Guardar Cargos'}).click();

        // Boton de agregar cuotas
        const agregarCuota = page.locator('[aria-label="plus"]');
        await expect(agregarCuota).toBeVisible();
        await agregarCuota.click();

        // Debe salir un modal
        await expect(page.locator('text=AGREGAR CARGO')).toBeVisible();
        // Cerrar el modal
        await page.getByRole('button', {name: 'Close'}).click();

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
        GuardaryContinuar()
    });

    test('Paso 6 - Representantes legales', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=6`);

        // El titulo principal debe estar visible
        await expect(page.getByRole('heading', {name: 'REPRESENTANTES LEGALES'})).toBeVisible();

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
        await page.getByLabel('', { exact: true }).check();

        // Nombre y apellido de la persona
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Luego de seleccionar que el socio es el propietario de la garantia debe salir su nombre
        await expect(page.locator(`text=${nombre} ${apellido}`)).toBeVisible();

        // Valor tasado
        const valorTasado = page.getByPlaceholder('VALOR TASADO');
        await valorTasado.click();
        await valorTasado.fill('RD$ 63000');

        // Agregar atributos a la garantia
        await expect(page.locator('text=ATRIBUTOS DE LA GARANTÍA')).toBeVisible();

        // Los atributos de la garantia de hipoteca deben estar visible
        await expect(page.locator('text=MATRICULA')).toBeVisible();
        await expect(page.locator('text=SUPERFICIE_')).toBeVisible();
        await expect(page.locator('text=LIBRO')).toBeVisible();
        await expect(page.locator('text=FOLIO')).toBeVisible();
        await expect(page.locator('text=UBICACIÓN_')).toBeVisible();

        // Matricula
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(0).click();
        await page.getByPlaceholder('VALOR ATRIBUTO').fill('1550');

        // Superficie
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(0).click();
        await page.getByPlaceholder('Valor Atributo').fill('Terreno');

        // Libro
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(1).click();
        await page.getByPlaceholder('VALOR ATRIBUTO').fill('2847');

        // Folio
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(2).click();
        await page.getByPlaceholder('VALOR ATRIBUTO').fill('3604');

        // Ubicacion
        await page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])').nth(3).click();
        await page.getByPlaceholder('Valor Atributo').fill('La Vega');

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
        // Esperar que se abra una nueva pestaña
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonFinalizar).toBeVisible(),
            await botonFinalizar.click()
        ]);
        
        // Cerrar la pagina con la solicitud
        await newPage.close();
    });

    test('Cambiar el estado de la Solicitud de Solicitado a En Proceso (Analisis)', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);

        // Nombres y apellidos almacenados en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

        // La url debe de tener que la solicitud esta en solicitado
        await expect(page).toHaveURL(/\/solicitado/);

        // Ir a la seccion de datos prestamos 
        await page.getByRole('button', {name: '2 Datos Préstamos'}).click();

        // La tasa debe estar visible y calculada
        const tasa = page.locator('#loan_form_CUOTA');
        await expect(tasa).toHaveAttribute('value', 'RD$ 416.67');
        
        // Ir a la ultima seccion 
        await page.getByRole('button', {name: '9 Documentos'}).click();

        // Los documentos deben estar visibles
        await expect(page.locator('div').filter({hasText: 'CARTA DE TRABAJO'}).nth(4)).toBeVisible();

        await expect(page.locator('div').filter({hasText: 'INFORME BURO CREDITO (DATACREDITO)'}).nth(4)).toBeVisible();

        await expect(page.locator('div').filter({hasText: 'INFORME DEL SUBGERENTE DE NEGOCIOS'}).nth(4)).toBeVisible();

        await expect(page.locator('div').filter({hasText: 'TABLA AMORTIZACION'}).nth(4)).toBeVisible();

        await expect(page.locator('div').filter({hasText: 'CEDULA DEUDOR'}).nth(4)).toBeVisible();

        // Cambiar el estado de la solicitud
        await page.getByRole('button', {name: 'ellipsis'}).click();
        await page.getByText('EN PROCESO (ANALISIS)').click();
        
        // Debe salir un modal de confirmacion
        await expect(page.getByText('¿Está seguro que desea pasar el préstamo a estado EN PROCESO (ANALISIS)?')).toBeVisible();

        // Click en Aceptar y se debe abrir otra pagina con la solicitud
        const botonAceptar = page.getByRole('button', {name: 'check Aceptar'});
        // Esperar que se abra una nueva pestaña
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]);
        
        // Cerrar la pgina con la solicitud
        await newPage.close();
    });

    test('Cambiar el estado de la Solicitud de En Proceso (Analisis) a Aprobado', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);

        // Cambiar el estado de las solicitudes de Solicitado a En Proceso (Analisis)
        await page.locator('text=SOLICITADO').click();
        await page.locator('text=EN PROCESO (ANALISIS)').click();

        // Nombres y apellidos almacenados en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

        // La url debe de tener que la solicitud esta en proceso
        await expect(page).toHaveURL(/\/en_proceso_analisis/);

        // Dirigirse a la ultima seccion
        await page.getByRole('button', {name: '10 Análisis'}).click();

        // El titulo de proceso, analisis debe estar visible
        await expect(page.getByRole('heading', {name: '(EN PROCESO (ANALISIS))'})).toBeVisible();

        // El nombre de la persona debe estar visible en un titulo
        await expect(page.getByRole('heading', {name: `${nombre} ${apellido}`})).toBeVisible();

        // Agregar un comentario
        const campoComentario = page.getByPlaceholder('Comentario');
        await campoComentario.fill('Credito Aprobado');
        // Guardar Comentario
        await page.getByRole('button', {name: 'Guardar'}).click();

        // Cambiar la categoria de la solicitud
        await page.getByRole('button', {name: 'ellipsis'}).click();
        await page.getByText('APROBADO', {exact: true}).click();
        await page.getByText('¿Está seguro que desea pasar el préstamo a estado APROBADO?').click();   
        
        // Click en Aceptar y se debe abrir otra pagina con la solicitud
        const botonAceptar = page.getByRole('button', {name: 'check Aceptar'});
        // Esperar que se abra una nueva pestaña
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]);
        
        // Cerrar la pagina con la solicitud
        await newPage.close();
    });

    test('Desembolsar la solicitud', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=en_proceso__analisis`);

        // Cambiar el estado de las solicitudes de Solicitado a Aprobado
        await page.locator('text=EN PROCESO (ANALISIS)').click();
        await page.locator('text=APROBADO').click();

        // Nombres y apellidos almacenados en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();

        // La url debe de tener que la solicitud esta en proceso
        await expect(page).toHaveURL(/\/aprobado/);

        // Dirigirse a la ultima seccion
        await page.getByRole('button', {name: '10 Desembolso'}).click();

        // EL boton de Imprimir Solicitud debe estar visible
        const botonImprimirContrato = page.getByRole('button', {name: 'Imprimir Contrato'});
        await expect(botonImprimirContrato).toBeVisible();

        // Desembolsar la solicitud
        const botonDesembolsar = page.getByRole('button', {name: 'Desembolsar'});
        // Esperar que se abra una nueva pestaña
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonDesembolsar).toBeVisible(),
            await botonDesembolsar.click()
        ]);
        
        // Cerrar la pagina con la solicitud
        await newPage.close();
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});