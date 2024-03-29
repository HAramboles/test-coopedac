import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { 
    dataCerrar, 
    selectBuscar, 
    formBuscar, 
    inputFechaSolicitud, 
    inputPrimerPago, 
    dataVer,
    buscarPorNombre,
    crearBuscarPorCedula
} from './utils/data/inputsButtons';
import { url_base, url_solicitud_credito } from './utils/dataPages/urls';
import { diaActualFormato, unMesDespues, diaSiguiente, diaAnterior } from './utils/functions/fechas';
import { EscenariosEliminarSolicitudCredito } from './utils/dataPages/interfaces';
import { browserConfig, contextConfig } from './utils/data/testConfig';

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

// Pruebas
test.describe.serial('Pruebas Creando y Anulando una Solicitud de Credito', async () => {
    // Prueba 1 - Creando la Solicitud de Credito
    test.describe.serial('Prueba con la Solicitud de Credito', () => {
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
            // Click a credito comerciales
            await page.getByText('COMERCIALES').click();

            // Tipo de garantia
            await page.getByLabel('Tipo Garantía').click();
            // Click en garantia ahorros
            await page.getByText('CERTIFICADOS', {exact: true}).click();

            // Oferta
            await page.getByLabel('Oferta').click();
            // Elegir credito agricola
            await page.getByText('CRÉDITO AGRÍCOLA').click();

            // Grupo
            await page.getByLabel('Grupo').click();
            await page.getByLabel('Grupo').fill('sin gara');
            // Elegir grupo sin garantia
            await page.getByRole('option', {name: 'SIN GARANTIA'}).click();

            // Tipo de cuota
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
            await page.locator('#loan_form_MONTO').fill('300000');

            // Plazo
            await page.getByPlaceholder('CANTIDAD').click();
            await page.getByPlaceholder('CANTIDAD').fill('24');

            // Los plazos deben ser semestrales
            await expect(page.locator('text=SEMESTRAL')).toBeVisible();

            // La tasa debe tener un valor por defecto
            await expect(page.locator('#loan_form_TASA')).toHaveValue('13.95%');

            // Agregar una cuenta del socio para desembolsar
            await page.locator(`${selectBuscar}`).first().click();
            // La cuenta de aportaciones no debe estar visible
            await expect(page.locator('span').filter({hasText: 'APORTACIONES'})).not.toBeVisible(); 

            // Seleccionar la cuenta de ahorros
            await page.getByText('AHORROS NORMALES').click();

            // Finalidad
            await page.getByLabel('Finalidad').click();
            // Elegir agropecuario
            await page.getByRole('option', {name: 'AGROPECUARIO'}).click();

            // Destino o proposito
            await page.getByPlaceholder('Destino o propósito').click();
            await page.getByPlaceholder('Destino o propósito').fill('Criar Gallinas');

            // Via desembolso
            await expect(page.getByText('Vía Desembolso')).toBeVisible();

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
        });

        test('Paso 2 - Datos Prestamo - Cambiar de Oferta', async () => {
            // La URL no debe cambiar
            await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=2`);

            // El titulo principal debe estar visible
            const tituloPrincipal = page.getByRole('heading', {name: 'Generales del Crédito'});
            await expect(tituloPrincipal).toBeVisible();

            // Tipo de credito
            await page.locator('#loan_form').getByText('COMERCIALES').click();
            // Click a credito consumo
            await page.getByRole('option', {name: 'CONSUMO'}).getByText('CONSUMO').click();

            // Tipo de garantia
            await page.getByLabel('Tipo Garantía').click();
            // Click en garantia ahorros
            await page.getByText('AHORROS', {exact: true}).click();

            // Oferta
            await page.getByTitle('CRÉDITO AGRÍCOLA').click();
            // Elegir credito gerencial / ahorros
            await page.getByText('CRÉDITO GERENCIAL / AHORROS -1M').click();

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

            // Tipo de cuota
            await expect(page.getByText('INSOLUTO')).toBeVisible();

            // Monto
            await page.locator('#loan_form_MONTO').click();
            await page.locator('#loan_form_MONTO').fill('20000');

            // Tasa
            const campoTasa = page.getByLabel('Tasa');
            await campoTasa.click();
            await campoTasa.clear();;

            // Ingresar una Tasa 
            await campoTasa.fill('5');

            // Plazo
            await page.getByPlaceholder('CANTIDAD').click();
            await page.getByPlaceholder('CANTIDAD').fill('24');

            // Los plazos deben ser mensuales
            await expect(page.locator('text=MENSUAL')).toBeVisible();

            // La cuenta de desembolso debe estar vacia
            await expect(page.locator(`${selectBuscar}`).first()).toHaveValue('');

            // Agregar una cuenta del socio para desembolsar
            await page.locator(`${selectBuscar}`).first().click();
            // La cuenta de aportaciones no debe estar visible
            await expect(page.locator('span').filter({hasText: 'APORTACIONES'})).not.toBeVisible(); 

            // Seleccionar la cuenta de ahorros
            await page.getByText('AHORROS NORMALES | ').click();
            
            // Los valores del monto, tasa y plazo deben estar correctos
            await expect(page.locator('#loan_form_MONTO')).toHaveValue('RD$ 20,000');
            await expect(page.locator('#loan_form_TASA')).toHaveValue('5%');
            await expect(page.locator('#loan_form_PLAZO')).toHaveValue('24');

            // Via desembolso
            await expect(page.getByText('Vía Desembolso')).toBeVisible();

            // Finalidad
            await page.getByLabel('Finalidad').click();
            // Elegir agropecuario
            await page.getByRole('option', {name: 'CONSUMO'}).click();

            // Destino o proposito
            await page.getByPlaceholder('Destino o propósito').click();
            await page.getByPlaceholder('Destino o propósito').fill('Asuntos Personales');

            // Seccion Cuentas de Cobros
            await expect(page.locator('text=Cuentas de cobro')).toBeVisible();

            // La cuenta de cobro debe desaparecer al cambiar la oferta
            await expect(page.getByRole('cell', {name: 'AHORROS NORMALES'})).not.toBeVisible();
            await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).not.toBeVisible();
            
            // Agregar una cuenta de Cobro
            await page.locator(`${selectBuscar}`).last().click();

            // Seleccionar la cuenta de ahorros
            await page.getByRole('option', {name: 'AHORROS NORMALES'}).last().click();

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

        test('Paso 5 - Codeudores y Garantias', async () => {
            // La URL debe cambiar
            await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=5`);

            // Debe mostrase solamente el titulo de garantias liquidas
            await expect(page.locator('h1').filter({hasText: 'GARANTÍAS LÍQUIDAS'})).toBeVisible();

            // Debe mostrarse un aviso indicando el tipo de garantia que se debe agregar a la solicitud
            await expect(page.getByText('Oferta require Garantía(s) Líquidas del siguiente tipo: AHORROS.')).toBeVisible();

            // Debe mostrarse un mensaje de informacion
            await expect(page.getByText('Si agrega más de una garantia tenga en cuanta que estas se despignoran en el mismo orden que son agregadas.')).toBeVisible();

            // Click al boton de agregar garantia
            await page.getByRole('button', {name: 'Agregar Garantia Liquida'}).click();

            // Debe salir un modal para agregar la garantia liquida
            await expect(page.getByRole('heading', {name: 'Agregar Garantía Líquida'}).first()).toBeVisible();

            // El modal debe tener por defecto, el tipo de cuenta Ahorros Normales
            await expect(page.getByText('AHORROS NORMALES').first()).toBeVisible();

            // Click al selector para buscar socios
            await page.locator(`${selectBuscar}`).nth(1).click();

            // Debe mostrarse la cuenta de Ahorros Normales de la persona
            const cuentaAhorros = page.getByRole('option', {name: 'AHORROS NORMALES'});
            await expect(cuentaAhorros).toBeVisible();
            // Click a la opcion de la cuenta de ahorros de la persona
            await cuentaAhorros.click();

            // Se debe agregar la cuenta seleccionada
            await expect(page.locator('#form_TIPO_CUENTA_DESC').first()).toHaveValue('AHORROS NORMALES');

            // Ingresar un monto mayor al monto del prestamo
            const inputMontoPrestamo = page.getByRole('spinbutton', {name: 'VALOR DE LA GARANTÍA'});
            await inputMontoPrestamo.fill('50000');

            // Boton de Aceptar del modal de Agregar Garantia Liquida
            const botonAceptarModal = page.getByRole('button', {name: 'Aceptar'}).nth(1);
            await expect(botonAceptarModal).toBeVisible();
            await botonAceptarModal.click();

            // Debe aparecer una alerta de error
            await expect(page.getByText('El total de las garantías no debe ser mayor al monto del préstamo.')).toBeVisible();

            // Ingresar la mitad del monto solicitado
            await inputMontoPrestamo.clear();
            await inputMontoPrestamo.fill('10000');

            // Click fuera del input y al mismo tiempo debe mostrarse el monto maximo a utilizar
            await page.locator('text=El monto máximo utilizable es').nth(1).click();

            // Click al boton de Aceptar del modal
            await botonAceptarModal.click();

            // Esperar que la garantia se agregue a la tabla
            await page.waitForTimeout(2000);

            // Debe agregarse la cuenta de la garantia liquida agregada
            await expect(page.getByRole('cell', {name: `${nombre} ${apellido}`})).toBeVisible();

            // Editar la garantia agregada y colocar el monto correcto
            await page.getByText('RD$$ 10,000.00').click();
            await page.locator('#MONTO_PIGNORADO').click();
            await page.locator('#MONTO_PIGNORADO').fill('20000');

            // Click fuera del input
            await page.getByRole('columnheader', {name: 'Tipo Cuenta'}).click();

            // Esperar a que se agregue el nuevo monto de la garantia
            await page.waitForTimeout(1000);

            // Debe mostrarse la garantia liquida en la tabla
            await expect(page.getByText('RD$$ 20,000.00')).toBeVisible();

            // Click en actualizar y continuar
            GuardaryContinuar();
        });

        test('Paso 6 - Documentos', async () => {
            // La URL debe cambiar
            await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=6`);
            
            // Subir Cedula del Deudor
            const subirCedulaDeudorPromesa = page.waitForEvent('filechooser');
            await page.getByRole('button', {name: 'upload Cargar'}).first().click();
            const subirCedulaDeudor = await subirCedulaDeudorPromesa;
            await subirCedulaDeudor.setFiles(`${firma}`);

            // Esperar que la Cedula se haya subido
            await expect(page.getByRole('link', {name: 'CEDULA DEUDOR'})).toBeVisible();

            // Click en la firma de la Cedula deudor para visualizar
            await page.getByRole('link', {name: 'CEDULA DEUDOR'}).click();

            // Aprece un modal con la imagen de la firma
            await expect(page.getByRole('dialog', {name: 'CEDULA DEUDOR'})).toBeVisible();

            // Cerrar la imagen de la firma
            await page.getByRole('button', {name: 'Close'}).click();

            // Subir Solicitud de Prestamo Llena y Firmada
            const subirInstanciaCreditoPromesa = page.waitForEvent('filechooser');
            await page.getByRole('row', {name: '5 SOLICTUD DE PRESTAMO LLENA Y FIRMADA upload Cargar delete'}).getByRole('button', {name: 'upload Cargar'}).first().click();
            const subirInstanciaCredito = await subirInstanciaCreditoPromesa;
            await subirInstanciaCredito.setFiles(`${firma}`);

            await page.waitForTimeout(3000);

            // Esperar que la Solicitud de Prestamo Llena y Firmada se haya subido
            await expect(page.getByRole('link', {name: 'SOLICTUD DE PRESTAMO LLENA Y FIRMADA'})).toBeVisible();

            // Subir Tabla de amortizacion
            const subirTablaAmortizacionPromesa = page.waitForEvent('filechooser');
            await page.getByRole('row', {name: '10 TABLA AMORTIZACION upload Cargar delete'}).getByRole('cell', {name: 'upload Cargar'}).locator('button').click();
            const subirTablaAmortizacion = await subirTablaAmortizacionPromesa;
            await subirTablaAmortizacion.setFiles(`${firma}`);

            await page.waitForTimeout(3000);

            // Esperar que la Tabla de Amortizacion se haya subido
            await expect(page.getByRole('link', {name: 'TABLA AMORTIZACION'})).toBeVisible();
        });

        test('Finalizar con la creacion de la Solicitud', async () => {
            // Boton de Finalizar
            const botonFinalizar = page.getByRole('button', {name: 'check Finalizar'});
            await expect(botonFinalizar).toBeVisible();
            await botonFinalizar.click();

            // Cerrar las paginas que se abren con los diferentes reportes
            CerrarPaginasReportes();

            // Debe regresar a la pagina de solciitud de credito
            await expect(page.locator('h1').filter({hasText: 'SOLICITUDES DE CRÉDITO'})).toBeVisible();
        });

        test.afterAll(async () => { // Despues de las pruebas
            // Cerrar la page
            await page.close();

            // Cerrar el context
            await context.close();
        });
    });

    // Paso 2 - Anulando la Solicitud
    test.describe.serial('Anular Solicitud de Credito - Pruebas con los diferentes parametros', async () => {
        for (const escenarios of EscenariosEliminarSolicitudCredito) {
            test.describe.serial(`Tests cuando el parametro es: ${Object.values(escenarios).toString()}`, () => {
                test.beforeAll(async () => { // Antes de todas las pruebas
                    // Crear el browser
                    browser = await chromium.launch(browserConfig);

                    // Crear el context
                    context = await browser.newContext(contextConfig);

                    // Crear una nueva page
                    page = await context.newPage();

                    // Eventos para la request relation
                    await page.route(/\/relation/, async route => {
                        // Fetch a la peticion original
                        const response: APIResponse = await page.request.fetch(route.request());

                        // Constante con el body
                        const body = await response.json();
                        // Condicion para cambiar los parametros del body
                        if (Object.keys(body?.data[23]).length > 1) {
                            // Reemplazar el body con la response con los datos de los escenarios
                            body.data[23] = Object.assign(body.data[23], escenarios);
                            route.fulfill({
                                response,
                                body: JSON.stringify(body),
                            });
                        } else {
                            route.continue();
                        };
                    });

                    // Ingresar a la pagina
                    await page.goto(`${url_base}`);

                    // Cedula, nombre y apellidos de la persona almacenada en el state
                    cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                    nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                    apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
                });

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

                test('Buscar la solicitud de la persona creada', async () => {
                    // La url debe regresar a las solicitudes solicitadas
                    await expect(page).toHaveURL(`${url_solicitud_credito}?filter=solicitado`);
                
                    // Cambiar el estado de las solicitudes a Aprobado
                    await page.locator('text=SOLICITADO').click();
                    await page.locator('text=APROBADO').click();

                    // La URL debe cambiar a las solicitudes aprobadas
                    await expect(page).toHaveURL(`${url_solicitud_credito}?filter=aprobado`);

                    // Elegir buscar por nombre del socio
                    await page.locator(`${buscarPorNombre}`).click();
            
                    // Buscar la solicitud creada
                    await page.locator(`${formBuscar}`).fill(`${nombre} ${apellido}`);
                });

                if (escenarios.ID_OPERACION !== 18) {
                    test('No poder anular la solicitud', async () => {
                        // Click en el boton de Anular
                        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'delete'}).click();

                        // Debe aparecer un mensaje de error
                        const modalError = page.getByText('Error');
                        await expect(modalError).toBeVisible();

                        // Contenido del mensaje de error
                        await expect(page.getByText('No tiene permisos para anular la solicitud.')).toBeVisible();

                        // Click al boton de Aceptar del modal de Error
                        await page.getByRole('button', {name: 'check Aceptar'}).click();

                        // El modal debe desaparecer
                        await expect(modalError).not.toBeVisible();
                    });
                } else if (escenarios.ID_OPERACION === 18) {
                    test('Anular la Solicitud Creada', async () => {     
                        // Esperar a que la solicitud este visible
                        await page.waitForTimeout(2000);

                        // Click en el boton de Anular
                        await page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'delete'}).click();
                
                        // Aparece un mensaje de confirmacion
                        await expect(page.getByText('Anular solicitud', {exact: true})).toBeVisible();
                
                        // Click al boton de Aceptar
                        await page.getByRole('button', {name: 'check Aceptar'}).click();
                
                        // Aparece otro modal para colocar el motivo de la anulacion
                        const modalAnulacion = page.locator('text=Escriba una razón de anulación');
                        await expect(modalAnulacion).toBeVisible();
                
                        // Ingresar la razon de la anulacion
                        await page.locator('#form_RAZON_ANULACION').fill('El socio necesita otro tipo de prestamo');
                
                        // Click al boton de Aceptar
                        await page.getByRole('dialog', {name: 'Escriba una razón de anulación'}).getByRole('button', {name: 'check Aceptar'}).click();
                
                        // Aparece una alerta de que la solicitud fue anulada
                        await expect(page.locator('text=Prestamo actualizado exitosamente')).toBeVisible();

                        // El modal de anular solicitud no debe estar visible
                        await expect(modalAnulacion).not.toBeVisible();
                
                        // La solicitud de credito no debe estar visible
                        await expect(page.getByRole('row', {name: `${nombre} ${apellido}`})).not.toBeVisible();
                    });

                    test('Al crear una nueva Solicitud no debe tener los datos de la persona de la Solicitud Anulada', async () => {
                        // El listado de las solicitudes debe ser aprobado
                        await expect(page.locator('#form').getByText('APROBADO')).toBeVisible();
                
                        // Boton Nueva Solicitud
                        const botonNuevaSolicitud = page.getByRole('button', {name: 'Nueva Solicitud'});
                        await expect(botonNuevaSolicitud).toBeVisible();
                        await botonNuevaSolicitud.click();
                
                        // La URL debe cambiar
                        await expect(page).toHaveURL(`${url_solicitud_credito}/create?step=1`);
                
                        // Deben estar visibles los tres titulos del primer paso
                        await expect(page.getByRole('heading', {name: 'Solicitante', exact: true})).toBeVisible();
                        await expect(page.getByRole('heading', {name: 'Datos del Solicitante'})).toBeVisible();
                        await expect(page.getByRole('heading', {name: 'Lugar de Trabajo Solicitante'})).toBeVisible();
                
                        // El input de Buscar Socio debe estar vacio
                        await expect(page.locator(`${selectBuscar}`)).toHaveValue('');

                        // Click al input y no debe aparecer una opcion con el nombre del socio
                        await page.locator(`${selectBuscar}`).click();
                        await expect(page.getByRole('option', {name: `${nombre} ${apellido}`})).not.toBeVisible();
                
                        // Click al boton de Cancelar
                        await page.getByRole('button', {name: 'Cancelar'}).click();
                
                        // Debe aparecer un mensaje de confirmacion
                        await expect(page.locator('text=¿Seguro que desea cancelar la operación?')).toBeVisible();
                
                        // Click al boton de Aceptar del mensaje de confirmacion
                        await page.getByRole('button', {name: 'check Aceptar'}).click();
                
                        // La url debe regresar a las solicitudes aprobadas
                        await expect(page).toHaveURL(`${url_solicitud_credito}?filter=aprobado`);
                    });
                };

                test.afterAll(async () => { // Despues de todas las pruebas
                    // Cerrar la page
                    await page.close();

                    // Cerrar el context
                    await context.close();
                });
            });
        };
    });
});
