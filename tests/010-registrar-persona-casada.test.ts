import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { 
    numerosCedulas5, 
    numerosCedulas6,
    numerosPasaporte2, 
    numerosCorreo, 
    numerosCelular 
} from './utils/cedulasypasaporte';
import { 
    nombrePersonaFisicaCasada, 
    apellidoPersonaFisicaCasada, 
    nombrePersonaFisicaConyuge, 
    apellidoPersonaFisicaConyuge  
} from './000-nombresyapellidos-personas';
import { url_base, ariaCerrar, browserConfig, fechaInicio, fechaFinal } from './utils/dataTests';
import { EscenariosPruebaCrearPersonas } from './utils/interfaces';
import { url_registro_persona } from './utils/urls';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Crear Persona
let botonNuevaPersona: Locator;

// Cedulas de las personas
const cedulaPersonaCasada = numerosCedulas5;
const cedulaPersonaConyuge = numerosCedulas6;

// Pasaporte de la persona
const pasaportePersonaCasada = numerosPasaporte2;

// Celulares de las personas
const celularPersonaCasada = numerosCelular;
const celularPersonaConyuge = numerosCelular;

// Numeros para los correos de las personas 
const numerosCorreoPersonaCasada = numerosCorreo;
const numerosCorreoPersonaConyuge = numerosCorreo;

// Nombre y apellido de la persona casada
const nombrePersonaCasada = nombrePersonaFisicaCasada;
const apellidoPersonaCasada = apellidoPersonaFisicaCasada;

// Nombre y apellido del conyuge de la persona
const nombrePersonaConyuge = nombrePersonaFisicaConyuge;
const apellidoPersonaConyuge = apellidoPersonaFisicaConyuge;

// Correos de las personas
const correoPersonaCasada = nombrePersonaCasada.split(' ').join('') + numerosCorreoPersonaCasada;
const correoPersonaConyuge = nombrePersonaConyuge.split(' ').join('') + numerosCorreoPersonaConyuge;

/* Pruebas */

