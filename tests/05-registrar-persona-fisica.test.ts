import { APIResponse, Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { numerosCedulas, numerosPasaporte, numerosCorreo, numerosCelular } from './utils/cedulasypasaporte';
import { url_base, EscenariosPruebaCrearPersonas, ariaCerrar } from './utils/dataTests';
import { nombrePersonaFisica, apellidoPersonaFisica } from './00-nombresyapellidos-personas';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, pasaporte, nombre, apellidos, correo y celular de la persona
const cedula = numerosCedulas;
const pasaporte = numerosPasaporte;
const numerosparaCorreo = numerosCorreo;
const celular = numerosCelular;

// Nombres y apellidos
const nombrePersona = nombrePersonaFisica;
const apellidoPersona = apellidoPersonaFisica;

// Correo de la persona
const correoPersona = nombrePersona.split(' ').join('') + numerosparaCorreo;

/* Pruebas */

test.describe.serial('Crear Persona Fisica - Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosPruebaCrearPersonas) {
        test.describe(`Tests cuando el escenario es: ${Object.values(escenarios).toString()}`, () => {
            test.beforeAll(async () => { // Antes de que se realicen todas las pruebas
                /* Crear el browser, con la propiedad headless */
                browser = await chromium.launch({
                    headless: false
                });
        
                /* Crear un context con el storageState donde esta guardado el token de la sesion */
                context = await browser.newContext({
                    storageState: 'state.json'
                });
        
                /* Crear una nueva page usando el context */
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/relation/, async route => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicion para cambiar los parametros del body
                    if (Object.keys(body?.data[9]).length > 1) {
                        // Reemplazar el body con la response con los datos de los escenarios
                        body.data[9] = Object.assign(body.data[9], escenarios);
                        route.fulfill({
                            response,
                            body: JSON.stringify(body),
                        });
                    } else {
                        route.continue();
                    };
                });
        
                /* Ingresar a la pagina */
                await page.goto(`${url_base}`);
            });
        
            // Funcion con el boton de continuar, que se repite en cada seccion del registro
            const guardarContinuar = async () => {
                // continuar
                const botonContinuar = page.locator('button:has-text("Guardar y continuar")');
                // presionar el boton
                await botonContinuar.click();
            };
        
            test('Ir a la opcion de Registrar Persona', async () => {
                // Boton de Socios
                await page.getByRole('menuitem', {name: 'SOCIOS'}).click();
        
                // Boton de Operaciones
                await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();
        
                // Boton de Registrar Persona
                await page.getByRole('menuitem', {name: 'Registrar persona'}).click();
        
                // La url debe de cambiar
                await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/`);
        
                // El titulo de registrar persona debe estar visible
                await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();
            });            
            
            // Condicion para los diferentes parametros que pueden llegar en el ID_OPERACION
            if (escenarios.ID_OPERACION === '') {
                // Test cuando el ID_OPERACION sea Vacio
                test('El boton de Nueva Persona no debe mostrarse', async () => {
                    // El boton no debe estar visible
                    const botonNuevaPersona = page.getByRole('button', {name: 'Nueva persona'});
                    await expect(botonNuevaPersona).not.toBeVisible();

                    // Skip al test
                    test.skip();
                });
            } else if (escenarios.ID_OPERACION === 10) {
                // Test cuando el ID_OPERACION sea diferente de 3
                test('El boton de Nueva Persona no debe mostrarse', async () => {
                    // El boton no debe estar visible
                    const botonNuevaPersona = page.getByRole('button', {name: 'Nueva persona'});
                    await expect(botonNuevaPersona).not.toBeVisible();

                    // Skip al test
                    test.skip();
                });
            } else if (escenarios.ID_OPERACION === 3) {
                // Tests cuando el ID_OPERACION sea 3
                test('Hacer click al boton de nueva persona', async () => {
                    // Boton Nueva persona
                    const botonNuevaPersona = page.getByRole('button', {name: 'Nueva persona'});
                    await expect(botonNuevaPersona).toBeVisible();
                    await botonNuevaPersona.click();
            
                    // Debe de aparecer un modal, con dos botones
                    await expect(page.locator('text=Seleccione el tipo de persona a crear')).toBeVisible();
                });
            
                test('Hacer click al boton de persona fisica', async () => {
                    // Boton persona fisica
                    const botonPersonaFisica = page.getByRole('button', {name: 'Persona Física'});
                    await expect(botonPersonaFisica).toBeVisible();
                    await botonPersonaFisica.click();
            
                    // El titulo de datos generales de la persona debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();
            
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=1`);
                });
            
                test('Registrar a la persona - Datos Generales', async() => {
                    // El boton de guardar y continuar debe estar inhabilitado
                    await expect(page.locator('button:has-text("Guardar y continuar")')).toBeDisabled();

                    // El input del Estado debe estar inhabilitado
                    const estadoPersona = page.locator('#person_ID_ESTADO');
                    await expect(estadoPersona).toBeVisible();
                    await expect(estadoPersona).toBeDisabled();

                    // Codigo de la persona
                    const codigoPersona = page.locator('#person_ID_PERSONA');
                    await expect(codigoPersona).toBeVisible();
                    await expect(codigoPersona).toBeDisabled();

                    // Categoria Actual de la persona
                    const categoriaActual = page.locator('#person_DESC_CATEGORIA');
                    await expect(categoriaActual).toBeVisible();
                    await expect(categoriaActual).toBeDisabled();

                    // Input de la cedula. Cada cedula debe ser unica
                    const campoCedula = page.locator('#person_DOCUMENTO_IDENTIDAD');
                    await campoCedula?.fill(cedula);
            
                    // Colocar el cursor al principio de la cedula y borrarla presionando la tecla Delete
                    await campoCedula.press('ArrowLeft');
                    for (let i = 0; i < (`${cedula}` + 2).length; i++) { // +2 por los guiones que se le colocan a la cedula
                        await campoCedula.press('ArrowLeft');
                    };
                    await campoCedula.press('Delete');
            
                    // Volver a ingresar la cedula
                    await campoCedula?.fill(`${cedula}`);
                    
                    // Pasaporte 
                    const campoPasaporte = page.locator('#person_NO_PASAPORTE');
                    await campoPasaporte.click();
                    await campoPasaporte.fill(pasaporte); 
                    
                    // Input del nombre
                    const campoNombre = page.locator('#person_NOMBRES');
                    await campoNombre?.fill(`${nombrePersona}`);
            
                    // Input del apellido
                    const campoApellido = page.locator('#person_APELLIDOS');
                    await campoApellido?.fill(`${apellidoPersona}`);
            
                    // Input del apodo
                    const campoApodo = page.locator('#person_APODO');
                    await campoApodo?.fill('APODO');
            
                    // Seleccionar la nacionalidad
                    await page.locator('#person_NACIONALIDAD')?.fill('DOMINICANA');
                    // nth(0) = Hacer click a la primera opcion, que debe de coincidir con lo escrito
                    await page.locator('text=DOMINICANA').nth(0).click();
                    await expect(page.locator('#person').getByTitle('DOMINICANA')).toBeVisible();
            
                    // Input de la fecha de nacimiento
                    const campoFecha = page.locator('#person_FECHA_NAC');
                    await campoFecha?.fill('17/01/1990');
            
                    // Seleccionar si es extranjero, en este caso no lo es
                    const seleccionarExtranjero = page.locator('input[type="radio"]')
                    await seleccionarExtranjero.first().press('ArrowRight');
            
                    // Input del lugar de nacimiento
                    const campoLugar = page.locator('#person_LUGAR_NAC');
                    await campoLugar?.fill('La Vega');
            
                    // Input del nivel academico
                    const campoAcademico = page.locator('#person_ID_NIVEL_ACA');
                    await campoAcademico?.fill('Universitario');
                    // Hacer click a la opcion que aparece de nivel academico universitario
                    await page.locator('text=UNIVERSITARIO').click();
                    await expect(page.locator('#person').getByTitle('UNIVERSITARIO')).toBeVisible();
            
                    // Input de la cantidad de dependientes
                    const campoDependientes = page.locator('#person_CANT_DEPENDIENTES');
                    await campoDependientes?.fill('4');
            
                    // Input de ejecutivo
                    const campoEjecutivo = page.locator('#person_ID_EJECUTIVO');
                    await campoEjecutivo?.fill('CLIENT');
                    // Hacer click a la opcion de cliente inactivo
                    await page.locator('text=CLIENTE INACTIVO').click();
                    await expect(page.locator('#person').getByTitle('CLIENTE INACTIVO')).toBeVisible();
            
                    // Seleccionar sexo
                    await page.locator('text=Femenino').click();

                    // Tipo comprobante
                    await expect(page.getByTitle('FACTURA DE CONSUMO')).toBeVisible();
                    await page.locator('#person_ID_TIPO_NCF').fill('Factura de Consumo elec'); 
                    // Hacer click a la opcion de factura de consumo electronica
                    await page.locator('text=FACTURA DE CONSUMO ELECTRONICA').click();
                    await expect(page.locator('#person').getByTitle('FACTURA DE CONSUMO ELECTRONICA')).toBeVisible();
            
                    // Input del estado civil
                    const campoEstado = page.locator('#person_ESTADO_CIVIL');
                    await campoEstado?.fill('Soltero');
                    await page.locator('text=Soltero(a)').click();
                    await expect(page.locator('#person').getByTitle('Soltero(a)')).toBeVisible();
            
                    // Click al boton de no referido
                    await page.locator('#person_NO_REFERIDO').click();
            
                    // Input Categoria Solicitada
                    const campoCategoria = page.locator('#person_ID_CATEGORIA_SOLICITADA');
                    await campoCategoria?.fill('ahorra');
                    // Seleccionar la opcion de socio ahorrante
                    await page.locator('text=SOCIO AHORRANTE').click();
                    await expect(page.locator('#person').getByTitle('SOCIO AHORRANTE')).toBeVisible();

                    // Boton de Cancelar debe estar visible
                    await expect(page.getByRole('button', {name: 'Cancelar'})).toBeVisible();

                    // El boton de guardar y continuar debe estar habilitado
                    await expect(page.locator('button:has-text("Guardar y continuar")')).toBeEnabled();
            
                    // Hacer click en el boton de guardar y continuar
                    guardarContinuar();
                });
            
                test('Registrar a la persona - Informacion de ingresos', async () => {
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=2`);
            
                    // El titulo de Informacion de Ingresos debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'INFORMACIÓN DE INGRESOS'})).toBeVisible();
            
                    // Seleccionar una ocupacion
                    const campoOcupacion = page.locator('#person_OCUPACION');
                    await campoOcupacion?.fill('Programa');
                    // Hacer click a la opcion de programador
                    await page.locator('text=PROGRAMADOR').click();
            
                    // Input del lugar de trabajo
                    const campoTrabajo = page.locator('#person_NOMBRE_EMPRESA');
                    await campoTrabajo?.fill('ProgramsUni');
            
                    // Seleccionar tipo de empleo
                    await page.locator('input[type="radio"]').first().check();
            
                    // Input del email de la empresa
                    const campoEmailEmpresa = page.locator('#person_EMAIL_EMPRESA');
                    await campoEmailEmpresa?.fill('empresaejemplo@hotmail.com');
            
                    // Numeros a digitar para la prueba del input
                    const numeroTelefonoEmpresa = '123456789012345678901'; 
                    // Input del telefono de la empresa
                    const campoTelefonoEmpresa = page.locator('#person_TELEFONO_EMPRESA');
                    await campoTelefonoEmpresa?.fill(`${numeroTelefonoEmpresa}`);
                    // Probar que haya un limite de 13 caracteres, y que estos no se borren
                    await campoTelefonoEmpresa.getByText(`${numeroTelefonoEmpresa}`).isVisible();
                    // Borrar el numero y volver a digitarlo
                    await campoTelefonoEmpresa.clear();
                    await campoTelefonoEmpresa?.fill('8092653022');
                    // Verificar que el numero digitado tenga el parentesis
                    await expect(campoTelefonoEmpresa).toHaveValue('(809) 265 3022');
            
                    // Input de la direccion de la empresa
                    const campoDireccionEmpresa = page.locator('#person_DIRECCION_EMPRESA');
                    await campoDireccionEmpresa?.fill('PALMARITO, LA VEGA');
            
                    // Seleccionar la ocupacion en la empresa
                    const campoPosicionEmpresa = page.locator('#person_POSICION_EMPRESA');
                    await campoPosicionEmpresa?.fill('Programador');
                    // Hacer click a la opcion de programador web
                    await page.getByTitle('PROGRAMADOR WEB').getByText('PROGRAMADOR WEB').click();
            
                    // Input de la fecha de ingreso a la empresa
                    const campoFechaEmpresa = page.locator('#person_FECHA_ENTRADA_EMPRESA');
                    await campoFechaEmpresa?.fill('15/01/2021'); 
            
                    // Seleccionar una actividad economica
                    const campoActividadEconomica = page.locator("(//input[@id='person_ID_ACTIVIDAD_ECONOMICA'])[2]");
                    await campoActividadEconomica?.fill('programacion');
                    // Hacer click a la opcion de cultivo de berenjenas
                    await page.locator('text=Programación informática, consultarías y actividades relacionadas').click();
            
                    // Input de otra actividad economica
                    const campoOtraActividad = page.locator('#person_OTRA_ACTIVIDAD');
                    await campoOtraActividad?.fill('Negocios');
            
                    // Input de jefe inmediato
                    const campoJefeInmediato = page.locator('#person_NOMBRE_SUPERVISOR');
                    await campoJefeInmediato?.fill('Jefe de ejemplo');
            
                    // Input de ingreso promedio
                    const campoIngresoPromedio = page.locator('#person_INGRESO_PROMEDIO');
                    await campoIngresoPromedio?.fill('60000');
            
                    // Input de otros ingresos
                    const campoOtrosIngresos = page.locator('#person_OTROS_INGRESOS');
                    await campoOtrosIngresos?.fill('1200');
            
                    // Seleccionar el tipo de moneda en otros ingresos
                    const campoMonedaOtrosIngresos = page.locator('#person_ID_MONEDA_OTROS_ING');
                    await campoMonedaOtrosIngresos.click();
                    // Elegir una moneda, en este caso dolar
                    await page.locator('text=US (DOLARES)').click();
            
                    // Input de justificacion de otros ingresos
                    const campoJustificacionIngresos = page.locator('#person_RAZON_OTROS_INGRESOS');
                    await campoJustificacionIngresos?.fill('Ingresos recibidos por herencia familiar');
            
                    // Hacer click en el boton de guardar y continuar
                    guardarContinuar();
                });
            
                test('Registrar a la persona - Informacion adicional de ingresos', async () => {
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=3`);
            
                    // El titulo de informacion adicional de ingresos debe estar visible
                    await expect(page.locator('h1').filter({ hasText: 'INFORMACIÓN ADICIONAL DE INGRESOS' })).toBeVisible();
            
                    // Colocar un origen para los recursos
                    const campoOrigenRecursos = page.locator('#person_ORIGEN_RECURSOS');
                    await campoOrigenRecursos?.fill('Trabajo');
            
                    // Colocar un proposito para los ingresos
                    const campoProposito = page.locator('#person_PROPOSITO_TRANSACCION');
                    await campoProposito?.fill('Para uso personal');
            
                    // Hacer click en el boton de guardar y continuar
                    const botonContinuar = page.locator('button:has-text("Guardar y continuar")');
                    // presionar el boton
                    await botonContinuar.click();
                });
            
                test('Ir a la seccion de los Peps, para luego probar el boton de anterior', async () => {
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=4`);
            
                    // El titulo de persona expuesta politicamente debe estar visible
                    await expect(page.locator('h1').filter({ hasText: 'PERSONA EXPUESTA POLÍTICAMENTE' })).toBeVisible();
            
                    // El boton de agregar peps debe estar visible
                    const botonPeps = page.locator('text=Agregar Peps');
                    await expect(botonPeps).toBeVisible();
                });
            
                test('Prueba con el boton de anterior', async () => {
                    // El boton de anterior debe estar visible
                    const botonAnterior = page.locator('text=Anterior');
                    await expect(botonAnterior).toBeVisible();
            
                    // Hacer click al boton de anterior
                    await botonAnterior.click();
            
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=3`);
            
                    // Debe de redirigrse a la seccion anterior, la de informacion adicional de ingresos
                    // Por lo que el titulo debe estar visible
                    await expect(page.locator('h1').filter({ hasText: 'INFORMACIÓN ADICIONAL DE INGRESOS' })).toBeVisible();
            
                    // Los dos campos de dicha seccion deben estar visibles
                    // Campo de Origen Recursos
                    const campoOrigenRecursos = page.locator('#person_ORIGEN_RECURSOS');
                    await expect(campoOrigenRecursos).toBeVisible();
            
                    // Campo de Proposito
                    const campoProposito = page.locator('#person_PROPOSITO_TRANSACCION');
                    await expect(campoProposito).toBeVisible();
            
                    // Hacer click en el boton de guardar y continuar
                    guardarContinuar();
                });
                
                test('Registrar a la persona - Persona expuesta politicamente (Peps)', async () => {
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=4`);
            
                    // El titulo de persona expuesta politicamente debe estar visible
                    await expect(page.locator('h1').filter({ hasText: 'PERSONA EXPUESTA POLÍTICAMENTE' })).toBeVisible();      
            
                    // Boton de agregar peps
                    const botonPeps = page.locator('text=Agregar Peps');
                    await expect(botonPeps).toBeVisible();
                    await botonPeps.click();
            
                    // Debe de aparecer un modal
                    await expect(page.locator('text=REGISTRAR PERSONA EXPUESTA POLÍTICAMENTE')).toBeVisible();
            
                    // Seleccionar el cargo del Peps
                    const campoCargo = page.locator('#form_CARGO_PEP');
                    await campoCargo.click();
                    await campoCargo?.fill('1');
            
                    // Seleccionar una entidad del Peps
                    const campoEntidad = page.locator('#form_ENTIDAD_PEP');
                    await campoEntidad.click();
                    await campoEntidad?.fill('36');
            
                    // Input de fecha de inicio
                    const campoFechaInicio = page.locator('#form_FECHA_INICIO');
                    await campoFechaInicio?.fill('25/03/2022');
            
                    // Input de fecha de final, solo es necesario hacer click, se pone una fecha automatica
                    const campoFechaFinal = page.locator('#form_FECHA_FINAL');
                    await campoFechaFinal.click();
            
                    // Hacer click al boton de aceptar
                    await page.locator('button:has-text("Aceptar")').click();
            
                    // El modal debe de desaparecer
                    await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA EXPUESTA POLÍTICAMENTE'})).not.toBeVisible();

                    // Datos del Pep creado

                    // Cargo
                    await expect(page.getByRole('columnheader', {name: 'Cargo'})).toBeVisible();
                    await expect(page.getByRole('cell', {name: '1'})).toBeVisible();

                    // Entidad
                    await expect(page.getByRole('columnheader', {name: 'Entidad'})).toBeVisible();
                    await expect(page.getByRole('cell', {name: '36'})).toBeVisible();

                    // Estado
                    await expect(page.getByRole('columnheader', {name: 'Estado'})).toBeVisible();
                    const estadoActivo = page.getByRole('cell', {name: 'Activo'})
                    await expect(estadoActivo).toBeVisible();

                    // Boton de inhabilitar
                    const botonInhabilitar = page.locator('[data-icon="check-circle"]');
                    await expect(botonInhabilitar).toBeVisible();
                    await botonInhabilitar.click();

                    // El estado ahora debe ser Inactivo
                    await expect(page.getByRole('cell', {name: 'Inactivo'})).toBeVisible();

                    // Debe cambiar la boton de habilitar
                    const botonHabilitar = page.getByRole('button', {name: 'stop', exact: true});
                    await expect(botonHabilitar).toBeVisible();
                    await botonHabilitar.click();

                    // El estado debe volver a ser Activo
                    await expect(estadoActivo).toBeVisible();

                    // Y el boton volver a ser inhabilitar
                    await expect(botonInhabilitar).toBeVisible();
                    
                    // Hacer click en el boton de guardar y continuar
                    guardarContinuar();
                });
            
                test('Registrar a la persona - Direcciones', async () => {
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=5`);
            
                    // El titulo de direcciones debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'DIRECCIONES'})).toBeVisible();
            
                    // Boton de agregar direccion 
                    const botonAgregarDirecciones = page.locator('text=Agregar direcciones');
                    await expect(botonAgregarDirecciones).toBeVisible();
                    await botonAgregarDirecciones.click();
            
                    // Debe de aparecer un modal
                    await expect(page.locator('text=Registro de Direcciones')).toBeVisible();
            
                    // Seleccionar el tipo de direccion
                    await page.locator('#addressesForm_VALOR').click();
                    await page.getByRole('option', {name: 'CASA'}).click(); 
            
                    // El pais por defecto es Republica Dominicana, por lo que no habra cambios
            
                    // Seleccionar la provincia
                    const campoProvincia = page.locator('#addressesForm_DESCPROVINCIA');
                    await campoProvincia.click();
                    await campoProvincia?.fill('La Ve');
                    await page.locator('text=LA VEGA').click();
            
                    // Selecionar el municipio
                    const campoMunicipio = page.locator('#addressesForm_DESCMUNICIPIO');
                    await campoMunicipio.click();
                    await campoMunicipio?.fill('JARAB');
                    await page.locator('text=JARABACOA').click();
            
                    // Seleccionar el sector
                    const campoSector = page.locator('#addressesForm_DESCSECTOR');
                    await campoSector.click();
                    await campoSector?.fill('Sabane');
                    await page.locator('text=SABANETA').click();
            
                    // Input de calle
                    const campoCalle = page.locator('#addressesForm_CALLE');
                    await campoCalle?.fill("Calle de ejemplo");
            
                    // Input de No. de casa
                    const campoNoCasa = page.locator('#addressesForm_CASA');
                    await campoNoCasa?.fill('52');
            
                    // Hacer click al boton de guardar
                    const botonGuardar = page.getByRole('button', {name: 'save Guardar'});
                    await botonGuardar.click();
            
                    // El modal debe de desaparecer, por lo que el titulo no debe de estar visible
                    await expect(page.locator('text=Registro de Direcciones')).not.toBeVisible();

                    // La direccion creada debe aparecer en la tabla 
                    await expect(page.getByRole('cell', {name: 'CALLE DE EJEMPLO, SABANETA, CASA NO. 52, LA VEGA, REPUBLICA DOMINICANA'})).toBeVisible();
                });

                test('Editar la direccion agregada', async () => {
                    // Hacer click al icono de editar
                    const botonEditar = page.locator('[data-icon="edit"]');
                    await expect(botonEditar).toBeVisible();
                    await botonEditar.click();

                    // El modal debe de aparecer
                    await expect(page.locator('text=EDITAR DIRECCIÓN')).toBeVisible();

                    // Editar la calle
                    const campoCalle = page.locator('#addressesForm_CALLE');
                    await campoCalle.clear();
                    await campoCalle?.fill('Calle 12');

                    // Hacer click al boton de Actualizar
                    const botonActualizar = page.getByRole('button', {name: 'Actualizar'});
                    await expect(botonActualizar).toBeVisible();
                    await botonActualizar.click();

                    // El modal debe de desaparecer, por lo que el titulo no debe de estar visible
                    await expect(page.locator('text=EDITAR DIRECCIÓN')).not.toBeVisible();

                    // La direccion editada debe aparecer en la tabla 
                    await expect(page.getByRole('cell', {name: 'CALLE 12, SABANETA, CASA NO. 52, LA VEGA, REPUBLICA DOMINICANA'})).toBeVisible();
                });

                test('Agregar y eliminar una nueva direccion', async () => {
                    // Boton de agregar direccion 
                    const botonAgregarDirecciones = page.locator('text=Agregar direcciones');
                    await expect(botonAgregarDirecciones).toBeVisible();
                    await botonAgregarDirecciones.click();
            
                    // Debe de aparecer un modal
                    await expect(page.locator('text=Registro de Direcciones')).toBeVisible();
            
                    // Seleccionar el tipo de direccion
                    await page.locator('#addressesForm_VALOR').click();
                    await page.getByRole('option', {name: 'CASA'}).click(); 
            
                    // El pais por defecto es Republica Dominicana, por lo que no habra cambios
            
                    // Seleccionar la provincia
                    const campoProvincia = page.locator('#addressesForm_DESCPROVINCIA');
                    await campoProvincia.click();
                    await campoProvincia?.fill('Santiag');
                    await page.getByText('SANTIAGO', {exact: true}).click();
            
                    // Selecionar el municipio
                    const campoMunicipio = page.locator('#addressesForm_DESCMUNICIPIO');
                    await campoMunicipio.click();
                    await campoMunicipio?.fill('JANI');
                    await page.locator('text=JANICO').click();
            
                    // Seleccionar el sector
                    const campoSector = page.locator('#addressesForm_DESCSECTOR');
                    await campoSector.click();
                    await campoSector?.fill('ARROYO');
                    await page.locator('text=ARROYO MALO').click();
            
                    // Input de calle
                    const campoCalle = page.locator('#addressesForm_CALLE');
                    await campoCalle?.fill("Calle 44");
            
                    // Input de No. de casa
                    const campoNoCasa = page.locator('#addressesForm_CASA');
                    await campoNoCasa?.fill('102');
            
                    // Hacer click al boton de guardar
                    const botonGuardar = page.getByRole('button', {name: 'save Guardar'});
                    await botonGuardar.click();
            
                    // El modal debe de desaparecer, por lo que el titulo no debe de estar visible
                    await expect(page.locator('text=Registro de Direcciones')).not.toBeVisible();

                    // La nueva direccion creada debe aparecer en la tabla 
                    const nuevaDireccion = page.getByRole('cell', {name: 'CALLE 44, ARROYO MALO, CASA NO. 102, SANTIAGO, REPUBLICA DOMINICANA'});
                    await expect(nuevaDireccion).toBeVisible();
                
                    // Eliminar la nueva direccion
                    const botonEliminar = page.locator('[data-icon="delete"]').last();
                    await expect(botonEliminar).toBeVisible();
                    await botonEliminar.click();

                    // Mensaje de confirmacion
                    await expect(page.locator('text=¿Está seguro de eliminar el registro?')).toBeVisible();

                    // Click al boton de Aceptar
                    const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
                    await expect(botonAceptar).toBeVisible();
                    await botonAceptar.click();

                    // La nueva direccion debe desaparecer de la tabla
                    await expect(nuevaDireccion).not.toBeVisible();
                });
            
                test('Registrar a la persona - Telefono', async () => {
                    // El titulo de telefonos debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'TELÉFONOS'})).toBeVisible();
                    
                    // Boton de agregar telefono
                    const botonAgregarTelefono = page.locator('text=Agregar teléfono');
                    await expect(botonAgregarTelefono).toBeVisible();
                    await botonAgregarTelefono.click();
            
                    // Seleccionar el tipo de telefono
                    await page.locator('#form_VALOR').click();
                    await page.locator('text=CELULAR').first().click(); 
                    // first() => elegir el primer elemento con el nombre celular
            
                    // Input del numero
                    const campoNumero = page.locator('#form_NUMERO');
                    await campoNumero.click();
                    await campoNumero?.fill(`${celular}`);
            
                    // Hacer click al icono de guardar telefono
                    await page.locator('button', {has: page.locator('span > svg[data-icon=save]')}).click();

                    // Se debe mostrar un mensaje de que se han guardado correctamente los datos
                    await expect(page.locator('text=Contacto Persona almacenado exitosamente.')).toBeVisible();

                    // Cerrar el mensaje
                    await page.locator(`${ariaCerrar}`).click();
                });
            
                test('Registrar a la persona - Email/Redes Sociales', async () => {
                    // El titulo de emails / redes sociales debe estar visible
                    await expect(page.locator('h1').filter({ hasText: 'EMAILS / REDES SOCIALES' })).toBeVisible();
            
                    // Boton agregar email/red social
                    const botonEmailRedSocial = page.locator('text=Agregar email/red social');
                    await expect(botonEmailRedSocial).toBeVisible();
                    await botonEmailRedSocial.click();
            
                    // Debe de aprecer un menu de opciones al hacer click al boton
                    await page.getByRole('menuitem', {name: 'EMAIL'}).getByText('EMAIL').click();
            
                    // Input de la descripcion del email
                    const campoNombreEmail = page.getByPlaceholder('USUARIO');
                    await campoNombreEmail.click();
                    await campoNombreEmail?.fill(`${correoPersona}`);
            
                    // Seleccionar un dominio del email
                    const campoDominioEmail = page.locator('#form_DOMAIN');
                    await campoDominioEmail.click();
                    // Ingresar un dominio de email
                    await campoDominioEmail.fill('@GMAIL.COM');
            
                    // Hacer click al icono de guardar email
                    await page.locator('button', {has: page.locator('span > svg[data-icon=save]')}).click();

                    // Se debe mostrar un mensaje de que se han guardado correctamente los datos
                    await expect(page.locator('text=Contacto Persona almacenado exitosamente.')).toBeVisible();

                    // Cerrar el mensaje
                    await page.locator(`${ariaCerrar}`).click();
            
                    // Hacer click en el boton de guardar y continuar
                    guardarContinuar();
                });
            
                test('Registrar a la persona - Relacionados', async () => {
                    // La url debe cambiar
                    await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=6`);
            
                    // El titulo de relacionados del socio debe estar visible 
                    await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible(); 
            
                    // Boton de Crear Relacionado debe estar visible
                    await expect(page.getByRole('button', {name: 'Crear relacionado'})).toBeVisible();
                    
                    // Input de Buscar relacionados debe estar visible
                    const campoBuscarRelacionado = page.getByRole('combobox');
                    await expect(campoBuscarRelacionado).toBeVisible();
                    
                    // En la tabla de los relacionados no debe haber ningun registro
                    await expect(page.locator('text=No hay Datos')).toBeVisible();

                    // Seccion de Reportes
                    await expect(page.locator('h2').filter({hasText: 'REPORTES'})).toBeVisible();
                    await expect(page.locator('text=Admisión')).toBeVisible();
                    await expect(page.locator('text=Aportación Referente')).toBeVisible();
                    await expect(page.locator('text=Conozca a su Socio')).toBeVisible();
                });
            
                test('Finalizar con el Registro de Persona Fisica', async () => {
                    // Hacer click al boton de finalizar
                    const botonFinalizar = page.locator('text=Finalizar');
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();

                    // Debe mostrarse un modal
                    await expect(page.getByText('No Registró Relacionado.')).toBeVisible();

                    // Contenido del modal
                    await expect(page.getByText('¿Desea finalizar el registro sin agregar relacionados?')).toBeVisible();
                    
                    // Botones del modal
                    await expect(page.getByRole('dialog').getByRole('button', { name: 'Cancelar' })).toBeVisible();
                    const botonFinalizarModal = page.getByRole('dialog').getByRole('button', { name: 'check Finalizar' });

                    // Esperar que se abran dos pestañas con los diferentes reportes
                    const [newPage, newPage2] = await Promise.all([
                        context.waitForEvent('page'),
                        context.waitForEvent('page'),
                        // Click al boton de Finalizar
                        await expect(botonFinalizarModal).toBeVisible(),
                        await botonFinalizarModal.click()
                    ]);
                  
                    // Cerrar las paginas con los reportes
                    await newPage.close();
                    await newPage2.close();
                });

                test('Debe regresar a la pagina de Registrar persona', async () => {
                    // Alerta de Operación Exitosa
                    await expect(page.locator('text=Registro Completado')).toBeVisible();

                    // Contentido de la alerta
                    await expect(page.locator('text=Registro de persona completado exitosamente.')).toBeVisible();

                    // La URL debe regresar a la pagina de Registrar persona
                    await expect(page).toHaveURL(/\/registrar_cliente/);

                    // El titulo de registrar persona debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();
                });
            };
        
            test.afterAll(async () => { /* Despues de que se realizen todas las pruebas */
                // Guardar la cedula de la persona creada
                await page.evaluate((cedula) => window.localStorage.setItem('cedula', cedula), cedula);
                // Guardar el nombre y el apellido de la persona creada
                await page.evaluate((nombrePersona) => window.localStorage.setItem('nombrePersona', nombrePersona), nombrePersona);
                await page.evaluate((apellidoPersona) => window.localStorage.setItem('apellidoPersona', apellidoPersona), apellidoPersona);
                // Guardar el correo de la persona creada
                await page.evaluate((correoPersona) => window.localStorage.setItem('correoPersona', correoPersona), correoPersona);
        
                // Guardar nuevamente el Storage con la cedula, el nombre y el apellido de la persona
                await context.storageState({path: 'state.json'});
        
                // Cerrar la pagina
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});