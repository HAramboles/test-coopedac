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
    formComentarios
} from './utils/dataTests';
import { diaActualFormato, unMesDespues, diaSiguiente, diaAnterior } from './utils/fechas';
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
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Pruebas
test.describe.serial('Pruebas con la Solicitud de Credito Hipotecaria - Persona Fisica', () => {
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
        // Click en garantia sin garantias
        await page.getByText('SIN GARANTIAS').click();

        // Oferta
        await page.getByLabel('Oferta').click();
        // Elegir credito hipotecaria
        await page.getByText('CRÉDITO DE CONSUMO').click();

        // Grupo
        await page.getByLabel('Grupo').click();
        await page.getByLabel('Grupo').fill('sin gara');
        // Elegir grupo sin garantia
        await page.getByRole('option', {name: 'SIN GARANTIA'}).click();

        // Esperar cinco segundos
        await page.waitForTimeout(5000);

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

        // El tipo de cuota debe ser insoluto
        await expect(page.getByText('INSOLUTO')).toBeVisible();

        // Monto
        await page.locator('#loan_form_MONTO').click();
        await page.locator('#loan_form_MONTO').fill('25000');

        // Tasa
        const campoTasa = page.getByLabel('Tasa');
        await expect(campoTasa).toHaveValue('1%');

        // Plazo
        await page.getByPlaceholder('CANTIDAD').click();
        await page.getByPlaceholder('CANTIDAD').fill('24');

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
        await page.getByRole('option', {name: 'CONSUMO'}).click();

        // Destino o proposito
        await page.getByPlaceholder('Destino o propósito').click();
        await page.getByPlaceholder('Destino o propósito').fill('Adquirir un producto');

        // Los valores del monto, tasa y plazo deben estar correctos
        await expect(page.locator('#loan_form_MONTO')).toHaveValue('RD$ 25,000');
        await expect(page.locator('#loan_form_TASA')).toHaveValue('1%');
        await expect(page.locator('#loan_form_PLAZO')).toHaveValue('24');

        // Via desembolso
        await expect(page.getByTitle('DEPOSITO A CUENTA')).toBeVisible();

        // El monto de la cuota debe estar visible
        await expect(page.locator('#loan_form_CUOTA')).toHaveValue('RD$ 1,052.55');

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

        // Esperar a que cargue la pagina
        await page.waitForTimeout(3000);
        
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
        await page.getByText('GARANTIA COMERCIAL', {exact: true}).click();

        // Elegir que el socio es propietario de la garantia
        await page.getByRole('checkbox').click();

        // Luego de seleccionar que el socio es el propietario de la garantia debe salir su nombre
        await expect(page.locator(`text=${nombre} ${apellido}`)).toBeVisible();

        // Valor tasado
        const valorTasado = page.getByPlaceholder('VALOR TASADO');
        await valorTasado.click();
        await valorTasado.fill('RD$ 25000');

        // Valor admisible
        await expect(page.locator(`${valorAdmisibleCredito}`)).toHaveValue('RD$ 25,000');

        // Agregar atributos a la garantia
        await expect(page.locator('text=ATRIBUTOS DE LA GARANTÍA')).toBeVisible();

        // El atributo de la garantia de consumo debe estar visible
        await expect(page.locator('text=NZA')).toBeVisible();

        // Atributo NZA
        const atributoNZA = page.locator('(//div[@class="editable-cell-value-wrap editable-cell-value-wrap-bordered undefined "])');
        await atributoNZA.click();
        await page.getByPlaceholder('Valor Atributo').clear();
        await page.getByPlaceholder('Valor Atributo').fill('3658');

        // Click en guardar
        await page.getByRole('button', {name: 'save Guardar'}).click();

        // Debe aparecer una alerta de que la garantia se guardo correctamente
        await expect(page.locator('text=Garantías del préstamo guardadas exitosamente.')).toBeVisible();

        // El modal de agregar garantia debe desaparecer
        await expect(modalAgregarGarantia).not.toBeVisible();

        // La garantia debe aparecer en la tabla de garantias
        await expect(page.getByRole('cell', {name: 'GARANTIA COMERCIAL'})).toBeVisible();

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
        
        // Subir Cedula del Deudor
        const subirCedulaDeudorPromesa = page.waitForEvent('filechooser');
        await page.getByRole('button', {name: 'upload Cargar'}).first().click();
        const subirCedulaDeudor = await subirCedulaDeudorPromesa;
        await subirCedulaDeudor.setFiles(`${firma}`);

        // Esperar que la Cedula se haya subido
       await expect(page.locator('text=Documentos requerdios del préstamo guardados exitosamente.')).toBeVisible();
    });

    test('Finalizar con la creacion de la Solicitud', async () => {
        // Boton de Finalizar
        const botonFinalizar = page.getByRole('button', {name: 'check Finalizar'});
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();

        // Esperar que se abran tres nuevas pestañas con los reportes
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');
        const page3 = await context.waitForEvent('page');

        // Cerrar todas las paginas
        await page3.close();
        await page2.close();
        await page1.close();
    });

    test('Cambiar el estado de la Solicitud de Solicitado a En Proceso (Analisis)', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);

        // Esperar que la pagina cargue
        await page.waitForTimeout(3000);

        // Buscar la solicitud creada
        await page.locator(`${formBuscar}`).fill(`${cedula}`);

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

        // Ir a la seccion de datos prestamos 
        const datosPrestamos = page.getByRole('button', {name: '2 Datos Préstamos'})
        await expect(datosPrestamos).toBeVisible();
        await datosPrestamos.click();

        // La tasa debe estar visible y calculada
        const tasa = page.locator('#loan_form_CUOTA');
        await expect(tasa).toHaveAttribute('value', 'RD$ 1,052.56');

        // la cuenta de cobros agregada debe estar visible
        await expect(page.locator('text=Cuentas de cobro')).toBeVisible();
        // await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).toBeVisible();
        // await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();
        
        // Ir a la ultima seccion 
        const seccionDocumentos = page.getByRole('button', {name: '9 Documentos'});
        await expect(seccionDocumentos).toBeVisible();
        await seccionDocumentos.click();

        // El documento de la cedula debe estar visible
        await expect(page.getByRole('link', {name: 'CEDULA DEUDOR'}).first()).toBeVisible();

        // Click en la firma de la Cedula deudor para visualizar
        await page.getByRole('link', {name: 'CEDULA DEUDOR'}).first().click();

        // Aprece un modal con la imagen de la firma
        await expect(page.getByRole('dialog', {name: 'CEDULA DEUDOR'})).toBeVisible();

        // Cerrar la imagen de la firma
        await page.getByRole('button', {name: 'Close'}).click();

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

        // Esperar que se abran tres nuevas pestañas con los reportes
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');
        const page3 = await context.waitForEvent('page');

        // Cerrar todas las paginas
        await page3.close();
        await page2.close();
        await page1.close();
    });

    test('Cambiar el estado de la Solicitud de En Proceso (Analisis) a Rechazado', async () => {
        // La url debe regresar a las solicitudes solicitadas
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);

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

        // Esperar que se abran tres nuevas pestañas con los reportes
        const page1 = await context.waitForEvent('page');
        const page2 = await context.waitForEvent('page');
        const page3 = await context.waitForEvent('page');

        // Cerrar todas las paginas
        await page3.close();
        await page2.close();
        await page1.close();
    });

    test('Buscar la Solicitud de Credito Rechazada', async () => {
        // La url debe regresar a las solicitudes en proceso
        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=en_proceso__analisis`);
        
        // Cambiar el estado de las solicitudes de En Proceso a Aprobado
        await page.locator('text=EN PROCESO (ANALISIS)').click();
        await page.locator('text=RECHAZADO').click();

        // Buscar la solicitud rechazada de la persona
        await page.locator(`${formBuscar}`).fill(`${cedula}`);

        // Debe aparecer la solicitud rechazada
        await expect(page.getByRole('row', {name: `CRÉDITO DE CONSUMO ${nombre} ${apellido} RD$ 25,000.00`})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});