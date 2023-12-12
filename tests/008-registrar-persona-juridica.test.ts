import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { generarNumerosAleatorios } from './utils/functions/functionsRandom';
import { ariaCerrar, fechaFinal, dataCheck, fechaInicio, inputRequerido, actividadJuridicayRelacionado } from './utils/data/inputsButtons';
import { EscenariosPruebaCrearPersonas } from './utils/dataPages/interfaces';
import { 
    nombreJuridica, 
    nombreRelacionadoJuridica, 
    apellidoRelacionadoJuridica,
    nombreRelacionadoReferenciaJuridica,
    apellidoRelacionadoReferenciaJuridica 
} from './000-nombresyapellidos-personas';
import { url_base, url_registro_persona } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Crear Persona
let botonNuevaPersona: Locator;

// Cedulas
const cedulaPersonaJuridica = generarNumerosAleatorios(11);
const cedulaPersonaJuridicaRelacionado = generarNumerosAleatorios(11);
const cedulaPersonaJuridicaRelacionadoReferencia = generarNumerosAleatorios(11);

// Registro Mercantil
const registroMercantil = generarNumerosAleatorios(15);

// Correos de la persona juridica y del relacionado
const correoJuridica = generarNumerosAleatorios(2);
const correoRelacionado = generarNumerosAleatorios(2);

// Numeros telefonicos
const telefonoJuridica = ('809' + generarNumerosAleatorios(10));
const celularRelacionado = ('829' + generarNumerosAleatorios(10));
const celularRelacionadoReferencia = ('829' + generarNumerosAleatorios(10));

// Nombre Persona Juridica
const nombrePersonaJuridica = nombreJuridica;

// Correo de la empresa
const correoEmpresa = nombrePersonaJuridica.split(' ').join('') + correoJuridica;

// Nombres y apellidos del relacionado de la persona juridica
const nombreRelacionado = nombreRelacionadoJuridica;
const apellidoRelacionado = apellidoRelacionadoJuridica;

// Nombres y apellidos del relacionado por referencia de la persona juridica
const nombreRelacionadoReferencia = nombreRelacionadoReferenciaJuridica;
const apellidoRelacionadoReferencia = apellidoRelacionadoReferenciaJuridica;