test.describe.serial('Crear Persona Casada y Conyuge - Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosPruebaCrearPersonas) {
        test.describe(`Tests cuando el parametro es: ${Object.values(escenarios).toString()}`, () => {
            test.beforeAll(async () => { // Antes de que se realicen todas las pruebas
                /* Crear el browser, con la propiedad headless */
                browser = await chromium.launch({
                    headless: browserConfig.headless,
                    args: browserConfig.args
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
                // Tests cuando el ID_OPERACION sea 3
                test('Hacer click al boton de nueva persona', async () => {
                    // Boton Nueva persona
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
                    await expect(page).toHaveURL(`${url_registro_persona}persona_fisica/create?step=1`);
                });
            
                test('Registrar a la persona - Datos Generales', async() => {
                    // Input de la cedula. Cada cedula debe ser unica
                    const campoCedula = page.locator('#person_DOCUMENTO_IDENTIDAD');
                    await campoCedula?.fill(cedulaPersonaCasada);
                    
                    // Pasaporte 
                    const campoPasaporte = page.locator('#person_NO_PASAPORTE');
                    await campoPasaporte.click();
                    await campoPasaporte.fill(pasaportePersonaCasada); 
                    
                    // Input del nombre
                    const campoNombre = page.locator('#person_NOMBRES');
                    await campoNombre?.fill(`${nombrePersonaCasada}`);
            
                    // Input del apellido
                    const campoApellido = page.locator('#person_APELLIDOS');
                    await campoApellido?.fill(`${apellidoPersonaCasada}`);
            
                    // Seleccionar la nacionalidad
                    await page.locator('#person_NACIONALIDAD')?.fill('DOMINICANA');
                    await page.locator('text=DOMINICANA').nth(0).click();
            
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
            
                    // Input de la cantidad de dependientes
                    const campoDependientes = page.locator('#person_CANT_DEPENDIENTES');
                    await campoDependientes?.fill('0');
            
                    // Input de ejecutivo
                    const campoEjecutivo = page.locator('#person_ID_EJECUTIVO');
                    await campoEjecutivo?.fill('CLIENT');
                    // Hacer click a la opcion de cliente inactivo
                    await page.locator('text=CLIENTE INACTIVO').click();
            
                    // Seleccionar sexo
                    await page.locator('text=Femenino').click();
            
                    // Input del estado civil
                    const campoEstado = page.locator('#person_ESTADO_CIVIL');
                    await campoEstado?.fill('Casado');
                    await page.locator('text=Casado(a)').click();
            
                    // Click al boton de no referido
                    await page.locator('#person_NO_REFERIDO').click();
            
                    // Input Categoria Solicitada
                    const campoCategoria = page.locator('#person_ID_CATEGORIA_SOLICITADA');
                    await campoCategoria?.fill('ahorra');
                    // Seleccionar la opcion de socio ahorrante
                    await page.locator('text=SOCIO AHORRANTE').click();
            
                    // Hacer click en el boton de guardar y continuar
                    guardarContinuar();
                });
            
                test('Registrar a la persona - Informacion de ingresos', async () => {
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_registro_persona}persona_fisica/create?step=2`);
            
                    // El titulo de Informacion de Ingresos debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'INFORMACIÓN DE INGRESOS'})).toBeVisible();
            
                    // Seleccionar una ocupacion
                    const campoOcupacion = page.locator('#person_OCUPACION');
                    await campoOcupacion?.fill('Veterina');
                    // Hacer click a la opcion de veterinario
                    await page.getByText('VETERINARIO', {exact: true}).click();
            
                    // Input del lugar de trabajo
                    const campoTrabajo = page.locator('#person_NOMBRE_EMPRESA');
                    await campoTrabajo?.fill('HogarAnimal');
            
                    // Seleccionar tipo de empleo
                    await page.locator('input[type="radio"]').first().check();
            
                    // Input del email de la empresa
                    const campoEmailEmpresa = page.locator('#person_EMAIL_EMPRESA');
                    await campoEmailEmpresa?.fill('hogaranimal@hotmail.com');
            
                    // Input del telefono de la empresa
                    const campoTelefonoEmpresa = page.locator('#person_TELEFONO_EMPRESA');
                    await campoTelefonoEmpresa?.fill('8095204478');
            
                    // Input de la direccion de la empresa
                    const campoDireccionEmpresa = page.locator('#person_DIRECCION_EMPRESA');
                    await campoDireccionEmpresa?.fill('PALMARITO, LA VEGA');
            
                    // Seleccionar la ocupacion en la empresa
                    const campoPosicionEmpresa = page.locator('#person_POSICION_EMPRESA');
                    await campoPosicionEmpresa?.fill('veterina');
                    // Hacer click a la opcion de programador web
                    await page.getByTitle('VETERINARIA').getByText('VETERINARIA').click();
            
                    // Input de la fecha de ingreso a la empresa
                    const campoFechaEmpresa = page.locator('#person_FECHA_ENTRADA_EMPRESA');
                    await campoFechaEmpresa?.fill('13/04/2018'); 
            
                    // Seleccionar una actividad economica
                    const campoActividadEconomica = page.locator("(//input[@id='person_ID_ACTIVIDAD_ECONOMICA'])[2]");
                    await campoActividadEconomica?.fill('veterinario');
                    // Hacer click a la opcion de cultivo de berenjenas
                    await page.locator('text=Servicios veterinarios').click();
            
                    // Input de ingreso promedio
                    const campoIngresoPromedio = page.locator('#person_INGRESO_PROMEDIO');
                    await campoIngresoPromedio?.fill('60000');
            
                    // Hacer click en el boton de guardar y continuar
                    guardarContinuar();
                });
            
                test('Registrar a la persona - Informacion adicional de ingresos', async () => {
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_registro_persona}persona_fisica/create?step=3`);
            
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
                
                test('Registrar a la persona - Persona expuesta politicamente (Peps)', async () => {
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_registro_persona}persona_fisica/create?step=4`);
            
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
                    await page.locator('#form_FECHA_INICIO')?.fill('25/03/2022');
            
                    // Input de fecha de final, solo es necesario hacer click, se pone una fecha automatica
                    await page.locator(`${fechaFinal}`).click();
            
                    // Hacer click al boton de aceptar
                    await page.locator('button:has-text("Aceptar")').click();
            
                    // El modal debe de desaparecer
                    await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA EXPUESTA POLÍTICAMENTE'})).not.toBeVisible();
                    
                    // Hacer click en el boton de guardar y continuar
                    guardarContinuar();
                });
            
                test('Registrar a la persona - Direcciones', async () => {
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_registro_persona}persona_fisica/create?step=5`);
            
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
                    await campoCalle?.fill("Calle 15");
            
                    // Input de No. de casa
                    const campoNoCasa = page.locator('#addressesForm_CASA');
                    await campoNoCasa?.fill('2');
            
                    // Hacer click al boton de guardar
                    const botonGuardar = page.getByRole('button', {name: 'save Guardar'});
                    await botonGuardar.click();
            
                    // El modal debe de desaparecer, por lo que el titulo no debe de estar visible
                    await expect(page.locator('text=Registro de Direcciones')).not.toBeVisible();
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
                    await campoNumero?.fill(`${celularPersonaCasada}`);
            
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
                    await campoNombreEmail?.fill(`${correoPersonaCasada}`);
                    // Split = dividir el string en subcadenas, lo que lo convierte en un array y con el Join se quitan los espacios en blanco
            
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

                test('Registrar a la persona - Relacionados - Crear Conyuge de la Persona', async () => {
                    // La url debe cambiar
                    await expect(page).toHaveURL(`${url_registro_persona}persona_fisica/create?step=6`);
            
                    // El titulo de relacionados del socio debe estar visible 
                    await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible(); 

                    // Boton crear relacionado
                    const botonCrearRelacionado = page.locator('text=Crear relacionado');
                    await expect(botonCrearRelacionado).toBeVisible();
                    await botonCrearRelacionado.click();
            
                    // Se debe abrir un modal con los tipos de relacionado
                    await expect(page.locator('h1').filter({hasText: 'TIPO DE RELACIONADO'})).toBeVisible();
            
                    // Click al boton de referencia
                    await page.locator('text=Registro Completo').click();
                });

                test('Registro del Conyuge de la Persona - Datos Generales', async () => {
                    // Se debe abrir un modal con el formulario para el registro
                    await expect(page.locator('h1').filter({hasText: 'CREAR RELACIONADO'})).toBeVisible();

                    // Debe estar en la primera seccin de datos generales
                    await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();
            
                    // Cedula
                    await page.locator('#relatedRecord_DOCUMENTO_IDENTIDAD').fill(`${cedulaPersonaConyuge}`);
            
                    // Nombres
                    await page.locator('#relatedRecord_NOMBRES').fill(`${nombrePersonaConyuge}`);
            
                    // Apellidos
                    await page.locator('#relatedRecord_APELLIDOS').fill(`${apellidoPersonaConyuge}`);
            
                    // Tipo de relacion
                    await page.locator('#relatedRecord_ID_PARENTESCO').click();
                    // Elegir el tipo de relacion Representante de Empresa
                    await page.locator('text=ESPOSA(O)').click();
            
                    // Fecha de nacimiento
                    await page.locator('#relatedRecord_FECHA_NAC').fill('05/06/1989');
            
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
                    await page.locator('text=Casado(a)').click();
            
                    // Hacer click en guardar y continuar
                    guardarContinuar();
                });

                test('Registro del Conyuge de la Persona - Informacion de Ingresos', async () => {
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'INFORMACIÓN DE INGRESOS'})).toBeVisible();
            
                    // Ocupacion
                    await page.locator('#relatedRecord_OCUPACION').fill('Veterina');
                    // Elegir una de las opciones
                    await page.getByText('VETERINARIO', {exact: true}).click();
            
                    // Lugar de trabajo
                    await page.locator('#relatedRecord_NOMBRE_EMPRESA').fill('HogarAnimal');
            
                    // Tipo de empleo
                    await page.locator('text=Privado').click();
            
                    // Posicion en la empresa
                    await page.locator('#relatedRecord_POSICION_EMPRESA').fill('VETERINARIO');
                    // Elegir una opcion
                    await page.getByText('MEDICO VETERINARIO').nth(2).click();
            
                    // Actividad Economica
                    const actividadEconomicaRelacionado = page.locator('#relatedRecord_ID_ACTIVIDAD_ECONOMICA').nth(1); 
                    await actividadEconomicaRelacionado.click();
                    await actividadEconomicaRelacionado.fill('veterinario');
                    // Elegir una opcion
                    await page.locator('text=Servicios veterinarios').click();
            
                    // Fecha de ingreso
                    await page.locator('#relatedRecord_FECHA_ENTRADA_EMPRESA').fill('13/04/2018');
            
                    // Ingreso Promedio
                    await page.locator('#relatedRecord_INGRESO_PROMEDIO').fill('75000');
            
                    // Hacer click en guardar y continuar
                    guardarContinuar();
                });

                test('Registro del Conyuge de la Persona - Peps', async () => {
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
                    await page.locator('#form_FECHA_INICIO').fill('06/08/2022');
            
                    // Click al input de fecha final, coloca una fecha automatica
                    await page.locator(`${fechaFinal}`).click();
            
                    // Click en Aceptar
                    await page.locator('text=Aceptar').click();
            
                    // El modal debe cerrarse
                    await expect(modalPeps).not.toBeVisible();
            
                    // Hacer click en guardar y continuar
                    guardarContinuar();
                });

                test('Registro del Conyuge de la Persona - Telefonos', async () => {
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
                    await page.locator('#form_NUMERO').fill(`${celularPersonaConyuge}`);
            
                    // Click al icono de guardar telefono
                    await page.locator('button', { has: page.locator('span > svg[data-icon=save]')}).click();

                    // Se debe mostrar un mensaje de que se han guardado correctamente los datos
                    await expect(page.locator('text=Contacto Persona almacenado exitosamente.').first()).toBeVisible();
                });

                test('Registro del Conyuge de la Persona - Emails / Redes Sociales', async () => {
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
                    await campoNombreEmail?.fill(`${nombrePersonaConyuge.split(' ').join('')}${correoPersonaConyuge}`);
            
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

                test('Registro del Conyuge de la Persona - Direcciones', async () => {
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
                    await provincia.fill('La Ve');
                    // Seleccionar Santiago
                    await page.locator('text=LA VEGA').first().click();
            
                    // Municipio o Ciudad
                    await page.locator('#addressesForm_DESCMUNICIPIO').click();
                    // Seleccionar un municipio
                    await page.locator('text=JARABACOA').click();
            
                    // Sector
                    await page.locator('#addressesForm_DESCSECTOR').click();
                    // Seleccionar un sector
                    await page.locator('text=SABANETA').click();
            
                    // Calle
                    const calle = page.locator('#addressesForm_CALLE');
                    await calle.fill('Calle 15');
            
                    // No. Casa
                    const casa = page.locator('#addressesForm_CASA');
                    await casa.fill('2');
            
                    // Click al boton de guardar
                    await page.getByRole('button', {name: 'save Guardar'}).click();
            
                    // El modal debe cerrarse
                    await expect(modalDirecciones).not.toBeVisible();

                    // Debe mostrarse la direccion agregada
                    const direccionAgregada = page.getByRole('cell', {name: 'CALLE 15, SABANETA, CASA NO. 2, LA VEGA, REPUBLICA DOMINICANA'});
                    await expect(direccionAgregada).toBeVisible();

                    // Click en Finalizar
                    const finalizarRelacionado = page.locator('#relatedRecord').getByRole('button', {name: 'check Finalizar'});
                    await expect(finalizarRelacionado).toBeVisible();
                    await finalizarRelacionado.click();
                });
            
                test('Finalizar con el Registro de la Persona Casada y el Conyuge', async () => {
                    // Hacer click al boton de finalizar
                    const botonFinalizar = page.locator('#person').getByRole('button', {name: 'check Finalizar'});
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();

                    // Esperar que se abran dos nuevas pestañas con los reportes
                    const page1 = await context.waitForEvent('page');
                    const page2 = await context.waitForEvent('page');

                    // Esperar que el reporte este visible
                    await page2.waitForTimeout(3000);

                    // Cerrar la primera pagina
                    await page2.close();

                    // Esperar que el reporte este visible
                    await page1.waitForTimeout(8000);

                    // Cerrar la segunda pagina
                    await page1.close();
                });
            };
        
            test.afterAll(async () => { /* Despues de que se realizen todas las pruebas */
                // Guardar la cedula de la personsa casada
                await page.evaluate((cedulaPersonaCasada) => window.localStorage.setItem('cedulaPersonaCasada', cedulaPersonaCasada), cedulaPersonaCasada);
                // Guardar el nombre y el apellido de la persona casada
                await page.evaluate((nombrePersonaCasada) => window.localStorage.setItem('nombrePersonaCasada', nombrePersonaCasada), nombrePersonaCasada);
                await page.evaluate((apellidoPersonaCasada) => window.localStorage.setItem('apellidoPersonaCasada', apellidoPersonaCasada), apellidoPersonaCasada);

                // Guardar la cedula de la persona conyugue
                await page.evaluate((cedulaPersonaConyuge) => window.localStorage.setItem('cedulaPersonaConyuge', cedulaPersonaConyuge), cedulaPersonaConyuge);
                // Guardar el nombre de la persona conyugue
                await page.evaluate((nombrePersonaFisicaConyuge) => window.localStorage.setItem('nombrePersonaFisicaConyuge', nombrePersonaFisicaConyuge), nombrePersonaFisicaConyuge);
                // Guardar el apellido de la persona conyugue
                await page.evaluate((apellidoPersonaFisicaConyuge) => window.localStorage.setItem('apellidoPersonaFisicaConyuge', apellidoPersonaFisicaConyuge), apellidoPersonaFisicaConyuge);
        
                // Guardar nuevamente el Storage con los datos de la persona casada
                await context.storageState({path: 'state.json'});
            
                // Cerrar la pagina
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});
