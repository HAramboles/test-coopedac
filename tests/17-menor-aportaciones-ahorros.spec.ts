import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Imagen de la firma
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Pruebas

test.describe('Pruebas con la Creacion de Cuenta de Aportaciones y de Ahorro de un Menor', async () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una page
        page = await context.newPage();

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
    });

    // Funcion con el boton de continuar, que se repite en cada seccion del registro
    const Continuar = async () => {
        // continuar
        const botonContinuar = page.locator('button:has-text("Continuar")');
        // presionar el boton
        await botonContinuar.click();
    };

      test('Ir a Apertura de cuenta de aportaciones', async () => {
        // Captaciones
        await page.locator('text=CAPTACIONES').click();

        // Apertura de cuentas
        await page.locator('text=APERTURA DE CUENTAS').click();

        // Captaciones
        await page.locator('text=Aportaciones').first().click();

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'APORTACIONES'})).toBeVisible();
        
        // Condicion por si el tipo de captacion llega sin datos o con datos
        const tipoCaptacion = page.getByTitle('APORTACIONES', {exact: true});

        if (await tipoCaptacion.isHidden()) {
            await page.reload();
        } else if (await tipoCaptacion.isVisible()) {
            // La URL debe de cambiar
            await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1`);
        }
    });

    test('Click al boton de Nueva Cuenta', async () => {
        // Boton de Nueva Cuenta
        const botonNuevaCuenta = page.locator('text=Nueva Cuenta');
        await expect(botonNuevaCuenta).toBeVisible();
        await botonNuevaCuenta.click();

        // La URL debe de cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-1/aportaciones/1/create?step=1`);
    });

    test('Registrar Cuenta de Aportaciones del Menor - Datos Generales', async () => {
        // Cedula, nombre y apellido del menor almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedulaMenor'));
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombreMenor'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoMenor'));

        // Nombre de la persona alamcenada en el state, osea su madre
        const cedulaMadre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));

        // El titulo de registrar cuenta deb estar visible
        await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES'})).toBeVisible();

        // Ingresar el titular
        const campoTitular = page.locator('#select-search');
        await campoTitular?.fill(`${cedula}`);
        // Click a la opcion que coincide con lo buscado
        await page.locator(`text=${cedula}`).click();

        // El nombre y el apellido de la persona deben aparecer como un titulo
        await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

        // Se debe mostrar una alerta diciendo que el socio elegido es un menor
        await expect(page.locator('text=El socio seleccionado es un menor de edad, por lo tanto es obligatorio agregar a un tutor a esta cuenta.')).toBeVisible();

        // El tipo de captacion debe ser Aportaciones
        await expect(page.locator('#APORTACIONES_ID_TIPO_CAPTACION').nth(1)).toBeVisible();

        // Seleccionar una categoria
        const campoCategoria = page.locator('#APORTACIONES_ID_CATEGORIA_SOCIO');
        await campoCategoria.click();
        // Elegir la categoria de socio ahorrante
        await page.locator('text=SOCIO AHORRANTE').click();

        // El tutor se debe elegir automaticamente
        await expect(page.locator(`text=${cedulaMadre} | MADRE`)).toBeVisible();

        // Boton de Continuar
        Continuar();
    });

    test('Registrar Cuenta de Aportaciones del Menor - Contacto de Firmante o Persona', async () => {
        // Cedula, nombre y apellido del tutor del menor, en este caso la madre
        const cedulaMadre = await page.evaluate(() => window.localStorage.getItem('cedulaPersona'));
        const nombreMadre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellidoMadre = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // El titulo de firmantes debe estar visible
        await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();

        // Cerrar uno de los mensajes que se muestran
        await page.locator('[aria-label="close"]').last().click();

        // Se debe mostrar la fima del titular por defecto
        await expect(page.locator('text=TITULAR')).toBeVisible();

        // El tipo de firma requerida debe estar visible
        await expect(page.locator('text=(Y) FIRMA REQUERIDA')).toBeVisible();

        /*
        // Click en Continuar sin colocar la firma de un tutor
        Continuar();

        // Debe salir un mensaje de que se debe agregar una firma
        await expect(page.locator('text=Debe agregar como firmante al representante legal del socio.')).toBeVisible();
        */

        // Colocar la firma del tutor del menor

        // Boton de Agregar Firmantes debe estar visible
        const botonAgregarFirmantes = page.locator('text=Agregar Firmante');
        await expect(botonAgregarFirmantes).toBeVisible();
        // Click al boton
        await botonAgregarFirmantes.click();

        // Agregar un firmante, debe salir un modal
        await expect(page.locator('h1').filter({hasText: 'SELECCIONAR FIRMANTE'})).toBeVisible();

        // La madre se debe mostrar sin tener que buscarla
        await expect(page.locator(`text=${nombreMadre} ${apellidoMadre}`)).toBeVisible();
        await expect(page.locator(`text=${cedulaMadre}`)).toBeVisible();

        // Seleccionar el tutor
        await page.locator('text=Seleccionar').click();

        // Debe salir otro modal para llenar la informacion de la firmante
        await expect(page.locator('text=FIRMANTE:')).toBeVisible();

        // Tipo firmante
        await page.locator('#form_TIPO_FIRMANTE').click();
        // Seleccionar un tipo de firmante
        await page.locator('text=TUTOR').click();

        // Tipo firma
        await page.locator('#form_CONDICION').click();
        // Seleccionar un tipo de firma
        await page.locator('text=(O) FIRMA CONDICIONAL').click();

        // Subir la imagen de la firma
        const subirFirmaPromesa = page.waitForEvent('filechooser'); // Esperar por el evento de filechooser
        await page.getByText('Cargar ').click(); 
        const subirFirma = await subirFirmaPromesa; // Guardar el evento del filechooser en una constante
        await subirFirma.setFiles(`${firma}`); // setFiles para elegir un archivo

        // Esperar que la firma se suba y se muestre
        await expect(page.locator('(//div[@class="ant-upload-list ant-upload-list-picture-card"])')).toBeVisible();

        // Click en Aceptar
        await page.getByRole('button', {name: 'Aceptar'}).click();

        // Debe aparecer un modal para seleccionar el testigo de la eliminacion del firmante
        await expect(page.getByText('Seleccionar Testigo', {exact: true})).toBeVisible();

        // Seleccionar un testigo
        await page.locator('#form_ID_TESTIGO').click();
        // Seleccionar un testigo, la primera opcion que aparezca
        await page.getByRole('option').nth(0).click();

        // Boton de Aceptar
        const botonAceptar = page.locator('text=Aceptar');
        // Esperar que se abra una nueva pestaña con el reporte de poder a terceros
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]);
      
        // La pagina abierta con el reporte se cierra
        await newPage.close();

        // El firmante agregado se debe mostrar
        await expect(page.getByRole('row', {name: `${nombreMadre} ${apellidoMadre}`})).toBeVisible();

        // Boton de Continuar
        Continuar();
    });

    test('Registrar Cuenta de Aportaciones del Menor - Método de intereses', async () => {
        // El titulo de  debe estar visible
        await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();
    });

    test('Finalizar con el Registro de la Cuenta de Aportaciones', async () => {
        // Boton de finalizar
        const botonFinalizar = page.locator('text=Finalizar');
        await expect(botonFinalizar).toBeVisible();
        await botonFinalizar.click();
    
        // Debe de aparecer un modal
        await expect(page.locator('text=¿Desea crear una cuenta de ahorro para este socio?')).toBeVisible();
        // Click en Aceptar para crearle una cuenat de Ahorros al socio
        await page.getByRole('dialog').getByRole('button', {name: 'Aceptar'}).click();
    });

    test('Crear la Cuenta de Ahorros del Menor - Datos Generales', async () => {
        // Nombre y apellido de la persona almacenada en el state
        const nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        const apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

        // Debe redirigirse a la creacion de la cuenta de ahorros
        await expect(page).toHaveURL(/\/ahorros/);

        // Titulo de editar cuenta, ya que se crea automaticamente
        await expect(page.locator('h1').filter({hasText: 'EDITAR CUENTA DE AHORROS'})).toBeVisible();

        // La cuenta debe ser la del socio
        await expect(page.locator('h1').filter({hasText: `${nombre} ${apellido}`})).toBeVisible();

        // Editar la descripcion de la cuenta
        const campoDescripcion = page.getByPlaceholder('Descripción o alias de la cuenta, ejemplo: Cuenta para vacaciones.');
        await expect(campoDescripcion).toBeVisible();
        await campoDescripcion.clear();
        await campoDescripcion.fill('CUENTA AHORRATIVA');

        // El tipo de captacion debe ser Ahorros Normales y no debe cambiar
        await expect(page.locator('text=AHORROS NORMALES')).toBeVisible();

        // La categoria debe ser Socio Ahorrante
        await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();

        // Editar el monto de confirmacion
        const montoConfirmacion = page.getByPlaceholder('MONTO DE CONFIRMACIÓN');
        await expect(montoConfirmacion).toBeVisible();
        await montoConfirmacion.clear();
        await montoConfirmacion.fill('25,000');

        // Subir la imagen de la firma
        const subirFirmaPromesa = page.waitForEvent('filechooser'); // Esperar por el evento de filechooser
        await page.getByText('Cargar ').click(); 
        const subirFirma = await subirFirmaPromesa; // Guardar el evento del filechooser en una constante
        await subirFirma.setFiles(`${firma}`); // setFiles para elegir un archivo

        // Boton de Actualizar
        const botonActualizar = page.locator('text=Actualizar');
        await expect(botonActualizar).toBeVisible();
        await botonActualizar.click();
    });

    test('Crear la Cuenta de Ahorros del Menor - Contacto de Firmante', async () => {
        // Cedula, nombre y apellido de la persona relacionada almacenada en el state
        const cedulaFirmante = await page.evaluate(() => window.localStorage.getItem('cedula'));
        const nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        const apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'FIRMANTE'})).toBeVisible();

        // Boton de Agregar Firmantes debe estar visible
        const botonAgregarFirmantes = page.locator('text=Agregar Firmante');
        await expect(botonAgregarFirmantes).toBeVisible();
        // Click al boton
        await botonAgregarFirmantes.click();

        // Agregar un firmante, debe salir un modal
        await expect(page.locator('h1').filter({hasText: 'SELECCIONAR FIRMANTE'})).toBeVisible();

        // Bucar un socio
        const buscador = page.locator('#select-search');
        await buscador.click();
        await buscador.fill(`${cedulaFirmante}`);
        // Seleccionar el socio
        await page.locator(`text=${nombreFirmante} ${apellidoFirmante}`).click();

        // Debe salir otro modal para llenar la informacion de la firmante
        await expect(page.locator('text=FIRMANTE:')).toBeVisible();

        // Tipo firmante
        await page.locator('#form_TIPO_FIRMANTE').click();
        // Seleccionar un tipo de firmante
        await page.locator('text=CO-PROPIETARIO').click();

        // Tipo firma
        await page.locator('#form_CONDICION').click();
        // Seleccionar un tipo de firma
        await page.locator('text=(O) FIRMA CONDICIONAL').click();

        // Subir la imagen de la firma
        const subirFirmaPromesa = page.waitForEvent('filechooser'); // Esperar por el evento de filechooser
        await page.getByText('Cargar ').click(); 
        const subirFirma = await subirFirmaPromesa; // Guardar el evento del filechooser en una constante
        await subirFirma.setFiles(`${firma}`); // setFiles para elegir un archivo

        // Boton de Aceptar
        const botonAceptar = page.locator('text=Aceptar');
        // Esperar que se abra una nueva pestaña con el reporte de poder a terceros
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Aceptar
            await expect(botonAceptar).toBeVisible(),
            await botonAceptar.click()
        ]);
      
        // La pagina abierta con el reporte se cierra
        await newPage.close();

        // El firmante agregado se debe mostrar
        await expect(page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();

        // Boton Continuar
        const botonContinuar = page.getByRole('button', {name: 'Continuar'});
        await expect(botonContinuar).toBeVisible();
        // Click al boton
        await botonContinuar.click();
    });
    
    test('Crear la Cuenta de Ahorros - Método de intereses', async () => {
        // El titulo de  debe estar visible
        await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();
    });

    test('Finalizar con el registro de cuenta de ahorro', async () => {
        // Boton de Finalizar
        const botonFinalizar = page.locator('text=Finalizar');
        // Esperar que se abra una nueva pestaña
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            // Click al boton de Finalizar
            await expect(botonFinalizar).toBeVisible(),
            await botonFinalizar.click()
        ]);
      
        // La pagina abierta con la solicitud se cierra
        await newPage.close();
        
        // Debe de regresar a la pagina las cuentas de ahorros
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);

        // El titulo de Ahorros debe estar visible
        await expect(page.locator('h1').filter({hasText: 'AHORROS'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar el context
        await context.close();

        // Cerrar la page
        await page.close();
    });
})
