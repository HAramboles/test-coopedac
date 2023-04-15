import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { numerosCedulas4, numerosTelefono } from './utils/cedulasypasaporte';

// Vaiables globales 
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Cedula, nombre, apellido y numero telefonico del menor
const cedulaMenor = numerosCedulas4;
const telefonoMenor = numerosTelefono;
const nombreMenor = '';
const apellidoMenor = '';

// Pruebas

test.describe('Pruebas con el Registro de Persona Fisica - Menor de Edad', () => {
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

    test('Crear Persona Fisica - Menor de Edad', async () => {
        // El titulo de registrar persona debe estar visible
        await expect(page.locator('h1').filter({hasText: 'REGISTRAR PERSONA'})).toBeVisible();

        // Boton de Nueva persona
        const botonNuevaPersona = page.locator('text=Nueva persona');
        await expect(botonNuevaPersona).toBeVisible();
        await botonNuevaPersona.click();

        // Debe salir un modal con los dos tipos de personas que se pueden crear
        await expect(page.locator('text=Seleccione el tipo de persona a crear')).toBeVisible();

        // Click al boton de perosna fisica
        const botonPersonaJuridica = page.getByRole('button', {name: 'Persona Física'});
        await expect(botonPersonaJuridica).toBeVisible();
        await botonPersonaJuridica.click();

        // La URL debe cambiar a la del registro
        await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=1`);
    });

    test('Registro de Persona Fisica - Menor de Edad - Datos Generales', async () => {
        // El titulo de datos generales debe estra visible
        await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

        // Colocar una fecha de nacimiento, para que aparezca un modal indicando que la persona es un menor de edad
        const campoFecha = page.locator('#person_FECHA_NAC');
        await campoFecha?.fill('17/01/2011');
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
        await campoCedula?.fill(cedulaMenor);

        // Nombres
        const campoNombre = page.locator('#person_NOMBRES');
        await campoNombre?.fill(`${nombreMenor}`);

        // Apellidos
        const campoApellido = page.locator('#person_APELLIDOS');
        await campoApellido?.fill(`${apellidoMenor}`);

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

        // Marcar la casilla de No Referido
        await page.locator('#person_NO_REFERIDO').click();

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
        await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=2`);

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
        await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=3`);

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
        await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=4`);

        // El titulo de persona expuesta politicamente debe estar visible
        await expect(page.locator('h1').filter({hasText: 'PERSONA EXPUESTA POLÍTICAMENTE'})).toBeVisible(); 
        
        // No se puede agregar Peps a un menor de edad

        // Hacer click en el boton de guardar y continuar
        guardarContinuar();
    });

    test('Registro de Persona Fisica - Menor de Edad - Direcciones', async () => {
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

        // Click en continuar
        await page.locator('text=Continuar').click();

        // Debe salir un modal con una advertencia de que no se ha colocado un email
        // No se le colocara un email al menor
        await expect(page.locator('text=No registró una dirección de Email o Red social.')).toBeVisible();
        // Click en Aceptar
        await page.getByRole('button', {name: 'arrow-right Continuar'}).click();
    });

    test('Registro de Persona Fisica - Menor de Edad - Relacionados', async () => {
        // Cedula, nombre y apellido de la persona almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // La url debe cambiar
        await expect(page).toHaveURL(`${url_base}/registrar_cliente/01-1-1-1/persona_fisica/create?step=6`);

        // El titulo de relacionados del socio debe estar visible 
        await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();

        // Buscar un relacionado del menor, debe ser un padre, madre o un tutor
        // Usar la cedula de la persona fisica creada

        const campoBuscarRelacionado = page.getByRole('combobox');
        await campoBuscarRelacionado.click();
        await campoBuscarRelacionado?.fill(`${cedula}`);
        // Click a la opcion que coincide con lo buscado
        await page.locator(`text=${nombre} ${apellido}`).click();

        // Debe de aparecer un modal
        await expect(page.locator('text=SELECCIONAR TIPO DE RELACIÓN')).toBeVisible();

        // Seleccionar tipo de relacion
        await page.locator('#rc_select_29').click();
        await page.locator('text=MADRE').click();
        await page.locator('text="Aceptar"').click();
    });

    test('Finalizar con el Registro del Menor de Edad', async () => {
        // Hacer click al boton de finalizar
        const botonFinalizar = page.locator('text=Finalizar');
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Guardar la cedula del menor
        await page.evaluate((cedulaMenor) => window.localStorage.setItem('cedulaMenor', cedulaMenor), cedulaMenor);

        // Guardar el nombre y el apellido del menor
        await page.evaluate((nombreMenor) => window.localStorage.setItem('nombreMenor', nombreMenor), nombreMenor);
        await page.evaluate((apellidoMenor) => window.localStorage.setItem('apellidoMenor', apellidoMenor), apellidoMenor);

        // Guardar nuevamente el Storage con la cedula, el nombre y el apellido del menor
        await context.storageState({path: 'state.json'});

        // Cerrar la pagina
        await page.close();

        // Cerrar el context
        await context.close();
    });
});