import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

/* URL de la pagina */
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Imagen de la firma
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

test.describe('Pruebas la Apertura de cuentas de Ahorros', () => {
    test.beforeAll(async () => { // Antes de todas las pruebas
        /* Crear el browser, con la propiedad headless */
        browser = await chromium.launch({
            headless: true
        });

        /* Crear un context con el storageState donde esta guardado el token de la sesion */
        context = await browser.newContext({
            storageState: 'state.json'
        });

        /* Crear una nueva page usando el context */
        page = await context.newPage();

        /* Ingresar a la pagina */
        await page.goto(`${url_base}`);
    });

    // Funcion con el boton de continuar, que se repite en cada seccion del registro
    const Continuar = async () => {
        // continuar
        const botonContinuar = page.locator('button:has-text("Continuar")');
        // presionar el boton
        await botonContinuar.click();
    };

    test('Ir a la opcion de Apertura de cuentas -> Ahorros', async () => {
        // Boton de Captaciones
        await page.locator('text=CAPTACIONES').click();

        // Boton de Apertura de cuentas
        await page.locator('text=APERTURA DE CUENTAS').click();

        // Boton de Ahorros
        await page.getByRole('menuitem', {name: 'Ahorros'}).click();

        // La url debe de cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros`);

        // El titulo de ahorros debe estar visible
        await expect(page.locator('h1').filter({hasText: 'AHORROS'})).toBeVisible();
    });

    test ('Debe aparecer un mensaje de error si se le da click a Nueva Cuenta sin elegir una tipo de captacion', async () => {
        // Boton de Nueva Cuenta
        const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
        await expect(botonNuevaCuenta).toBeVisible();
        await botonNuevaCuenta.click();

        // Mensaje de error
        await expect(page.locator('text=No ha seleccionado un tipo de captación.')).toBeVisible();

        // Cerrar el mensaje
        await page.locator('[data-icon="close"]').click();
    });

    test('Seleccionar un tipo de captaciones', async () => {
        // El titulo de tipo de captaciones debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TIPO DE CAPTACIONES'})).toBeVisible();

        // Boton de seleccionar captaciones
        const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
        await expect(botonCaptaciones).toBeVisible();
        // Click al boton
        await botonCaptaciones.click();

        // Seleccionar el tipo de captacion Ahorros Normales
        await page.locator('text=AHORROS NORMALES').click();

        // La URL debe de cambiar al elegir el tipo de captacion
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16`);
    });
    
    test('Click al boton de Nueva Cuenta', async () => {
        // Boton de Nueva Cuenta
        const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
        await expect(botonNuevaCuenta).toBeVisible();
        await botonNuevaCuenta.click();

        // La URL debe de cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16/create?step=1`);

        // El titulo de Registrar Cuenta debe estar visible
        await expect(page.locator('text=CREAR CUENTA DE AHORROS')).toBeVisible();
    });

    test('Llenar los campos del primer paso del registro de cuenta de ahorros', async () => {
        // Titular
        const campoTitular = page.locator('#select-search');
        // Cedula de la persona almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));

        await campoTitular?.fill(`${cedula}`);
        // Seleccionar la opcion que aparece
        await page.locator(`text=${cedula}`).click();

        // El tipo de captacion debe ser Ahorros
        await expect(page.locator('text=AHORROS NORMALES')).toBeVisible();

        // Subir la imagen de la firma
        const subirFirmaPromesa = page.waitForEvent('filechooser'); // Esperar por el evento de filechooser
        await page.getByText('Cargar ').click(); 
        const subirFirma = await subirFirmaPromesa; // Guardar el evento del filechooser en una constante
        await subirFirma.setFiles(`${firma}`); // setFiles para elegir un archivo

        // Click al boton de continuar
        Continuar();
    });

    test('Contacto de Firmante o Persona', async () => { 
        // La URL debe de cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16/create?step=2`);

        // El titulo de firmantes debe estar visible
        await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();

        // Cambiar a la pestaña de Personas o Contactos
        const seccionPersonaContactos = page.locator('text=Personas o Contactos');
        await seccionPersonaContactos.click();

        // Titulo de la seccion debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CONTACTOS CON LA PERSONAS O EMPRESA'})).toBeVisible();

        // Regresar a la seccion de firmantes
        await page.getByRole('tab').filter({hasText: 'Firmantes'}).click();

        // Boton de Agregar Firmantes debe estar visible
        const botonAgregarFirmantes = page.locator('text=Agregar Firmante');
        await expect(botonAgregarFirmantes).toBeVisible();
        // Click al boton
        await botonAgregarFirmantes.click();

        // Agregar un firmante, debe salir un modal
        await expect(page.locator('h1').filter({hasText: 'SELECCIONAR FIRMANTE'})).toBeVisible();

        // Cedula, nombre y apellido de la persona relacionada almacenada en el state
        const cedulaFirmante = await page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
        const nombreFirmante = await page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        const apellidoFirmante = await page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

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

        // Click al boton de Continuar
        Continuar();
    });

    test('Metodo de intereses', async () => {
        // La URL debe de cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-2/ahorros/16/create?step=3`);
        
        // Si aparece un modal con un mensaje, click en aceptar y continuar con el siguiente paso
        const modal = page.locator('text=No se encontró el contrato para el tipo de cuenta seleccionado');
        if (await modal.isVisible()){ 
            // Click en aceptar
            const botonAceptar = page.locator('text=Aceptar');
            await expect(botonAceptar).toBeVisible();
            await botonAceptar.click();
        } else if (await modal.isHidden()) {
            await expect(page.locator('h1').filter({hasText: 'FORMA PAGO DE INTERESES O EXCEDENTES'})).toBeVisible();
        };
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

    test.afterAll(async () => { // Despues de todas las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
