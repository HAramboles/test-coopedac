import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { actividadJuridicayRelacionado, formBuscar } from './utils/data/inputsButtons';
import { url_base, url_registro_persona } from './utils/dataPages/urls';
import { browserConfig, contextConfig } from './utils/data/testConfig';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// Cedula, nombre, registro mercantil y correo de la empresa
let cedulaEmpresa: string | null;
let nombreEmpresa: string | null;
let registroMercantil: string | null;
let correoEmpresa: string | null;

// Nombres y apellido de la persona relacionada
let nombrePersonaRelacionada: string | null;
let apellidoPersonaRelacionada: string | null;

// Nombres y apellidos de la persona relacionada por referencia
let nombrePersonaRelacionadaReferencia: string | null;
let apellidoPersonaRelacionadaReferencia: string | null;

// Nombre editado de la persona juridica
let nombreJuridica:string;

// Pruebas
test.describe.serial('Pruebas editando una Persona Juridica', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch(browserConfig);

        // Crear el context
        context = await browser.newContext(contextConfig);

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);

        // Cedula, nombre, telefono y correo de la empresa alamacenada en el state
        cedulaEmpresa = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridica'));
        nombreEmpresa = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridica'));
        registroMercantil = await page.evaluate(() => window.localStorage.getItem('registroMercantil'));
        correoEmpresa = await page.evaluate(() => window.localStorage.getItem('correoEmpresa'));

        // Nombre y apellido de la persona relacionada alamcenada en el state
        nombrePersonaRelacionada = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        apellidoPersonaRelacionada = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

        // Nombre y apellido de la persona relacionada por referencia alamcenada en el state
        nombrePersonaRelacionadaReferencia = await page.evaluate(() => window.localStorage.getItem('nombreRelacionadoReferencia'));
        apellidoPersonaRelacionadaReferencia = await page.evaluate(() => window.localStorage.getItem('apellidoRelacionadoReferencia'));
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

    test('Buscar a la persona juridica', async () => {
        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

        // Digitar la cedula de la empresa
        await page.locator(`${formBuscar}`).fill(`${cedulaEmpresa}`);

        // Esperar a que se muestre la persona juridica buscada
        await page.waitForTimeout(2000);

        // Debe mostrarse la persona juridica en la tabla
        await expect(page.getByRole('cell', {name: `${nombreEmpresa}`})).toBeVisible();

        // Click al boton de editar
        await page.getByRole('row', {name: `${nombreEmpresa}`}).getByRole('button', {name: 'edit'}).click();
    });

    test('Editar Persona Juridica - Paso 1 - Datos Generales', async () => {
        // La URL debe cambiar al formulario de editar
        await expect(page).toHaveURL(/\/edit/);

        // Debe estar en el paso 1 del formulario
        await expect(page).toHaveURL(/\/?step=1/);

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

        // La categoria actual debe estar vacia y estar deshabilitada
        const categoriaActual = page.locator('#legalPerson_DESC_CATEGORIA');
        await expect(categoriaActual).toBeDisabled();
        await expect(categoriaActual).toHaveValue('');

        // La razon social debe tener el nombre de la empresa
        const razonSocial = page.locator('#legalPerson_NOMBRE_EMPRESA');
        await expect(razonSocial).toHaveValue(`${nombreEmpresa}`);

        // Editar el nombre de la empresa

        // Nuevo nombre de la persona juridica
        nombreJuridica = `${nombreEmpresa} SRL`;
        await razonSocial.fill(`${nombreJuridica}`)

        // Tipo organizacion
        await expect(page.getByTitle('ÚNICO DUEÑO')).toBeVisible();

        // Registro Mercantil
        await page.locator('#legalPerson_REGISTRO_MERCANTIL').fill(`${registroMercantil}`);

        // Fecha vencimineto
        await expect(page.locator('#legalPerson_FECHA_VENC_REG_MERCANTIL')).toHaveValue('25/09/2030');

        // Actividad Economica
        await expect(page.getByTitle(`${actividadJuridicayRelacionado}`)).toBeVisible();

        // El input otra actividad deb estar vacio
        await expect(page.locator('#legalPerson_OTRA_ACTIVIDAD')).toHaveValue('');

        // Fecha fundacion
        await expect(page.locator('#legalPerson_FECHA_NAC')).toHaveValue('20/10/2005');

        // Cant. empleados
        await expect(page.locator('#legalPerson_CANT_COLABORADORES')).toHaveValue('56');

        // Ejecutivo
        await expect(page.getByTitle('LEGAL')).toBeVisible();

        // Categoria solicitada
        await expect(page.getByTitle('SOCIO EMPRESARIAL')).toBeVisible();

        // Click al boton de Actualizar y continuar
        actualizarContinuar();
    });

    test('Editar Persona Juridica - Paso 2 - Direccion y Contactos', async () => {
        // La URL debe cambiar al paso 2 del formulario
        await expect(page).toHaveURL(/\/?step=2/);

        // Los tres titulos de la pagina deben estar visibles
        await expect(page.locator('h1').filter({hasText: 'DIRECCIONES'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'TELÉFONOS'})).toBeVisible();
        await expect(page.locator('h1').filter({hasText: 'EMAILS / REDES SOCIALES'})).toBeVisible();

        // La direccion debe estar visible
        await expect(page.getByRole('cell', {name: 'CALLE 15, EL MAMEY, CASA NO. 62, SANTIAGO, REPUBLICA DOMINICANA'})).toBeVisible();

        // El telefono de tipo oficina debe estar visible
        await expect(page.getByRole('cell', {name: 'OFICINA'})).toBeVisible();

        // El email debe estar visible
        await expect(page.getByRole('cell', {name: `${correoEmpresa}`})).toBeVisible();

        // Click al boton de Actualizar y continuar
        actualizarContinuar();
    });

    test('Editar Persona Juridica - Paso 3 - PEPS', async () => {
        // La URL debe cambiar al paso 3 del formulario
        await expect(page).toHaveURL(/\/?step=3/);

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'PERSONA EXPUESTA POLÍTICAMENTE'})).toBeVisible();

        // El PEPS agregado debe estar en estado activo
        await expect(page.getByRole('cell', {name: 'ACTIVO'})).toBeVisible();

        // Click al boton de Actualizar y continuar
        actualizarContinuar();
    });

    test('Editar Persona Juridica - Paso 4 - Relacionados del socio', async () => {
        // La URL debe cambiar al paso 4 del formulario
        await expect(page).toHaveURL(/\/?step=4/);

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();

        // En la tabla deben estar los dos relacionados agregados

        // Relacionado por Referencia
        await expect(page.getByRole('cell', {name: `${nombrePersonaRelacionadaReferencia} ${apellidoPersonaRelacionadaReferencia}`})).toBeVisible();

        // Relacionado Completo
        await expect(page.getByRole('cell', {name: `${nombrePersonaRelacionada} ${apellidoPersonaRelacionada}`})).toBeVisible();

        // Click al boton de Actualizar y continuar
        actualizarContinuar();
    });

    test('Finalizar con la Edicion de la Persona Juridica', async () => {
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

    test.afterAll(async () => { // Despues de las pruebas  
        // Guardar el nombre de la persona juridica creada
        await page.evaluate((nombreJuridica) => window.localStorage.setItem('nombrePersonaJuridica', nombreJuridica), nombreJuridica);

        // Guardar nuevamente el Storage con el nombre editado de la persona juridica
        await context.storageState({path: 'state.json'});

        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
