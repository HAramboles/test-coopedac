import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { 
    numerosCedulas2, 
    numerosCedulas3, 
    numerosRegistroMercantil, 
    numerosCorreo, 
    numerosCelular, 
    numerosTelefono
} from './utils/cedulasypasaporte';

// Variables Globales
let browser: Browser;
let context: BrowserContext;
let page: Page

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Cedulas
const cedulaPersonaJuridica = numerosCedulas2;
const cedulaPersonaJuridicaRelacionado = numerosCedulas3;

// Registro Mercantil
const registroMercantil = numerosRegistroMercantil;

// Correos de la persona fisica y del relacionado
const correoJuridica = numerosCorreo;
const correoRelacionado = numerosCorreo;

// Numeros telefonicos
const telefonoJuridica = numerosTelefono;
const celularRelacionado = numerosCelular;

// Nombre de la persona juridica
const nombreJuridica = 'ESPINOS GANADEROS S.R.L';

// Nombre del relacionado
const nombreRelacionado = 'LUCAS MATEO';
const apellidoRelacionado = 'ESPINOZA CASTILLO';

// Pruebas

test.describe('Pruebas con el Registro de Persona Juridica', () => {
    test.beforeAll(async () => { // Antes de las pruebas
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

        // Navegar a la URL de la pagina
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
        // Socios
        await page.locator('text=SOCIOS').click();

        // Operaciones
        await page.locator('text=OPERACIONES').click();

        // Registrar persona
        await page.locator('text=Registrar persona').click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/`);
    });

    test('Crear Persona Juridica', async () => {
        // El titulo de registrar persona debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

        // Boton de Nueva persona
        const botonNuevaPersona = page.locator('text=Nueva persona');
        await expect(botonNuevaPersona).toBeVisible();
        await botonNuevaPersona.click();

        // Debe salir un modal con los dos tipos de personas que se pueden crear
        await expect(page.locator('text=Seleccione el tipo de persona a crear')).toBeVisible();

        // Click al boton de perosna fisica
        const botonPersonaJuridica = page.getByRole('button', {name: 'Persona Jurídica'});
        await expect(botonPersonaJuridica).toBeVisible();
        await botonPersonaJuridica.click();

        // La URL debe cambiar a la del registro
        await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_juridica/create?step=1`);
    });

    test('Registro de Persona Juridica - Datos Generales', async () => {
        // El titulo de datos generales debe estra visible
        await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

        // Razon social / nombre de la empresa
        await page.locator('#legalPerson_NOMBRE_EMPRESA').fill(`${nombreJuridica}`);

        // RNC / cedula
        const campoRNC = page.locator('#legalPerson_RNC');
        await campoRNC.fill(`${cedulaPersonaJuridica}`);

        // Tipo de organizacion
        const tipoOrganizacion = page.locator('#legalPerson_TIPO_SOCIETARIO');
        await tipoOrganizacion.click();
        // Seleccionar un tipo de organizacion
        await page.locator('text=ÚNICO DUEÑO').click();

        // Registro Mercantil
        const campoRegistroMercantil = page.locator('#legalPerson_REGISTRO_MERCANTIL');
        await campoRegistroMercantil.fill(`${registroMercantil}`);

        // Fecha de Vencimiento
        const fechaVencimiento = page.locator('#legalPerson_FECHA_VENC_REG_MERCANTIL');
        await fechaVencimiento.fill('25/09/2030');

        // Actividad Economica
        const actividadEconomica = page.locator("(//input[@id='legalPerson_ID_ACTIVIDAD_ECONOMICA'])[2]");
        await actividadEconomica.click();
        await actividadEconomica.fill('Agricultura, ganadería, ');
        // Seleccionar una actividad economica
        await page.locator('text=AGRICULTURA, GANADERÍA, CAZA Y SILVICULTURA').click();

        // Fecha de fundacion
        const fechaFundacion = page.locator('#legalPerson_FECHA_NAC');
        await fechaFundacion.fill('20/10/2005');

        // Cantidad de empleados
        await page.locator('#legalPerson_CANT_COLABORADORES').fill('56');

        // Ejecutivo
        const inputEjecutivo = page.locator('#legalPerson_ID_EJECUTIVO');
        await inputEjecutivo.click();
        await inputEjecutivo.fill('lega');
        // Seleccionar la opcion legal
        await page.getByText('LEGAL', {exact: true}).click();

        // Categoria Solicitada
        const categoriaSolicitada = page.locator('#legalPerson_ID_CATEGORIA_SOLICITADA');
        await categoriaSolicitada.click();
        // Seleccionar una categoria
        await page.locator('text=SOCIO AHORRANTE').click();

        // Click al boton de no referido
        await page.locator('#legalPerson_NO_REFERIDO').click();

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
        await page.getByRole('button', {name: 'save Guardar'}).click();
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
        await campoNombreEmail?.fill(`empresa${correoJuridica}`);

        // Seleccionar un dominio del email
        const campoDominioEmail = page.locator('#form_DOMAIN');
        await campoDominioEmail.click();
        // Ingresar un dominio de email
        await campoDominioEmail.fill('@GMAIL.COM');

        // Hacer click al icono de guardar email
        await page.locator('button', {has: page.locator('span > svg[data-icon=save]')}).click();

        // Hacer click en el boton de guardar y continuar
        guardarContinuar();
    });

    test('Registro de Persona Juridica - Relacionados del socio - Datos Generales', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();

        // Boton crear relacionado
        const botonCrearRelacionado = page.locator('text=Crear relacionado');
        await expect(botonCrearRelacionado).toBeVisible();
        await botonCrearRelacionado.click();

        // Se debe abrir un modal con los tipos de relacionado
        await expect(page.locator('h1').filter({hasText: 'TIPO DE RELACIONADO'})).toBeVisible();

        // Click al boton de referencia
        await page.locator('text=Registro Completo').click();

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

    test('Registro de Persona Juridica - Relacionados del socio - Informacion de Ingresos', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'INFORMACIÓN DE INGRESOS'})).toBeVisible();

        // Ocupacion
        await page.locator('#relatedRecord_OCUPACION').fill('Agricu');
        // Elegir una de las opciones
        await page.getByText('AGRICULTOR', {exact: true}).click();

        // Lugar de trabajo
        await page.locator('#relatedRecord_NOMBRE_EMPRESA').fill('Ganados y Plantas A&T');

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
        await page.locator('text=AGRICULTURA, GANADERÍA, CAZA Y SILVICULTURA').click();

        // Fecha de ingreso
        await page.locator('#relatedRecord_FECHA_ENTRADA_EMPRESA').fill('10/06/2002');

        // Ingreso Promedio
        await page.locator('#relatedRecord_INGRESO_PROMEDIO').fill('38000');

        // Hacer click en guardar y continuar
        guardarContinuar();
    });

    test('Registro de Persona Juridica - Relacionados del socio - Peps', async () => {
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
        await page.locator('#form_FECHA_FINAL').click();

        // Click en Aceptar
        await page.locator('text=Aceptar').click();

        // El modal debe cerrarse
        await expect(modalPeps).not.toBeVisible();

        // Hacer click en guardar y continuar
        guardarContinuar();
    });

    test('Registro de Persona Juridica - Relacionados del socio - Direcciones', async () => {
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
        await calle.fill('Calle 10');

        // No. Casa
        const casa = page.locator('#addressesForm_CASA');
        await casa.fill('20');

        // Click al boton de guardar
        await page.getByRole('button', {name: 'save Guardar'}).click();

        // El modal debe cerrarse
        await expect(modalDirecciones).not.toBeVisible();
    });

    test('Registro de Persona Juridica - Relacionados del socio - Telefonos', async () => {
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
    });

    test('Registro de Persona Juridica - Relacionados del socio - Emails / Redes Sociales', async () => {
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
        await campoNombreEmail?.fill(`${nombreRelacionado}${correoRelacionado}`);

        // Seleccionar un dominio del email
        const campoDominioEmail = page.locator('#form_DOMAIN');
        await campoDominioEmail.click();
        // Ingresar un dominio de email
        await campoDominioEmail.fill('@GMAIL.COM');

        // Hacer click al icono de guardar email
        await page.locator('button', {has: page.locator('span > svg[data-icon=save]')}).click();

        // Click en Finalizar
        await page.locator('#relatedRecord').getByRole('button', {name: 'check Finalizar'}).click();
    });

    test('Finalizar con el Registro de Persona Juridica', async () => {
        // Hacer click al boton de finalizar
        const botonFinalizar = page.locator('text=Finalizar');
        // Esperar que se abran tres pestañas con los diferentes reportes
        const [newPage, newPage2, newPage3] = await Promise.all([
            context.waitForEvent('page'),
            context.waitForEvent('page'),
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonFinalizar).toBeVisible(),
            await botonFinalizar.click()
        ]);
      
        // Cerrar las paginas con los reportes
        await newPage.close();
        await newPage2.close();
        await newPage3.close();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Guardar la cedula de la persona juridica creada
        await page.evaluate((cedulaPersonaJuridica) => window.localStorage.setItem('cedulaPersonaJuridica', cedulaPersonaJuridica), cedulaPersonaJuridica);
        // Guardar el nombre de la persona juridica creada
        await page.evaluate((nombreJuridica) => window.localStorage.setItem('nombreJuridica', nombreJuridica), nombreJuridica);

        // Guardar la cedula de la persona relacionada creada
        await page.evaluate((cedulaPersonaJuridicaRelacionado) => window.localStorage.setItem('cedulaPersonaJuridicaRelacionado', cedulaPersonaJuridicaRelacionado), cedulaPersonaJuridicaRelacionado);
        // Guardar el nombre y el apellido de la persona relacionada creada
        await page.evaluate((nombreRelacionado) => window.localStorage.setItem('nombrePersonaJuridicaRelacionada', nombreRelacionado), nombreRelacionado);
        await page.evaluate((apellidoRelacionado) => window.localStorage.setItem('apellidoPersonaJuridicaRelacionada', apellidoRelacionado), apellidoRelacionado);

        // Guardar nuevamente el Storage con la cedula, el nombre y el apellido de la persona relacionada
        await context.storageState({path: 'state.json'});

        // Cerrar la pagina
        await page.close();

        // Cerrar el context
        await context.close();
    });
});  