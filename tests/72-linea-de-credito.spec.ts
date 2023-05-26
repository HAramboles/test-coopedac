import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, dataCerrar, selectBuscar, formBuscar } from './utils/dataTests';

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

test.describe('Prueba con la Solicitud de Credito', () => {
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
        cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
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

    test('Navegar a la opcion de Solicitud de Credito', async () => {
        test.slow();

        // Negocios
        await page.locator('text=NEGOCIOS').click();

        // Procesos
        await page.locator('text=PROCESOS').click();
        
        // Solicitud de Credito
        await page.locator('text=Solicitud de Crédito').click();

        // La URL debe cambiar
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
        await page.getByText('COMERCIALES').click();

        // Tipo de garantia
        await page.getByLabel('Tipo Garantía').click();
        // Click en garantia hipotecaria
        await page.getByText('AHORROS').click();

        // Oferta
        await page.getByLabel('Oferta').click();
        // Elegir credito hipotecaria
        await page.getByText('LÍNEA DE CRÉDITO').click();

        // Grupo
        await page.getByLabel('Grupo').click();
        await page.getByLabel('Grupo').fill('sin gara');
        // Elegir grupo sin garantia
        await page.getByRole('option', {name: 'SIN GARANTIA'}).click();

        // En el tipo de cuota se coloca automaticamente solo interes
        await expect(page.getByText('SOLO INTERES')).toBeVisible();

        // Monto
        await page.locator('#loan_form_MONTO').click();
        await page.locator('#loan_form_MONTO').fill('10000');

        // Tasa
        const campoTasa = page.getByLabel('Tasa');
        await campoTasa.clear();

        // Ingresar una Tasa 
        await campoTasa.fill('10');

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

        // Agregar un cuenta para cobrar
        await page.locator(`${selectBuscar}`).last().click();
        // La cuenta de aportaciones no debe estar visible
        await expect(page.locator('span').filter({hasText: 'APORTACIONES'})).not.toBeVisible(); 
        
        // Seleccionar la cueta de ahorros
        await page.getByText('AHORROS NORMALES').last().click();

        // Finalidad
        await page.getByLabel('Finalidad').click();
        // Elegir propiedad o vivienda
        await page.getByText('COMERCIO').click();

        // Destino o proposito
        await page.getByPlaceholder('Destino o propósito').click();
        await page.getByPlaceholder('Destino o propósito').fill('para poder iniciar un comercio');

        // Click en guardar y continuar
        GuardaryContinuar();
    });

    test('Paso 3 - Cargos del prestamo', async () => {
        test.slow();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=3`);

        // El titulo principal debe estar visible
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
        test.slow();
        
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
        test.slow();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1/create?step=7`);

        // Ocultar los codeudores
        await page.locator('(//SPAN[@class="sc-eDWCr hyDPNs"][text()="Codeudores"])').click();

        // El titulo de codeudores no debe mostrarse
        await expect(page.locator('h1').filter({hasText: 'CODEUDORES'})).not.toBeVisible();

        // Ocultar las garantias
        await page.locator('(//SPAN[@class="sc-eDWCr hyDPNs"][text()="Garantías"])').click();

        // El titulo de garantias no debe mostrarse
        await expect(page.locator('(//H1[@class="ant-typography css-lvymt"][text()="Garantías"])')).not.toBeVisible();

        // Debe mostrase solamente el titulo de garantias liquidas
        await expect(page.locator('h1').filter({hasText: 'GARANTÍAS LÍQUIDAS'})).toBeVisible();

        // Como no hay ninguna cuenta seleccionada debe estar un mensaje de error
        await expect(page.getByText('El monto máximo utilizable es RD$ 0.00')).toBeVisible();

        // Probar el funcionamiento correcto de la garantia de aportaciones

        // Click al boton de agregar garantia
        await page.getByRole('button', {name: 'Agregar Garantía'}).click();

        // Debe salir un modal para agregar la garantia liquida
        await expect(page.locator('h5').filter({hasText: 'AGREGAR GARANTÍA LÍQUIDA'})).toBeVisible();

        // Tipo cuenta
        const tipoCuenta = page.locator('#form_TIPO_CUENTA');
        await tipoCuenta.click();
        // Elegir la de aportaciones
        await page.getByRole('option', {name: 'APORTACIONES'}).click();

        // Click en el input de socio
        const buscarSocio = page.locator(`${selectBuscar}`);
        await buscarSocio.click();

        // Debe colocarse automaticamente el nombre del socio
        await expect(page.locator(`((//SPAN[@class="ant-select-selection-item"][text()=${nombre} ${apellido}])[2])`)).toBeVisible(); 

        // Cuenta
        await expect(page.locator('#form_TIPO_CUENTA_DESC')).toHaveValue('APORTACIONES');

        // Colocar una garantia de ahorros

        // Cambiar el tipo de cuenta
        await tipoCuenta.click();
        // Elegir la cuenta de ahorros
        await page.getByRole('option', {name: 'AHORROS NORMALES'}).click();

        // Buscar nuevamente la cuenta del socio
        await buscarSocio.fill(`${nombre} ${apellido}`);
        // Elegir la cuenta del socio
        await page.getByRole('option', {name: `| ${nombre} ${apellido}`}).click();

        // Cuenta
        await expect(page.locator('#form_TIPO_CUENTA_DESC')).toHaveValue('AHORROS NORMALES');

        // Debe mostrarse el monto utilizable de la cuenta de ahorros
        await expect(page.getByText('El monto máximo utilizable es RD$ 22,770.00')).toBeVisible();

        // Seleccionar un monto a usar
        await page.locator('#form_VALOR_ADMISIBLE').fill('10000');

        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // El modal debe desaparecer
        await expect(page.locator('h5').filter({hasText: 'AGREGAR GARANTÍA LÍQUIDA'})).not.toBeVisible();

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
        
        // Subir Cedula Deudor
        const subirCartaTrabajoPromesa = page.waitForEvent('filechooser');
        await page.getByRole('row', {name: '1 CEDULA DEUDOR upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirCartaTrabajo = await subirCartaTrabajoPromesa;
        await subirCartaTrabajo.setFiles(`${firma}`);

        // Esperar que la Cedula del Deudor se haya subido
        await expect(page.locator('(//div[@class="ant-upload-list-item ant-upload-list-item-done"])')).toBeVisible();
    });

    test('Finalizar con la creacion de la Solicitud', async () => {
        // Boton de Finalizar
        const botonFinalizar = page.getByRole('button', {name: 'check Finalizar'});
        // Esperar que se abra una nueva pestaña
        const [newPage, newPage2, newPage3] = await Promise.all([
            context.waitForEvent('page'),
            context.waitForEvent('page'),
            // Por ahora saldran 3 reportes
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonFinalizar).toBeVisible(),
            await botonFinalizar.click()
        ]);
        
        // Cerrar la pagina con la solicitud
        await newPage.close();

        // Cerrar la pagina con la tabla de amortizacion
        await newPage2.close();

        // Cerrar la pagina con el tercer reporte
        await newPage3.close();
    });

    test('Cambiar el estado de la Solicitud de Solicitado a En Proceso (Analisis)', async () => {
        test.slow();

        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=solicitado`);

        // Buscar la solicitud
        await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'}).click();

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();

        // La url debe de tener que la solicitud esta en estado solicitado
        await expect(page).toHaveURL(/\/solicitado/);

        // Ir a la seccion de datos prestamos 
        const datosPrestamos = page.getByRole('button', {name: '2 Datos Préstamos'})
        await expect(datosPrestamos).toBeVisible();
        await datosPrestamos.click();

        // La tasa debe estar visible y calculada
        const tasa = page.locator('#loan_form_CUOTA');
        await expect(tasa).toHaveAttribute('value', 'RD$ 16.67');
        
        // Ir a la ultima seccion 
        const seccionDocumentos = page.getByRole('button', {name: '9 Documentos'});
        await expect(seccionDocumentos).toBeVisible();
        await seccionDocumentos.click();

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
        // Esperar que se abra una nueva pestaña
        const [newPage, newPage2, newPage3] = await Promise.all([
            context.waitForEvent('page'),
            context.waitForEvent('page'),
            // Por ahora saldran 3 reportes
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]);
        
        // Cerrar la pagina con la solicitud
        await newPage.close();

        // Cerrar la pagina con la tabla de amortizacion
        await newPage2.close();

        // Cerrar la pagina con el tercer reporte
        await newPage3.close();
    });

    test('Cambiar el estado de la Solicitud de En Proceso (Analisis) a Aprobado', async () => {
        test.slow();

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
        test.slow();
        
        // La url debe regresar a las solicitudes en proceso
        await expect(page).toHaveURL(`${url_base}/solicitud_credito/01-3-3-1?filter=en_proceso__analisis`);

        // Cambiar el estado de las solicitudes de En Proceso a Aprobado
        await page.locator('text=EN PROCESO (ANALISIS)').click();
        await page.locator('text=APROBADO').click();

        // Elegir la solicitud creada anteriormente
        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'eye'}).click();

        // La url debe de tener que la solicitud esta en proceso
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

        // Desembolsar todo
        const desembolsarTodo = page.getByRole('checkbox');
        await desembolsarTodo.click();

        // Debe estar marcado el checkbox de desembolsar todo
        await expect(desembolsarTodo).toBeChecked();

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