import { APIResponse, Browser, BrowserContext, chromium, expect, Page, Locator, test } from '@playwright/test';
import { numerosPasaporte } from './utils/cedulasypasaporte';
import { url_base, formBuscar } from './utils/dataTests';
import { EscenariosActividadParametrosEditarPersona } from './utils/interfaces';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Boton de Editar
let botonEditarCuenta: Locator;

// Inputs para los tests
let inputNombre: Locator;
let inputApellido: Locator;
let editarDireccion: Locator;
let editarTelefono: Locator;
let editarEmail: Locator;

// Celular de la persona
const pasaporte = numerosPasaporte;

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
                browser = await chromium.launch({
                    headless: false
                });
        
                // Crear el context
                context =  await browser.newContext({
                    storageState: 'state.json'
                });
        
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

                // Boton de Editar Cuenta
                botonEditarCuenta = page.getByRole('row', {name: `${nombre} ${apellido}`}).getByRole('button', {name: 'edit'});

                // Cedula, nombre y apellido de la persona
                cedula = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
                nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
                apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

                // Nombre, telefono y correo de la empresa
                nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));
                correoEmpresa = await page.evaluate(() => window.localStorage.getItem('correoEmpresa'));
                telefonoEmpresa = await page.evaluate(() => window.localStorage.getItem('telefonoJuridica'));
            });
        
            // Funcion con el boton de continuar, que se repite en cada seccion del registro
            const actualizarContinuar = async () => {
                // continuar
                const botonContinuar = page.locator('button:has-text("Actualizar y continuar")');
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
                await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/`);
            });

            test('Buscar la cuenta de la Persona a Editar', async () => {
                // Buscar a la persona
                await page.locator(`${formBuscar}`).fill(`${cedula}`);
            });

            // Condicion para los diferentes parametros que pueden llegar en el ID_OPERACION
            if (escenarios.ID_OPERACION_MODIFICA_PER !== '4') {
                // Test cuando el ID_OPERACION_MODIFICA_PER sea diferente de 4
                test('El boton de Editar no debe esatr visible', async () => {
                    // Click al boton de editar cuenta
                    await expect(botonEditarCuenta).not.toBeVisible();
                });

            } else if (escenarios.ID_OPERACION_MODIFICA_PER === '4' && escenarios.ID_OPERACION_EDITAR_DIRECCION && escenarios.ID_OPERACION_EDITAR_EMAIL && escenarios.ID_OPERACION_EDITAR_NOMBRE && escenarios.ID_OPERACION_EDITAR_TEL === '') {
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
                    await expect(page.locator('#person_NOMBRES')).toHaveValue(`${nombre}`);

                    // El input del nombre debe estar deshabilitado

                    // El apellido debe estar visible
                    await expect(page.locator('#person_APELLIDOS')).toHaveValue(`${apellido}`);

                    // El input del apellido debe estar deshabilitado

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
                    const direccionRelacionado = page.getByRole('cell', {name: 'CALLE 10, EL MAMEY, CASA NO. 20, SANTIAGO, REPUBLICA DOMINICANA'});
                    await expect(direccionRelacionado).toBeVisible();

                    // No debe permitir editar la direccion

                    // No debe permitir editar el telefono

                    // No debe permitir editar el email

                    // Click en Actualizar y continuar
                    actualizarContinuar();
                });

                test('Agregar la informacion faltante del socio - Relacionados del Socio', async () => {
                    // El titulo principal debe estar visible
                    await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();
                });

                test('Finalizar con la Edicion de la Persona Fisica', async () => {
                    // Hacer click al boton de finalizar
                    const botonFinalizar = page.locator('text=Finalizar');
                    await expect(botonFinalizar).toBeVisible();
                    await botonFinalizar.click();

                    // Esperar que se abran dos nuevas pestañas con los reportes
                    const page1 = await context.waitForEvent('page');
                    const page2 = await context.waitForEvent('page');
                  
                    // Cerrar las dos ventanas con los reportes
                    await page1.close();
                    await page2.close();
                });

            } else if (escenarios.ID_OPERACION_MODIFICA_PER === '4' && escenarios.ID_OPERACION_EDITAR_DIRECCION === '6' && escenarios.ID_OPERACION_EDITAR_EMAIL === '8' && escenarios.ID_OPERACION_EDITAR_NOMBRE == '24' && escenarios.ID_OPERACION_EDITAR_TEL === '7') {
                // Test cuando cada parametro es diferente de vacio

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
