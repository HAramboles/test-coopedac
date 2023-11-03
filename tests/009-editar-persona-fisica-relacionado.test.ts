import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { numerosPasaporte, numerosCelular } from './utils/functions/cedulasypasaporte';
import { formBuscar, noData } from './utils/data/inputsButtons';
import { EscenariosActividadParametrosEditarPersona } from './utils/dataPages/interfaces';
import { url_base, url_registro_persona } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Editar
let botonEditarCuenta: Locator;

// Inputs para los tests
let inputNombre: Locator;
let inputApellido: Locator;
let editarTelefono: Locator;
let editarEmail: Locator;

// Pasaporte y nuevo celular de la persona
const pasaporte = numerosPasaporte;
const nuevoCelular = numerosCelular;

// Cedula, nombre, apellido de la persona
let cedula: string | null;
let nombre: string | null;
let apellido: string | null;

// Nombre, telefono y correo de la empresa
let nombreEmpresa: string | null;
let correoEmpresa: string | null;
let telefonoEmpresa: string | null;

// Pruebas
test.describe.serial('Editar la Cuenta de una Persona Fisica - Pruebas con los diferentes parametros', async () => {
    for (const escenarios of EscenariosActividadParametrosEditarPersona) {
        test.describe(`Test cuando el parametro es: ${Object.values(escenarios).toString()}`, () => {
            test.beforeAll(async () => { // Antes de las pruebas
                // Crear el browser
                browser = await chromium.launch(browserConfig);
        
                // Crear el context
                context = await browser.newContext(contextConfig);
        
                // Crear una page
                page = await context.newPage();

                // Eventos para la request relation
                await page.route(/\/actividad_parametro/, async route => {
                    // Fetch a la peticion original
                    const response: APIResponse = await page.request.fetch(route.request());

                    // Constante con el body
                    const body = await response.json();
                    // Condicicion para cambiar los parametros del body
                    if (Object.keys(body?.data).length > 1) {
                        // Reemplazar el body con la response con los datos de los escenarios
                        body.data = Object.assign(body.data, escenarios);
                        route.fulfill({
                            response,
                            body: JSON.stringify(body)
                        });
                    } else {
                        route.continue();
                    };
                });
        
                // Ingresar a la pagina
                await page.goto(`${url_base}`);

                // Cedula, nombre y apellido de la persona
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

                // Nombre, telefono y correo de la empresa
                nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));
                correoEmpresa = await page.evaluate(() => window.localStorage.getItem('correoEmpresa'));
                telefonoEmpresa = await page.evaluate(() => window.localStorage.getItem('telefonoJuridica'));

                // Boton de Editar Cuenta
                botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});

                // Inputs
                inputNombre = page.locator('#person_NOMBRES');
                inputApellido = page.locator('#person_APELLIDOS');
                editarTelefono = page.getByRole('row', {name: 'CELULAR'}).getByRole('button', {name: 'edit'});
                editarEmail = page.getByRole('row', {name: 'EMAIL'}).getByRole('button', {name: 'edit'});
            });
        
            // Funcion con el boton de continuar, que se repite en cada seccion del registro
            const actualizarContinuar = async () => {
                // continuar
                const botonContinuar = page.locator('button:has-text("Actualizar y continuar")');
                await expect(botonContinuar).toBeVisible();
                // presionar el boton
                await botonContinuar.click();
            };
        
            test('Ir a la opcion de Registro de Persona', async () => {
                // Socios
                await page.getByRole('menuitem', {name: 'SOCIOS'}).click();
        
                // Operaciones
                await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();
        
                // Registrar persona
                await page.getByRole('menuitem', {name: 'Registrar persona'}).click();
        
                // La URL deba cambiar
                await expect(page).toHaveURL(`${url_registro_persona}`);
            });

            test('Buscar la cuenta de la Persona a Editar', async () => {
                // Buscar a la persona
                await page.locator(`${formBuscar}`).fill(`${cedula}`);
            });

            // Condicion para los diferentes parametros que pueden llegar en el ID_OPERACION
            if (escenarios.ID_OPERACION_MODIFICA_PER !== '4') {
                // Test cuando el ID_OPERACION_MODIFICA_PER sea diferente de 4
                test('El boton de Editar no debe estar visible', async () => {
                    // Click al boton de editar cuenta
                    await expect(botonEditarCuenta).not.toBeVisible();
                });

            } else if (escenarios.ID_OPERACION_MODIFICA_PER === '4' && escenarios.ID_OPERACION_EDITAR_DIRECCION, escenarios.ID_OPERACION_EDITAR_EMAIL,escenarios.ID_OPERACION_EDITAR_NOMBRE, escenarios.ID_OPERACION_EDITAR_TEL === '') {
                // Tests cuando el ID_OPERACION_MODIFICA_PER sea igual a 4 y los demas son vacios
                test('Editar la Cuenta del Socio', async () => {
                    // Click al boton de editar cuenta
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();

                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/edit/);
                });

                test('Datos del Socio agregados anteriormente - Datos Generales', async () => {
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

                    // El nombre debe estar visible
                    await expect(inputNombre).toHaveValue(`${nombre}`);

                    // El input del nombre debe estar deshabilitado
                    await expect(inputNombre).toBeDisabled();

                    // El apellido debe estar visible
                    await expect(inputApellido).toHaveValue(`${apellido}`);

                    // El input del apellido debe estar deshabilitado
                    await expect(inputApellido).toBeDisabled();

                    // La nacionalidad debe estar visible
                    await expect(page.locator('#person').getByTitle('DOMINICANA')).toBeVisible();

                    // El estado civil debe estar visible
                    await expect(page.locator('#person').getByTitle('Soltero(a)')).toBeVisible();
                });

                test('Agregar la informacion faltante del socio - Datos Generales', async () => {
                    // Pasaporte
                    const campoPasaporte = page.locator('#person_NO_PASAPORTE');
                    await campoPasaporte.click();
                    await campoPasaporte.fill(pasaporte); 

                    // Lugar de nacimiento
                    const campoLugar = page.locator('#person_LUGAR_NAC');
                    await campoLugar?.fill('La Vega');

                    // Nivel academico
                    const campoAcademico = page.locator('#person_ID_NIVEL_ACA');
                    await campoAcademico?.fill('Universitario');
                    // Hacer click a la opcion que aparece de nivel academico universitario
                    await page.locator('text=UNIVERSITARIO').click();

                    // Cantidad de dependientes
                    const campoDependientes = page.locator('#person_CANT_DEPENDIENTES');
                    await campoDependientes?.fill('0');

                    // Ejecutivo
                    const campoEjecutivo = page.locator('#person_ID_EJECUTIVO');
                    await campoEjecutivo?.fill('Cliente');
                    // Hacer click a la opcion de cliente inactivo
                    await page.locator('text=CLIENTE INACTIVO').click();

                    // Click al boton de no referido
                    await page.locator('#person_NO_REFERIDO').click();

                    // Categoria Solicitada
                    const campoCategoria = page.locator('#person_ID_CATEGORIA_SOLICITADA');
                    await campoCategoria?.fill('ahorra');
                    // Seleccionar la opcion de socio ahorrante
                    await page.locator('text=SOCIO AHORRANTE').click();

                    // Click en Actualizar y continuar
                    actualizarContinuar();
                });

                test('Datos del Socio agregados anteriormente - Informacion de Ingresos', async () => {
                    // La Ocupacion debe estar visible
                    await expect(page.locator('#person').getByTitle('AGRICULTOR')).toBeVisible();

                    // El lugar de trabajo debe estar visible
                    await expect(page.locator('#person_NOMBRE_EMPRESA')).toHaveValue(`${nombreEmpresa}`);
                });

                test('Agregar la informacion faltante del socio - Informacion de Ingresos', async () => {
                    // Email de la empresa
                    const campoEmailEmpresa = page.locator('#person_EMAIL_EMPRESA');
                    await campoEmailEmpresa?.fill(`${correoEmpresa}`);

                    // Telefono de la empresa
                    const campoTelefonoEmpresa = page.locator('#person_TELEFONO_EMPRESA');
                    await campoTelefonoEmpresa?.fill(`${telefonoEmpresa}`);

                    // Click en Actualizar y continuar
                    actualizarContinuar();
                });

                test('Agregar la informacion faltante del socio - Informacion Adicional de Ingresos', async () => {
                    // Colocar un origen para los recursos
                    const campoOrigenRecursos = page.locator('#person_ORIGEN_RECURSOS');
                    await campoOrigenRecursos?.fill('Trabajo');
            
                    // Colocar un proposito para los ingresos
                    const campoProposito = page.locator('#person_PROPOSITO_TRANSACCION');
                    await campoProposito?.fill('Para uso personal');

                    // Click en Actualizar y continuar
                    actualizarContinuar();
                });

                test('Agregar la informacion faltante del socio - PEPS - Persona Expuesta Politicamente', async () => {
                    // Titulo de la seccion
                    await expect(page.locator('h1').filter({hasText: 'PERSONA EXPUESTA POLÍTICAMENTE'})).toBeVisible();

                    // El PEP agregado debe estar visible
                    await expect(page.getByRole('row', {name: '1 1 06/08/2022 06/08/2027 ACTIVO'})).toBeVisible();

                    // Click en Actualizar y continuar
                    actualizarContinuar();
                });

                test('Datos del Socio agregados anteriormente - Direcciones - Email - Redes Sociales', async () => {
                    // Los tres titulos deben estar visibles
                    await expect(page.locator('h1').filter({hasText: 'DIRECCIONES'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'TELÉFONOS'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'EMAILS / REDES SOCIALES'})).toBeVisible();

                    // La direccion debe estar visible
                    await expect(page.getByRole('row', {name: 'CALLE 10, EL MAMEY, CASA NO. 20, SANTIAGO, REPUBLICA DOMINICANA'})).toBeVisible();

                    // Click al boton de editar de la direccion
                    await page.getByRole('row', {name: 'CALLE 10, EL MAMEY, CASA NO. 20, SANTIAGO, REPUBLICA DOMINICANA'}).getByRole('button', {name: 'edit'}).click();

                    // No debe permitir editar la direccion, debe salir un modal
                    await expect(page.locator('text=No tienes permisos para editar direcciones.')).toBeVisible();

                    // Click al boton de Aceptar del modal de direccion
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // Click al boton de editar del celular
                    await editarTelefono.click();

                    // No debe permitir editar el telefono, debe salir un modal
                    const noPermisoEditar = page.locator('text=No tiene permiso para editar eMails / redes sociales.');
                    await expect(noPermisoEditar).toBeVisible();

                    // Click al boton de Aceptar del modal de telefono
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // Click al boton de editar del email
                    await editarEmail.click();

                    // No debe permitir editar el email, debe salir un modal
                    await expect(noPermisoEditar).toBeVisible();

                    // Click al boton de Aceptar del modal de email
                    await page.getByRole('button', {name: 'Aceptar'}).click();

                    // Click en Actualizar y continuar
                    actualizarContinuar();
                });

                test('Debe dirigirse al paso de Relacionados del Socio y no debe haber ningun relacionado', async () => {
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();

                    // La persona no debe tener ningun relacionado
                    await expect(page.getByText(`${noData}`)).toBeVisible();
                });

                test('Finalizar con la Edicion de la Persona Fisica', async () => {
                    // Hacer click al boton de finalizar
                    const botonFinalizar = page.locator('text=Finalizar');
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();

                    // Debe salir un mensaje de que no hay relacionados
                    await expect(page.locator('text=No Registró Relacionado.')).toBeVisible();
                    await expect(page.locator('text=¿Desea finalizar el registro sin agregar relacionados?')).toBeVisible();

                    // Click al boton de Finalizar del mensaje modal
                    const botonFinalizarModal = page.getByRole('dialog').getByRole('button', {name: 'check Finalizar'})
                    await expect(botonFinalizarModal).toBeVisible();
                    await botonFinalizarModal.click();

                    // Esperar que se abran dos nuevas pestañas con los reportes
                    const page1 = await context.waitForEvent('page');
                    const page2 = await context.waitForEvent('page');

                    // Cerrar las dos paginas
                    await page2.close();
                    await page1.close();

                    // Debe regresar a la pagina de Registrar personas
                    await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

                    // La URL deba cambiar
                    await expect(page).toHaveURL(/\/registrar_cliente/);
                });

            } else if (escenarios.ID_OPERACION_MODIFICA_PER === '4' && escenarios.ID_OPERACION_EDITAR_DIRECCION === '6' && escenarios.ID_OPERACION_EDITAR_EMAIL === '8' && escenarios.ID_OPERACION_EDITAR_NOMBRE == '24' && escenarios.ID_OPERACION_EDITAR_TEL === '7') {
                // Test cuando cada parametro es diferente de vacio
                test('Editar la Cuenta del Socio', async () => {
                    // Click al boton de editar cuenta
                    await expect(botonEditarCuenta).toBeVisible();
                    await botonEditarCuenta.click();

                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/edit/);
                });

                test('Datos del Socio agregados anteriormente - Datos Generales', async () => {
                    // El titulo debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

                    // El nombre debe estar visible
                    await expect(inputNombre).toHaveValue(`${nombre}`);

                    // El input del nombre debe estar habilitado
                    await expect(inputNombre).toBeEnabled();

                    // El apellido debe estar visible
                    await expect(inputApellido).toHaveValue(`${apellido}`);

                    // El input del apellido debe estar habilitado
                    await expect(inputApellido).toBeEnabled();
                });

                test('Dirigirse al Quinto paso del Formulario', async () => {
                    // Boton del 5 paso
                    const botonQuintoPaso = page.getByRole('button', {name: '5 Direcciones y Contactos Direcciones, teléfonos y redes sociales'});
                    await expect(botonQuintoPaso).toBeVisible();
                    await botonQuintoPaso.click();

                    // La URL debe cambiar
                    await expect(page).toHaveURL(/\/?step=5/);

                    // Los tres titulos deben estar visibles
                    await expect(page.locator('h1').filter({hasText: 'DIRECCIONES'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'TELÉFONOS'})).toBeVisible();
                    await expect(page.locator('h1').filter({hasText: 'EMAILS / REDES SOCIALES'})).toBeVisible(); 

                    // Click al boton de editar direccion
                    await page.getByRole('row', {name: 'CALLE 10, EL MAMEY, CASA NO. 20, SANTIAGO, REPUBLICA DOMINICANA'}).getByRole('button', {name: 'edit'}).click();

                    // El modal debe de aparecer
                    await expect(page.locator('text=EDITAR DIRECCIÓN')).toBeVisible();

                    // Editar la calle
                    const campoCalle = page.locator('#addressesForm_CALLE');
                    await campoCalle.clear();
                    await campoCalle?.fill('Calle 15');

                    // Hacer click al boton de Actualizar
                    const botonActualizar = page.getByRole('button', {name: 'check Actualizar'});
                    await expect(botonActualizar).toBeVisible();
                    await botonActualizar.click();

                    // El modal debe de desaparecer, por lo que el titulo no debe de estar visible
                    await expect(page.locator('text=EDITAR DIRECCIÓN')).not.toBeVisible();

                    // Click al boton de editar celular
                    await editarTelefono.click();

                    // El input del telefono debe estar habilitado para editar
                    const campoNumero = page.locator('#form_NUMERO');
                    await campoNumero.click();

                    // Cambiar el numero de telefono
                    await campoNumero.clear();
                    await campoNumero.fill(`${nuevoCelular}`);

                    // Click al boton de Guardar
                    await page.getByRole('button', {name: 'save'}).click();

                    // Click al boton de editar email
                    await editarEmail.click();

                    // El input del email debe estar habilitado para editar
                    const campoNombreEmail = page.getByPlaceholder('Descripción');
                    await campoNombreEmail.click();

                    // Click al boton de Cancelar
                    await page.getByRole('button', {name: 'stop', exact: true}).click();

                    // Debe salir un mensaje de confirmacion
                    await page.getByText('¿Desea cancelar la operación?').click();

                    // Click al boton de Aceptar del mensaje de confirmacion
                    await page.getByRole('button', {name: 'check Aceptar'}).click();

                    // Click al boton de Actualizar y continuar
                    actualizarContinuar();
                });

                test('Debe dirigirse al paso de Relacionados del Socio y no debe haber ningun relacionado', async () => {
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();

                    // La persona no debe tener ningun relacionado
                    await expect(page.getByText(`${noData}`)).toBeVisible();
                });

                test('Finalizar con la Edicion de la Persona Fisica', async () => {
                    // Hacer click al boton de finalizar
                    const botonFinalizar = page.locator('text=Finalizar');
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();

                    // Debe salir un mensaje de que no hay relacionados
                    await expect(page.locator('text=No Registró Relacionado.')).toBeVisible();
                    await expect(page.locator('text=¿Desea finalizar el registro sin agregar relacionados?')).toBeVisible();

                    // Click al boton de Finalizar del mensaje modal
                    const botonFinalizarModal = page.getByRole('dialog').getByRole('button', {name: 'check Finalizar'})
                    await expect(botonFinalizarModal).toBeVisible();
                    await botonFinalizarModal.click();

                    // Esperar que se abran dos nuevas pestañas con los reportes
                    const page1 = await context.waitForEvent('page');
                    const page2 = await context.waitForEvent('page');

                    // Cerrar las dos paginas
                    await page2.close();
                    await page1.close();

                    // Debe regresar a la pagina de Registrar personas
                    await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();
                });
            };
        
            test.afterAll(async () => { // Despues de las pruebas  
                // Cerrar la page
                await page.close();

                // Cerrar el context
                await context.close();
            });
        });
    };
});
