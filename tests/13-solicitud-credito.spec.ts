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
        const botonNuevaSolicitud = page.locator('text= Nueva Solicitud');
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
        const botonNuevaSolicitud = page.locator('text= Nueva Solicitud');
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
        await page.locator(`${cedula}`).click();

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
        await page.getByLabel('Tasa').click();
        await page.getByLabel('Tasa').fill('10');

        // Plazo
        await page.getByPlaceholder('CANTIDAD').click();
        await page.getByPlaceholder('CANTIDAD').fill('48');

        // Los plazos deben ser mensuales
        await expect(page.locator('text=MENSUAL')).toBeVisible();

        // Cambiar el tipo de cuota
        await page.getByText('INSOLUTO').click();
        await page.getByText('NIVELADA').click();

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
        await page.getByRole('button', { name: 'Guardar Cargos' }).click();

        // Click en actualizar y continuar
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

        // Los tres titulos de la seccion deben estar visibles
        await page.getByRole('heading', {name: 'Codeudores', exact: true}).click();
        await page.getByRole('heading', {name: 'Garantías', exact: true}).click();
        await page.getByRole('heading', {name: 'Garantías Líquidas', exact: true}).click();

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

        // Valor tasado
        await page.getByPlaceholder('VALOR TASADO').click();
        await page.getByPlaceholder('VALOR TASADO').fill('RD$ 6,3000');

        // Agregar atributos a la garantia
        

        // Click en guardar
        await page.getByRole('button', { name: 'save Guardar' }).click();

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
        await page.getByRole('button', { name: 'check Finalizar' }).click();

        // Debe salir un modal, diciendo que debe agregar los documentos necesarios
        await expect(page.getByText('Debe adjuntar todos los documentos requeridos.')).toBeVisible();
        // Click en aceptar
        await page.getByRole('button', { name: 'check Aceptar' }).click();

        // Subir Carta de Trabajo
        const subirCartaTrabajoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', { name: '4 CARTA DE TRABAJO upload Cargar delete' }).getByRole('button', { name: 'upload Cargar' }).first().click();
        const subirCartaTrabajo = await subirCartaTrabajoPromesa;
        await subirCartaTrabajo.setFiles(`${firma}`);
        
        // Subir Informe de Buro Credito
        const subirBuroCreditoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', { name: '3 INFORME BURO CREDITO (DATACREDITO) upload Cargar delete' }).getByRole('button', { name: 'upload Cargar' }).first().click();
        const subirBuroCredito = await subirBuroCreditoPromesa;
        await subirBuroCredito.setFiles(`${firma}`);
        
        // Subir Informe del Subgerente de Negocios
        const subirSubgerenteNegociosPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', { name: '14 INFORME DEL SUBGERENTE DE NEGOCIOS upload Cargar delete' }).getByRole('button', { name: 'upload Cargar' }).first().click();
        const subirSubgerenteNegocios = await subirSubgerenteNegociosPromesa;
        await subirSubgerenteNegocios.setFiles(`${firma}`);
        
        // Subir Instancia de credito llena y firmada
        const subirInstanciaCreditoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', { name: '13 INSTANCIA DE CREDITO LLENA Y FIRMADA upload Cargar delete' }).getByRole('button', { name: 'upload Cargar' }).first().click();
        const subirInstanciaCredito = await subirInstanciaCreditoPromesa;
        await subirInstanciaCredito.setFiles(`${firma}`);
        
        // Subir Tabla de amortizacion
        const subirTablaAmortizacionPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', { name: '10 TABLA AMORTIZACION upload Cargar delete' }).getByRole('cell', { name: 'upload Cargar' }).locator('button').click();
        const subirTablaAmortizacion = await subirTablaAmortizacionPromesa;
        await subirTablaAmortizacion.setFiles(`${firma}`);
        
        // Subir Cedula del Deudor
        const subirCedulaDeudorPromesa = page.waitForEvent('filechooser');
        await page.getByRole('button', { name: 'upload Cargar' }).first().click();
        const subirCedulaDeudor = await subirCedulaDeudorPromesa;
        await subirCedulaDeudor.setFiles(`${firma}`);
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
        
        // Cerrar la pgina con la solicitud
        await newPage.close();
    });

    test('Cambiar el estado de la Solicitud de Solicitado a En Proceso (Analisis)', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);

        // Nombres y apellidos almacenados en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `CRÉDITO HIPOTECARIO ${nombre} ${apellido} edit file-search delete`}).getByRole('button', {name: 'edit'}).click();
        // await page.getByRole('row', {name: 'JULIA RAQUEL BEATO'}).getByRole('button', {name: 'edit'}).click();

        // Ir a la ultima seccion 
        await page.getByRole('button', { name: '9 Documentos' }).click();

        // Cambiar el estado de la solicitud
        await page.getByRole('button', { name: 'ellipsis' }).click();
        await page.getByText('EN PROCESO (ANALISIS)').click();
        
        // Debe salir un modal de confirmacion
        await expect(page.getByText('¿Está seguro que desea pasar el préstamo a estado EN PROCESO (ANALISIS)?')).toBeVisible();

        // Click en Aceptar y se debe abrir otra pagina con la solicitud
        const botonAceptar = page.getByRole('button', { name: 'check Aceptar' });
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
        // await page.getByRole('row', {name: 'JULIA RAQUEL BEATO'}).getByRole('button', {name: 'edit'}).click();

        // La url debe de tener que la solicitud esta en proceso
        await expect(page).toHaveURL(/\/en_proceso_analisis/);

        // Dirigirse a la ultima seccion
        await page.getByRole('button', { name: '10 Análisis' }).click();

        // El titulo de proceso, analisis debe estar visible
        await expect(page.getByRole('heading', {name: '(EN PROCESO (ANALISIS))'})).toBeVisible();

        // El nombre de la persona debe estar visible en un titulo
        await expect(page.getByRole('heading', {name: `${nombre} ${apellido}`})).toBeVisible();
        // await expect(page.getByRole('heading', {name: 'JULIA RAQUEL BEATO'})).toBeVisible();

        // Agregar un comentario
        /*
        await page.getByRole('button', {name: 'edit'}).click();
        const campoComentario = page.getByPlaceholder('Comentario');
        await campoComentario.fill('');
        await campoComentario.fill('COMENTARIO 2');
        await page.getByRole('button', {name: 'save'}).click();
        */

        // Cambiar la categoria de la solicitud
        await page.getByRole('button', { name: 'ellipsis' }).click();
        await page.getByText('APROBADO').click();
        await page.getByText('¿Está seguro que desea pasar el préstamo a estado APROBADO?').click();   
        
        // Click en Aceptar y se debe abrir otra pagina con la solicitud
        const botonAceptarr = page.getByRole('button', {name: 'check Aceptar'});
        // Esperar que se abra una nueva pestaña
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonAceptarr).toBeVisible(),
            await botonAceptarr.click()
        ]);
        
        // Cerrar la pgina con la solicitud
        await newPage.close();
    });

    test('Desembolsar la solicitud', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);

        // Cambiar el estado de las solicitudes de Solicitado a Aprobado
        await page.locator('text=SOLICITADO').click();
        await page.locator('text=APROBADO').click();

        // Nombres y apellidos almacenados en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();
        // await page.getByRole('row', {name: 'JULIA RAQUEL BEATO'}).getByRole('button', {name: 'edit'}).click();

        // La url debe de tener que la solicitud esta en proceso
        await expect(page).toHaveURL(/\/aprobado/);

        // Dirigirse a la ultima seccion
        await page.getByRole('button', {name: '10 Desembolso'}).click();

        // Cuenta de desembolso
        await page.locator('#form_ID_CUENTA_DESEMBOLSO').click();
        // Elegir una cuenta de ahorros
        await page.locator('test=AHORROS NORMALES').click();

        // Desembolsar la solicitud
        await page.getByRole('button', {name: 'Desembolsar'}).click();
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});