// Pruebas
test.describe.serial('Crear Persona Juridica - Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosPruebaCrearPersonas) {
        test.describe(`Tests cuando el parametro es: ${Object.values(escenarios).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
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
        
                // Navegar a la URL de la pagina
                await page.goto(`${url_base}`);

                // Boton de Crear Nueva Persona
                botonNuevaPersona = page.getByRole('button', {name: 'Nueva persona'});
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
                await expect(page).toHaveURL(`${url_registro_persona}`);
        
                // El titulo de registrar persona debe estar visible
                await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();
            });            

            // Condicion para los diferentes parametros que pueden llegar en el ID_OPERACION
            if (escenarios.ID_OPERACION !== 3) {
                // Test cuando el ID_OPERACION sea diferente de 3
                test('El boton de Nueva Persona no debe mostrarse', async () => {
                    // El boton no debe estar visible
                    await expect(botonNuevaPersona).not.toBeVisible();
                });
            } else if (escenarios.ID_OPERACION === 3) {
                test('Crear Persona Juridica', async () => {
                    // Boton de Nueva persona
                    await expect(botonNuevaPersona).toBeVisible();
                    await botonNuevaPersona.click();
            
                    // Debe salir un modal con los dos tipos de personas que se pueden crear
                    await expect(page.locator('text=Seleccione el tipo de persona a crear')).toBeVisible();
            
                    // Click al boton de perosna fisica
                    const botonPersonaJuridica = page.getByRole('button', {name: 'Persona Jurídica'});
                    await expect(botonPersonaJuridica).toBeVisible();
                    await botonPersonaJuridica.click();
            
                    // La URL debe cambiar a la del registro
                    await expect(page).toHaveURL(`${url_registro_persona}persona_juridica/create?step=1`);
                });

                test('Ver los tooltips de los pasos de la creacion de persona juridica', async () => {
                    // El boton del primer paso debe estar visible
                    const pasoUno = page.getByText('Datos generales', {exact: true});
                    await expect(pasoUno).toBeVisible();

                    // Colocar el mouse encima del boton
                    await pasoUno.hover();

                    // Debe mostrarse el tootlip
                    await expect(page.getByRole('tooltip', {name: 'Datos generales'})).toBeVisible();

                    // Esperar a que el tooltip este visible
                    await page.waitForTimeout(1000);

                    // Debe estar visible la informacion adicional del primer paso
                    const pasoUnoExtra = page.getByText('Información básica', {exact: true});
                    await expect(pasoUnoExtra).toBeVisible();

                    // Colocar el mouse encima de la informacion extra del primer paso
                    await pasoUnoExtra.hover();

                    // Debe mostrarse el tootlip
                    await expect(page.getByRole('tooltip', {name: 'Información básica'})).toBeVisible();

                    // Esperar a que el tooltip este visible
                    await page.waitForTimeout(1000);

                    // El boton del segundo paso debe estar visible
                    const pasoDos = page.getByText('Direcciones y Contactos', {exact: true});
                    await expect(pasoDos).toBeVisible();

                    // Colocar el mouse encima del boton
                    await pasoDos.hover();

                    // Debe mostrarse el tootlip
                    await expect(page.getByRole('tooltip', {name: 'Direcciones y Contactos'})).toBeVisible();

                    // Esperar a que el tooltip este visible
                    await page.waitForTimeout(1000);

                    // Debe estar visible la informacion extra del segundo paso
                    const pasoDosExtra = page.getByText('Información de dirección', {exact: true});
                    await expect(pasoDosExtra).toBeVisible();

                    // Colocar el mouse encima de la informacion extra del quinto paso
                    await pasoDosExtra.hover();

                    // Debe mostrarse el tootlip
                    await expect(page.getByRole('tooltip', {name: 'Información de dirección'})).toBeVisible();

                    // Esperar a que el tooltip este visible
                    await page.waitForTimeout(1000);

                    // El boton del tercer paso debe estar visible
                    const pasoTres = page.getByText('Peps', {exact: true});
                    await expect(pasoTres).toBeVisible();

                    // Colocar el mouse encima del boton
                    await pasoTres.hover();

                    // Debe mostrarse el tootlip
                    await expect(page.getByRole('tooltip', {name: 'Peps'})).toBeVisible();

                    // Esperar a que el tooltip este visible
                    await page.waitForTimeout(1000);

                    // Debe estar visible la informacion extra del tercer paso
                    const pasoTresExtra = page.getByText('Persona Expuesta Políticamente', {exact: true});
                    await expect(pasoTresExtra).toBeVisible();

                    // Colocar el mouse encima de la informacion extra del cuarto paso
                    await pasoTresExtra.hover();

                    // Debe mostrarse el tootlip
                    await expect(page.getByRole('tooltip', {name: 'Persona Expuesta Políticamente'})).toBeVisible();

                    // Esperar a que el tooltip este visible
                    await page.waitForTimeout(1000);

                    // El boton del cuarto paso debe estar visible
                    const pasoCuatro = page.getByText('Relacionados', {exact: true});
                    await expect(pasoCuatro).toBeVisible();

                    // Colocar el mouse encima del boton
                    await pasoCuatro.hover();

                    // Debe mostrarse el tootlip
                    await expect(page.getByRole('tooltip', {name: 'Relacionados'})).toBeVisible();

                    // Esperar a que el tooltip este visible
                    await page.waitForTimeout(1000);

                    // Debe estar visible la informacion extra del cuarto paso
                    const pasoCuatroExtra = page.getByText('Agregar relacionados', {exact: true});
                    await expect(pasoCuatroExtra).toBeVisible();

                    // Colocar el mouse encima de la informacion extra del cuarto paso
                    await pasoCuatroExtra.hover();

                    // Debe mostrarse el tootlip
                    await expect(page.getByRole('tooltip', {name: 'Agregar relacionados'})).toBeVisible();

                    // Esperar a que el tooltip este visible
                    await page.waitForTimeout(1000);
                });
            
                test('Registro de Persona Juridica - Datos Generales', async () => {
                    // El titulo de datos generales debe estra visible
                    await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

                    // Codigo de la persona
                    const codigoPersona = page.locator('#legalPerson_ID_PERSONA');
                    await expect(codigoPersona).toBeVisible();
                    await expect(codigoPersona).toBeDisabled();

                    // Categoria Actual de la persona
                    const categoriaActual = page.locator('#legalPerson_DESC_CATEGORIA');
                    await expect(categoriaActual).toBeVisible();
                    await expect(categoriaActual).toBeDisabled();

                    // El input Razon Social debe ser requerido
                    const labelRazonSocial = page.getByTitle('Razón Social');
                    await expect(labelRazonSocial).toHaveClass(`${inputRequerido}`);
            
                    // Razon social / nombre de la empresa
                    await page.locator('#legalPerson_NOMBRE_EMPRESA').fill(`${nombrePersonaJuridica}`);

                    // El input Rnc / cedula debe ser requerido
                    const labelCedula = page.getByTitle('RNC/Cédula');
                    await expect(labelCedula).toHaveClass(`${inputRequerido}`);
            
                    // RNC / cedula
                    const campoRNC = page.locator('#legalPerson_RNC');
                    await campoRNC.fill(`${cedulaPersonaJuridica}`);
            
                    // Tipo de organizacion
                    const tipoOrganizacion = page.locator('#legalPerson_TIPO_SOCIETARIO');
                    await tipoOrganizacion.click();
                    // Seleccionar un tipo de organizacion
                    await page.locator('text=ÚNICO DUEÑO').click();
                    await expect(page.locator('#legalPerson').getByTitle('ÚNICO DUEÑO')).toBeVisible(); 
            
                    // Registro Mercantil
                    const campoRegistroMercantil = page.locator('#legalPerson_REGISTRO_MERCANTIL');
                    await campoRegistroMercantil.fill(`${registroMercantil}`);
            
                    // Fecha de Vencimiento
                    const fechaVencimiento = page.locator('#legalPerson_FECHA_VENC_REG_MERCANTIL');
                    await fechaVencimiento.fill('25/09/2030');

                    // El selector de Actividad Economica debe ser requerido
                    const labelActividadEconomica = page.getByTitle('Actividad Económica');
                    await expect(labelActividadEconomica).toHaveClass(`${inputRequerido}`);
            
                    // Actividad Economica
                    const actividadEconomica = page.locator("(//input[@id='legalPerson_ID_ACTIVIDAD_ECONOMICA'])[2]");
                    await actividadEconomica.click();
                    await actividadEconomica.fill('Agricultura, ganadería, ');
                    // Seleccionar una actividad economica
                    await page.locator(`text=${actividadJuridicayRelacionado}`).click();
            
                    // Fecha de fundacion
                    const fechaFundacion = page.locator('#legalPerson_FECHA_NAC');
                    await fechaFundacion.fill('20/10/2005');
            
                    // Cantidad de empleados
                    await page.locator('#legalPerson_CANT_COLABORADORES').fill('56');

                    // El selector de Ejecutivo debe ser requerido
                    const labelEjecutivo = page.getByTitle('Ejecutivo');
                    await expect(labelEjecutivo).toHaveClass(`${inputRequerido}`);
            
                    // Ejecutivo
                    const inputEjecutivo = page.locator('#legalPerson_ID_EJECUTIVO');
                    await inputEjecutivo.click();
                    await inputEjecutivo.fill('lega');
                    // Seleccionar la opcion legal
                    await page.getByText('LEGAL', {exact: true}).click();
                    await expect(page.locator('#legalPerson').getByTitle('LEGAL')).toBeVisible();

                    // Click al boton de no referido
                    await page.locator('#legalPerson_NO_REFERIDO').click();

                    // Debe colocar en el input de referido la cooperativa
                    await page.waitForTimeout(2000);
                    await expect(page.getByTitle('Cooperativa Empresarial de A Y C (COOPEDAC)  ')).toBeVisible();
                    
                    // El selector de Categoria Solicitada debe ser requerido
                    const labelCategoriaSolicitada = page.getByTitle('Categoría Solicitada');
                    await expect(labelCategoriaSolicitada).toHaveClass(`${inputRequerido}`);
            
                    // Categoria Solicitada
                    const categoriaSolicitada = page.locator('#legalPerson_ID_CATEGORIA_SOLICITADA');
                    await categoriaSolicitada.click();
                    // Seleccionar una categoria
                    await page.locator('text=SOCIO EMPRESARIAL').click();
                    await expect(page.locator('#legalPerson').getByTitle('SOCIO EMPRESARIAL')).toBeVisible();
            
                    // Hacer click en el boton de guardar y continuar
                    guardarContinuar();
                });
            
                test('Registro de Persona Juridica - Informacion de Direccion', async () => {
                    // El titulo de direcciones debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'DIRECCIONES'})).toBeVisible();
            
                    // Boton de agregar direcciones
                    const botonAgregarDirecciones = page.locator('text=Agregar direcciones');
                    await expect(botonAgregarDirecciones).toBeVisible();
                    await botonAgregarDirecciones.click();
            
                    // Debe de aparecer el modal del registro de direcciones
                    await expect(page.locator('h1').filter({hasText: 'REGISTRO DE DIRECCIONES'})).toBeVisible();
            
                    // Tipo de direccion
                    await page.locator('#addressesForm_VALOR').click();
                    // Seleccionar un tipo de direccion
                    await page.getByText('OFICINA', {exact: true}).click();
            
                    // Provincia o Estado
                    const provincia = page.locator('#addressesForm_DESCPROVINCIA');
                    await provincia.fill('Sant');
                    // Seleccionar Santiago
                    await page.locator('text=SANTIAGO').first().click();
            
                    // Municipio o Ciudad
                    await page.locator('#addressesForm_DESCMUNICIPIO').click();
                    // Seleccionar un municipio
                    await page.locator('text=SAN JOSE DE LAS MATAS').click();
            
                    // Sector
                    await page.locator('#addressesForm_DESCSECTOR').click();
                    // Seleccionar un sector
                    await page.locator('text=EL MAMEY').click();
            
                    // Calle
                    const calle = page.locator('#addressesForm_CALLE');
                    await calle.fill('Calle 15');
            
                    // No. Casa
                    const casa = page.locator('#addressesForm_CASA');
                    await casa.fill('62');
            
                    // Click al boton de guardar
                    const botonGuardar = page.getByRole('button', {name: 'save Guardar'});
                    await botonGuardar.click();

                    // El modal debe de desaparecer, por lo que el titulo no debe de estar visible
                    await expect(page.locator('text=Registro de Direcciones')).not.toBeVisible();

                    // La direccion creada debe aparecer en la tabla 
                    await expect(page.getByRole('cell', {name: 'CALLE 15, EL MAMEY, CASA NO. 62, SANTIAGO, REPUBLICA DOMINICANA'})).toBeVisible();
                });
            
                test('Registro de Persona Juridica - Informacion de Telefonos', async () => {
                    // El titulo de telefonos debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'TELÉFONOS'})).toBeVisible();
            
                    // Boton agregar telefonos
                    const botonAgregarTelefono = page.locator('text=Agregar teléfono');
                    await expect(botonAgregarTelefono).toBeVisible();
                    await botonAgregarTelefono.click();
            
                    // Debe de aprecer los inputs para agregar un telefono
                    const tipoNumero = page.locator('#form_VALOR');
                    await tipoNumero.click();
                    // Elegir tipo de numero celular
                    await page.getByText('OFICINA', {exact: true}).click();
            
                    // Ingresar un numero de celular
                    await page.locator('#form_NUMERO').fill(`${telefonoJuridica}`);
            
                    // Click al icono de guardar telefono
                    await page.locator('button', { has: page.locator('span > svg[data-icon=save]')}).click();

                    // Se debe mostrar un mensaje de que se han guardado correctamente los datos
                    await expect(page.locator('text=Contacto Persona almacenado exitosamente.')).toBeVisible();

                    // Cerrar el mensaje
                    await page.locator(`${ariaCerrar}`).click();
                });
            
                test('Registro de Persona Juridica - Informacion de Emails / Redes Sociales', async () => {
                    // El titulo de email/redes sociales debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'EMAILS / REDES SOCIALES'})).toBeVisible();
            
                    // Boton agregar email/red social
                    const botonEmailRedSocial = page.locator('text=Agregar email/red social');
                    await expect(botonEmailRedSocial).toBeVisible();
                    await botonEmailRedSocial.click();
            
                    // Debe salir una lista de opciones
                    await page.getByRole('menuitem', {name: 'EMAIL'}).getByText('EMAIL').click();
            
                    // Descripcion del email
                    const campoNombreEmail = page.getByPlaceholder('USUARIO');
                    await campoNombreEmail.click();
                    await campoNombreEmail?.fill(`${correoEmpresa}`);
            
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

                test('Registro de Persona Juridica - Persona expuesta politicamente (Peps)', async () => {
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
                    await page.locator(`${fechaInicio}`)?.fill('25/03/2022');
            
                    // Input de fecha de final, solo es necesario hacer click, se pone una fecha automatica
                    await page.locator(`${fechaFinal}`).click();
            
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
                    const botonInhabilitar = page.locator(`${dataCheck}`);
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
            
                test('Registro de Persona Juridica - Relacionados del socio - Registro Completo - Datos Generales', async () => {
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();
            
                    // Boton crear relacionado
                    const botonCrearRelacionado = page.locator('text=Crear relacionado');
                    await expect(botonCrearRelacionado).toBeVisible();
                    await botonCrearRelacionado.click();
            
                    // Se debe abrir un modal con los tipos de relacionado
                    await expect(page.locator('h1').filter({hasText: 'SELECCIONE TIPO DE RELACIONADO'})).toBeVisible();

                    // Deben estar las descripciones de los tipos de relacionados en el modal
                    await expect(page.getByText('Referencia: Registrar una persona solo con información básica.')).toBeVisible();
                    await expect(page.getByText('Registro completo: Registrar una persona con toda su información (Documento de identidad, dirección, etc.)')).toBeVisible();

                    // Click al boton de registro completo
                    await page.getByRole('button', {name: 'Registro Completo'}).click();
            
                    // Se debe abrir un modal con el formulario para el registro
                    await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();
            
                    // Cedula
                    await page.locator('#relatedRecord_DOCUMENTO_IDENTIDAD').fill(`${cedulaPersonaJuridicaRelacionado}`);
            
                    // Nombres
                    await page.locator('#relatedRecord_NOMBRES').fill(`${nombreRelacionado}`);
            
                    // Apellidos
                    await page.locator('#relatedRecord_APELLIDOS').fill(`${apellidoRelacionado}`);
            
                    // Tipo de relacion
                    await page.locator('#relatedRecord_ID_PARENTESCO').click();
                    // Elegir el tipo de relacion Representante de Empresa
                    await page.locator('text=REP. EMPRESA').click();
            
                    // Fecha de nacimiento
                    await page.locator('#relatedRecord_FECHA_NAC').fill('23/08/1987');
            
                    // Nacionalidad
                    const nacionalidad = page.locator('#relatedRecord_NACIONALIDAD');
                    await nacionalidad.fill('Dominic');
                    //Elegir la nacionalidad dominicana
                    await page.locator('text=DOMINICANA').click();
            
                    // Sexo
                    await page.locator('text=Masculino').click();
            
                    // Estado Civil
                    const estadoCivil = page.locator('#relatedRecord_ESTADO_CIVIL');
                    await estadoCivil.click();
                    // Elegir un estado civil
                    await page.locator('text=Soltero(a)').click();
            
                    // Hacer click en guardar y continuar
                    guardarContinuar();
                });
            
                test('Registro de Persona Juridica - Relacionados del socio - Registro Completo - Informacion de Ingresos', async () => {
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'INFORMACIÓN DE INGRESOS'})).toBeVisible();
            
                    // Ocupacion
                    await page.locator('#relatedRecord_OCUPACION').fill('Agricu');
                    // Elegir una de las opciones
                    await page.getByText('AGRICULTOR', {exact: true}).click();
            
                    // Lugar de trabajo
                    await page.locator('#relatedRecord_NOMBRE_EMPRESA').fill(`${nombrePersonaJuridica}`);
            
                    // Tipo de empleo
                    await page.locator('text=Privado').click();
            
                    // Posicion en la empresa
                    await page.locator('#relatedRecord_POSICION_EMPRESA').fill('JEFE');
                    // Elegir una opcion
                    await page.getByText('JEFE INMEDIATO', {exact: true}).click();
            
                    // Actividad Economica
                    const actividadEconomicaRelacionado = page.locator('#relatedRecord_ID_ACTIVIDAD_ECONOMICA').nth(1); 
                    await actividadEconomicaRelacionado.click();
                    await actividadEconomicaRelacionado.fill('Agricultura, ganadería, ');
                    // Elegir una opcion
                    await page.locator(`text=${actividadJuridicayRelacionado}`).click();
            
                    // Fecha de ingreso
                    await page.locator('#relatedRecord_FECHA_ENTRADA_EMPRESA').fill('20/10/2005');
            
                    // Ingreso Promedio
                    await page.locator('#relatedRecord_INGRESO_PROMEDIO').fill('38000');
            
                    // Hacer click en guardar y continuar
                    guardarContinuar();
                });
            
                test('Registro de Persona Juridica - Relacionados del socio - Registro Completo - Peps', async () => {
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'PERSONA EXPUESTA POLÍTICAMENTE'})).toBeVisible();
            
                    // Boton Agregar Peps
                    const botonAgregarPeps = page.locator('text=Agregar Peps');
                    await expect(botonAgregarPeps).toBeVisible();
                    await botonAgregarPeps.click();
            
                    // Se debe mostrar el modal
                    const modalPeps = page.locator('h1').filter({hasText: 'REGISTRAR PERSONA EXPUESTA POLÍTICAMENTE'});
                    await expect(modalPeps).toBeVisible();
            
                    // Cargo
                    await page.locator('#form_CARGO_PEP').fill('1');
            
                    // Entidad
                    await page.locator('#form_ENTIDAD_PEP').fill('1');
            
                    // Fecha inicio
                    await page.locator(`${fechaInicio}`).fill('06/08/2022');
            
                    // Click al input de fecha final, coloca una fecha automatica
                    await page.locator(`${fechaFinal}`).click();
            
                    // Click en Aceptar
                    await page.locator('text=Aceptar').click();
            
                    // El modal debe cerrarse
                    await expect(modalPeps).not.toBeVisible();
            
                    // Hacer click en guardar y continuar
                    guardarContinuar();
                });

                test('Registro de Persona Juridica - Relacionados del socio - Registro Completo - Telefonos', async () => {
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'TELÉFONOS'})).toBeVisible();
            
                    // Boton agregar telefonos
                    const botonAgregarTelefono = page.locator('text=Agregar teléfono');
                    await expect(botonAgregarTelefono).toBeVisible();
                    await botonAgregarTelefono.click();
            
                    // Debe de aprecer los inputs para agregar un telefono
                    const tipoNumero = page.locator('#form_VALOR');
                    await tipoNumero.click();
                    // Elegir tipo de numero celular
                    await page.locator('text=CELULAR').first().click();
            
                    // Ingresar un numero de celular
                    await page.locator('#form_NUMERO').fill(`${celularRelacionado}`);
            
                    // Click al icono de guardar telefono
                    await page.locator('button', { has: page.locator('span > svg[data-icon=save]')}).click();

                    // Se debe mostrar un mensaje de que se han guardado correctamente los datos
                    await expect(page.locator('text=Contacto Persona almacenado exitosamente.').first()).toBeVisible();
                });
            
                test('Registro de Persona Juridica - Relacionados del socio - Registro Completo - Emails / Redes Sociales', async () => {
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'EMAILS / REDES SOCIALES'})).toBeVisible();
            
                    // Boton agregar email/red social
                    const botonEmailRedSocial = page.locator('text=Agregar email/red social');
                    await expect(botonEmailRedSocial).toBeVisible();
                    await botonEmailRedSocial.click();
            
                    // Debe salir una lista de opciones
                    await page.getByRole('menuitem', {name: 'EMAIL'}).getByText('EMAIL').click();
            
                    // Descripcion del email
                    const campoNombreEmail = page.getByPlaceholder('USUARIO');
                    await campoNombreEmail.click();
                    await campoNombreEmail?.fill(`${nombreRelacionado.split(' ').join('')}${correoRelacionado}`);
            
                    // Seleccionar un dominio del email
                    const campoDominioEmail = page.locator('#form_DOMAIN');
                    await campoDominioEmail.click();
                    // Ingresar un dominio de email
                    await campoDominioEmail.fill('@GMAIL.COM');
            
                    // Hacer click al icono de guardar email
                    await page.locator('button', {has: page.locator('span > svg[data-icon=save]')}).click();

                    // Se debe mostrar un mensaje de que se han guardado correctamente los datos
                    await expect(page.locator('text=Contacto Persona almacenado exitosamente.').last()).toBeVisible();

                    // Cerrar uno de los mensajes
                    await page.locator(`${ariaCerrar}`).last().click();
                });
            
                test('Registro de Persona Juridica - Relacionados del socio - Registro Completo - Direcciones', async () => {
                   // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'DIRECCIONES'})).toBeVisible();
            
                    // Boton agregar direcciones
                    const botonAgregarDirecciones = page.locator('text=Agregar direcciones');
                    await expect(botonAgregarDirecciones).toBeVisible();
                    await botonAgregarDirecciones.click();
            
                    // Se debe mostrar el modal del registro de direcciones
                    const modalDirecciones = page.locator('h1').filter({hasText: 'REGISTRO DE DIRECCIONES'});
                    await expect(modalDirecciones).toBeVisible();
            
                    // Tipo de direccion
                    await page.locator('#addressesForm_VALOR').click();
                    // Seleccionar un tipo de direccion
                    await page.getByText('CASA', {exact: true}).click();
            
                    // Provincia o Estado
                    const provincia = page.locator('#addressesForm_DESCPROVINCIA');
                    await provincia.fill('Sant');
                    // Seleccionar Santiago
                    await page.getByRole('option', {name: 'SANTIAGO'}).first().click();
            
                    // Municipio o Ciudad
                    await page.locator('#addressesForm_DESCMUNICIPIO').click();
                    // Seleccionar un municipio
                    await page.locator('text=SAN JOSE DE LAS MATAS').click();
            
                    // Sector
                    await page.locator('#addressesForm_DESCSECTOR').click();
                    // Seleccionar un sector
                    await page.locator('text=EL MAMEY').click();
            
                    // Calle
                    const calle = page.locator('#addressesForm_CALLE');
                    await calle.fill('Calle 10');
            
                    // No. Casa
                    const casa = page.locator('#addressesForm_CASA');
                    await casa.fill('20');
            
                    // Click al boton de guardar
                    const botonGuardarRelacionado = page.getByRole('button', {name: 'save Guardar'});
                    await expect(botonGuardarRelacionado).toBeVisible();
                    await botonGuardarRelacionado.click();
            
                    // El modal debe cerrarse
                    await expect(modalDirecciones).not.toBeVisible();

                    // La direccion debe haberse agregado correctamente
                    await expect(page.getByRole('cell', {name: 'CALLE 10, EL MAMEY, CASA NO. 20, SANTIAGO, REPUBLICA DOMINICANA'})).toBeVisible();

                    // Click en Finalizar
                    const finalizarRelacionado = page.locator('#relatedRecord').getByRole('button', {name: 'check Finalizar'});
                    await expect(finalizarRelacionado).toBeVisible();
                    await finalizarRelacionado.click();

                    // En la tabla debe estar el nombre del relacionado
                    await expect(page.getByRole('cell', {name: `${nombreRelacionado} ${apellidoRelacionado}`})).toBeVisible();
                });

                test('Registro de Persona Juridica - Relacionados del socio - Registro por Referencia', async () => {
                    // Boton crear relacionado
                    const botonCrearRelacionado = page.locator('text=Crear relacionado');
                    await expect(botonCrearRelacionado).toBeVisible();
                    await botonCrearRelacionado.click();
            
                    // Se debe abrir un modal con los tipos de relacionado
                    await expect(page.locator('h1').filter({hasText: 'SELECCIONE TIPO DE RELACIONADO'})).toBeVisible();

                    // Deben estar las descripciones de los tipos de relacionados en el modal
                    await expect(page.getByText('Referencia: Registrar una persona solo con información básica.')).toBeVisible();
                    await expect(page.getByText('Registro completo: Registrar una persona con toda su información (Documento de identidad, dirección, etc.)')).toBeVisible();

                    // Click al boton de referencia
                    await page.getByRole('button', {name: 'Referencia'}).click();

                    // Debe aparecer un modal con un mensaje de aviso
                    const modalRegistroReferencia = page.getByText('Aviso');
                    await expect(modalRegistroReferencia).toBeVisible();

                    // Contenido del mensaje de aviso
                    await expect(page.getByText('Algunos campos estarán habilitados solo si decide agregar un tipo de documento de identidad.')).toBeVisible();

                    // Elegir el tipo de documento de identidad a utilizar
                    await page.locator('#form_ID_TIPO_IDENT').click();
                    // Deben aparecer dos tipos de documento de identidad
                    await expect(page.getByText('Cédula')).toBeVisible();
                    await expect(page.getByText('Pasaporte')).toBeVisible();
                    // Elegir cedula
                    await page.getByText('Cédula').click();

                    // Esperar que el tipo de documento cedula este seleccionado
                    await page.waitForTimeout(3000);

                    // Digitar una cedula 
                    await page.getByPlaceholder('Elige el tipo de documento (Opcional)').fill(`${cedulaPersonaJuridicaRelacionadoReferencia}`);

                    // Esperar que la cedula de la persona se agregue correctamente
                    await page.waitForTimeout(3000);

                    // Digitar el nombre
                    await page.getByPlaceholder('Nombres').fill(`${nombreRelacionadoReferencia}`);

                    // Digitar el apellido
                    await page.getByPlaceholder('Apellidos').fill(`${apellidoRelacionadoReferencia}`);

                    // Digitar un telefono
                    await page.getByPlaceholder('Teléfono  (Opcional)').fill(`${celularRelacionadoReferencia}`);

                    // Eelgir un tipo de relacion
                    await page.getByLabel('Tipo relación').click();
                    // Elegir empleado
                    await page.getByText('EMPLEADO', {exact: true}).click();

                    // Digitar el lugar de trabajo
                    await page.getByLabel('Lugar de Trabajo').fill(`${nombrePersonaJuridica}`);

                    // Seleccionar la nacionalidad
                    await page.getByLabel('Nacionalidad').click();
                    // Buscar la nacionalidad dominicana
                    await page.getByLabel('Nacionalidad').fill('domin');
                    // Elegir la opcion con la nacionalidad dominicana
                    await page.getByText('DOMINICANA').click();

                    // Selecionar el sexo
                    await page.getByLabel('Femenino').check();

                    // Seleccionar el estado civil
                    await page.getByLabel('Soltero(a)').check();

                    // Esperar que todos los datos agregados esten correctos
                    await page.waitForTimeout(2000);

                    // Click al boton de Aceptar
                    await page.locator('div').filter({ hasText: /^Aceptar$/ }).click();

                    // El modal debe desaparecer
                    await expect(modalRegistroReferencia).not.toBeVisible();

                    // Esperar a que carguen los datos
                    await page.waitForTimeout(2000);

                    // La persona agregada por referenia debe estar en la tabla
                    await expect(page.getByRole('cell', {name: `${nombreRelacionadoReferenciaJuridica} ${apellidoRelacionadoReferencia}`})).toBeVisible();
                })
            
                test('Finalizar con el Registro de Persona Juridica', async () => {
                    // En la tabla deben estar los dos relacionados agregados

                    // Relacionado por Referencia
                    await expect(page.getByRole('cell', {name: `${nombreRelacionadoReferenciaJuridica} ${apellidoRelacionadoReferencia}`})).toBeVisible();

                    // Relacionado Completo
                    await expect(page.getByRole('cell', {name: `${nombreRelacionadoJuridica} ${apellidoRelacionadoJuridica}`})).toBeVisible();

                    // Hacer click al boton de finalizar
                    const botonFinalizar = page.locator('#legalPerson').getByRole('button', {name: 'check Finalizar'});
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();

                    // Esperar que se abran dos nuevas pestañas con los reportes
                    const page1 = await context.waitForEvent('page');
                    const page2 = await context.waitForEvent('page');

                    // Cerrar las dos paginas
                    await page2.close();
                    await page1.close();
                });

                test('Debe regresar a la pagina de Registrar persona', async () => {
                    // La URL debe regresar a la pagina de Registrar persona
                    await expect(page).toHaveURL(/\/registrar_cliente/);

                    // El titulo de registrar persona debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();
                });
            };
        
            test.afterAll(async () => { // Despues de las pruebas
                // Guardar la cedula de la persona juridica creada
                await page.evaluate((cedulaPersonaJuridica) => window.localStorage.setItem('cedulaPersonaJuridica', cedulaPersonaJuridica), cedulaPersonaJuridica);
                // Guardar el nombre de la persona juridica creada
                await page.evaluate((nombrePersonaJuridica) => window.localStorage.setItem('nombrePersonaJuridica', nombrePersonaJuridica), nombrePersonaJuridica);
                // Guadar el telefono de la persona juridica
                await page.evaluate((telefonoJuridica) => window.localStorage.setItem('telefonoJuridica', telefonoJuridica), telefonoJuridica);
                // Guardar el correo de la persona juridica
                await page.evaluate((correoEmpresa) => window.localStorage.setItem('correoEmpresa', correoEmpresa+`@gmail.com`), correoEmpresa);
                // Guardar el registro mercantil de la persona juridica
                await page.evaluate((registroMercantil) => window.localStorage.setItem('registroMercantil', registroMercantil), registroMercantil);
                
                // Guardar la cedula de la persona relacionada creada
                await page.evaluate((cedulaPersonaJuridicaRelacionado) => window.localStorage.setItem('cedulaPersonaJuridicaRelacionado', cedulaPersonaJuridicaRelacionado), cedulaPersonaJuridicaRelacionado);
                // Guardar el nombre y el apellido de la persona relacionada creada
                await page.evaluate((nombreRelacionado) => window.localStorage.setItem('nombrePersonaJuridicaRelacionada', nombreRelacionado), nombreRelacionado);
                await page.evaluate((apellidoRelacionado) => window.localStorage.setItem('apellidoPersonaJuridicaRelacionada', apellidoRelacionado), apellidoRelacionado);

                // Guardar el nombre de la persona relacionada por referencia
                await page.evaluate((nombreRelacionadoReferencia) => window.localStorage.setItem('nombreRelacionadoReferencia', nombreRelacionadoReferencia), nombreRelacionadoReferencia);
                // Guardar el apellido de la persona relacionada por referencia
                await page.evaluate((apellidoRelacionadoReferencia) => window.localStorage.setItem('apellidoRelacionadoReferencia', apellidoRelacionadoReferencia), apellidoRelacionadoReferencia);

                // Guardar nuevamente el Storage con todos los datos anteriores
                await context.storageState({path: 'state.json'});
                
                // Cerrar la pagina
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });  
    };
});
