import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { generarNumerosAleatorios } from './utils/functions/functionsRandom';
import { formatDate } from './utils/functions/fechas';
import { ariaCerrar, selectBuscar } from './utils/data/inputsButtons';
import { EscenariosPruebaCrearPersonas } from './utils/dataPages/interfaces';
import { url_base, url_registro_persona } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';
import { generarNombresMasculinos } from './utils/functions/nombresPersonas';

// Vaiables globales 
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Crear Persona
let botonNuevaPersona: Locator;

// Cedula, nombre y apellido de la persona almacenada en el state
let cedulaMadre: string | null;
let nombreMadre: string | null;
let apellidoMadreMenor: string | null;

// Cedula, numero telefonico y correo del menor
const cedulaMenor = generarNumerosAleatorios(11);
const telefonoMenor = ('809' + generarNumerosAleatorios(10));
const numerosParaCorreo = generarNumerosAleatorios(2);

// Nombres de la persona menor de edad
const nombreMenor = generarNombresMasculinos();

// Pruebas
test.describe.serial('Crear Persona Fisica - Menor de Edad - Pruebas con los diferentes parametros', async () => {
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

                // Cedula, nombre y apellido de la madre
                cedulaMadre = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
                nombreMadre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
                apellidoMadreMenor = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
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
                test('Crear Persona Fisica - Menor de Edad', async () => {
                    // Boton Nueva Persona
                    await expect(botonNuevaPersona).toBeVisible();
                    await botonNuevaPersona.click();
            
                    // Debe salir un modal con los dos tipos de personas que se pueden crear
                    await expect(page.locator('text=Seleccione el tipo de persona a crear')).toBeVisible();
            
                    // Click al boton de perosna fisica
                    const botonPersonaJuridica = page.getByRole('button', {name: 'Persona Física'});
                    await expect(botonPersonaJuridica).toBeVisible();
                    await botonPersonaJuridica.click();
            
                    // La URL debe cambiar a la del registro
                    await expect(page).toHaveURL(`${url_registro_persona}persona_fisica/create?step=1`);
                });
            
                test('Registro de Persona Fisica - Menor de Edad - Datos Generales', async () => {
                    // El titulo de datos generales debe estra visible
                    await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

                    // Restarle 8 años al año actual
                    const diaActual = new Date();
                    const año8 = formatDate(new Date(diaActual.setFullYear(diaActual.getFullYear() - 8)));
            
                    // Colocar una fecha de nacimiento, para que aparezca un modal indicando que la persona es un menor de edad
                    const campoFecha = page.locator('#person_FECHA_NAC');
                    await campoFecha?.fill(`${año8}`);
                    // Click en otro lugar para que se muestre el modal
                    await page.locator('#person_EDAD_MINIMA').click();
                    // Modal
                    const modalMenorEdad = page.locator('text=Estas registrando a un menor de edad.');
                    await expect(modalMenorEdad).toBeVisible();
                    // Click en Aceptar
                    await page.locator('text=Aceptar').click();
            
                    // El modal debe desaparecer
                    await expect(modalMenorEdad).not.toBeVisible();
            
                    // Cedula
                    const campoCedula = page.locator('#person_DOCUMENTO_IDENTIDAD');
                    await campoCedula?.fill(`${cedulaMenor}`);
            
                    // Nombres
                    const campoNombre = page.locator('#person_NOMBRES');
                    await campoNombre?.fill(`${nombreMenor}`);
            
                    // Apellidos
                    const campoApellido = page.locator('#person_APELLIDOS');
                    await campoApellido?.fill(`${apellidoMadreMenor}`);
            
                    // Nacionalidad
                    // Seleccionar la nacionalidad
                    await page.locator('#person_NACIONALIDAD')?.fill('DOMINICANA');
                    await page.locator('text=DOMINICANA').nth(0).click();
            
                    // Seleccionar si es extranjero o no
                    const seleccionarExtranjero = page.locator('input[type="radio"]')
                    await seleccionarExtranjero.first().press('ArrowRight');
            
                    // Lugar de nacimiento
                    const campoLugar = page.locator('#person_LUGAR_NAC');
                    await campoLugar?.fill('La Vega');
            
                    // Nivel academico
                    const campoAcademico = page.locator('#person_ID_NIVEL_ACA');
                    await campoAcademico?.click();
                    // Hacer click a la opcion que aparece de N/A
                    await page.locator('text=N/A').click();
            
                    // Ejecutivo
                    const campoEjecutivo = page.locator('#person_ID_EJECUTIVO');
                    await campoEjecutivo?.fill('Cliente');
                    // Hacer click a la opcion de cliente inactivo
                    await page.locator('text=CLIENTE INACTIVO').click();
            
                    // Sexo
                    await page.locator('text=Masculino').click();
            
                    // Estado Civil
                    const campoEstado = page.locator('#person_ESTADO_CIVIL');
                    await campoEstado?.fill('Soltero');
                    await page.locator('text=Soltero(a)').click();
            
                    // Buscar un referido
                    await page.locator(`${selectBuscar}`).click();
                    // Digitar el nombre de la madre
                    await page.locator(`${selectBuscar}`).fill(`${nombreMadre} ${apellidoMadreMenor}`);
                    // Eelgir la opcion con el nombre de la madre
                    await page.getByRole('option', {name: `${nombreMadre} ${apellidoMadreMenor}`}).click();
            
                    // Categoria Solicitada
                    const campoCategoria = page.locator('#person_ID_CATEGORIA_SOLICITADA');
                    await campoCategoria?.fill('ahorra');
                    // Seleccionar la opcion de socio ahorrante
                    await page.locator('text=SOCIO AHORRANTE').click();
            
                    // Click en guardar y continuar
                    guardarContinuar();
                }); 
            
                test('Registro de Persona Fisica - Menor de Edad - Informacion de Ingresos', async () => {
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_registro_persona}persona_fisica/create?step=2`);
            
                    // El titulo de Informacion de Ingresos debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'INFORMACIÓN DE INGRESOS'})).toBeVisible();
            
                    // Seleccionar una ocupacion
                    const campoOcupacion = page.locator('#person_OCUPACION');
                    await campoOcupacion?.fill('Estudi');
                    // Hacer click a la opcion de programador
                    await page.getByText('ESTUDIANTE', {exact: true}).click();
            
                    // Actividad Economica
                    const campoActividadEconomica = page.locator("(//input[@id='person_ID_ACTIVIDAD_ECONOMICA'])[2]");
                    await campoActividadEconomica?.fill('ESTUDIANTE');
                    // Hacer click a la opcion de cultivo de berenjenas
                    await page.locator('text=Otros servicios (estudiantes, amas de casa, pensionados)').click();
            
                    // Ingresos del menor (otros ingresos)
                    const campoOtrosIngresos = page.locator('#person_OTROS_INGRESOS');
                    await campoOtrosIngresos?.fill('1000');
            
                    // Seleccionar el tipo de moneda en otros ingresos
                    const campoMonedaOtrosIngresos = page.locator('#person_ID_MONEDA_OTROS_ING');
                    await campoMonedaOtrosIngresos.click();
                    // Elegir una moneda, en este caso dolar
                    await page.getByRole('option', {name: 'RD (PESO)'}).click();
            
                    // Justificacion de los ingresos del menor
                    const campoJustificacionIngresos = page.locator('#person_RAZON_OTROS_INGRESOS');
                    await campoJustificacionIngresos?.fill('Ingresos dado por los padres');
            
                    // Click en guardar y continuar
                    guardarContinuar();
                });
            
                test('Registro de Persona Fisica - Menor de Edad - Informacion de Adicional de Ingresos', async () => {
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_registro_persona}persona_fisica/create?step=3`);
            
                    // El titulo de informacion adicional de ingresos debe estar visible
                    await expect(page.locator('h1').filter({ hasText: 'INFORMACIÓN ADICIONAL DE INGRESOS' })).toBeVisible();
            
                    // Colocar un origen para los recursos
                    const campoOrigenRecursos = page.locator('#person_ORIGEN_RECURSOS');
                    await campoOrigenRecursos?.fill('Ingresado por los padres');
            
                    // Hacer click en el boton de guardar y continuar
                    guardarContinuar();
                });
            
                test('Registro de Persona Fisica - Menor de Edad - Persona expuesta politicamente (Peps)', async () => {
                    // La url debe de cambiar
                    await expect(page).toHaveURL(`${url_registro_persona}persona_fisica/create?step=4`);
            
                    // El titulo de persona expuesta politicamente debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'PERSONA EXPUESTA POLÍTICAMENTE'})).toBeVisible(); 

                    // No se puede agregar Peps a un menor de edad

                    // El boton de Agregar Peps debe estar deshabilitado
                    await expect(page.getByRole('button', {name: 'Agregar Peps'})).toBeDisabled();
            
                    // Hacer click en el boton de guardar y continuar
                    guardarContinuar();
                });
            
                test('Registro de Persona Fisica - Menor de Edad - Direcciones', async () => {
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
                    await campoSector?.fill('Angos');
                    await page.locator('text=ANGOSTO').click();
            
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
                });
            
                test('Registro de Persona Fisica - Menor de Edad - Telefonos', async () => {
                    // El titulo de telefonos debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'TELÉFONOS'})).toBeVisible();
                    
                    // Boton de agregar telefono
                    const botonAgregarTelefono = page.locator('text=Agregar teléfono');
                    await expect(botonAgregarTelefono).toBeVisible();
                    await botonAgregarTelefono.click();
            
                    // Seleccionar el tipo de telefono
                    await page.locator('#form_VALOR').click();
                    await page.getByText('CASA', {exact: true}).click(); 
            
                    // Input del numero
                    const campoNumero = page.locator('#form_NUMERO');
                    await campoNumero.click();
                    await campoNumero?.fill(`${telefonoMenor}`);
            
                    // Hacer click al icono de guardar telefono
                    await page.locator('button', {has: page.locator('span > svg[data-icon=save]')}).click();

                    // Se debe mostrar un mensaje de que se han guardado correctamente los datos
                    await expect(page.locator('text=Contacto Persona almacenado exitosamente.')).toBeVisible();

                    // Cerrar el mensaje
                    await page.locator(`${ariaCerrar}`).click();
                });
            
                test('Registro de Persona Fisica - Menor de edad - Email/Redes Sociales', async () => {
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
                    await campoNombreEmail?.fill(`${nombreMenor.split(' ').join('')}${numerosParaCorreo}`);
                    // Split = dividir el string en subcadenas, lo que lo convierte en un array y con el Join se quita el espacio en blanco
            
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
            
                test('Registro de Persona Fisica - Menor de Edad - Relacionados', async () => {                    
                    // La url debe cambiar
                    await expect(page).toHaveURL(`${url_registro_persona}persona_fisica/create?step=6`);

                    // Esperar que la pagina cargue
                    await page.waitForTimeout(1000);
            
                    // El titulo de relacionados del socio debe estar visible 
                    await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();
            
                    // Buscar un relacionado del menor, debe ser un padre, madre o un tutor
                    // Usar la cedula de la persona fisica creada
                    const campoBuscarRelacionado = page.getByRole('combobox');
                    await campoBuscarRelacionado.click();
                    await campoBuscarRelacionado?.fill(`${cedulaMadre}`);
                    // Click a la opcion que coincide con lo buscado
                    await page.locator(`text=${nombreMadre} ${apellidoMadreMenor}`).click();
            
                    // Debe de aparecer un modal
                    await expect(page.locator('text=SELECCIONAR TIPO DE RELACIÓN')).toBeVisible();
            
                    // Seleccionar tipo de relacion
                    await page.getByRole('dialog').getByRole('combobox').click();
                    await page.locator('text=MADRE').click();
                    await page.locator('text="Aceptar"').click();

                    // Esperar que la madre se haya agregado correctamente
                    await expect(page.getByRole('cell', {name: `${nombreMadre} ${apellidoMadreMenor}`})).toBeVisible();

                    // La relacion debe mostrase
                    await expect(page.getByRole('cell', {name: 'MADRE'})).toBeVisible();
                });
            
                test('Finalizar con el Registro del Menor de Edad', async () => {
                    // Hacer click al boton de finalizar
                    const botonFinalizar = page.locator('text=Finalizar');
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
                // Guardar la cedula del menor
                await page.evaluate((cedulaMenor) => window.localStorage.setItem('cedulaMenor', cedulaMenor), cedulaMenor);
        
                // Guardar el nombre y el apellido del menor
                await page.evaluate((nombreMenor) => window.localStorage.setItem('nombreMenor', nombreMenor), nombreMenor);
                await page.evaluate((apellidoMadreMenor) => window.localStorage.setItem('apellidoMenor', `${apellidoMadreMenor}`), apellidoMadreMenor);
        
                // Guardar nuevamente el Storage con la cedula, el nombre y el apellido del menor
                await context.storageState({path: 'state.json'});
        
                // Cerrar la pagina
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});

