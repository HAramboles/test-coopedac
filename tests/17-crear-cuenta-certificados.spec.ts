import { Browser, BrowserContext, chromium, Page, expect, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Imagen de la firma
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

// Pruebas

test.describe('Pruebas con la Apertura de Cuenta de Certificados - Financieros Pagaderas', () => {
    test.beforeAll(async () => { // Antes de las pruebas
        // Crear el browser
        browser = await chromium.launch({
            headless: false,
        });

        // Crear el context
        context = await browser.newContext({
            storageState: 'state.json'
        });

        // Crear una nueva page
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

    test('Ir a la opcion de Certificados', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Apertura de cuentas
        await page.getByRole('menuitem', {name: 'APERTURA DE CUENTAS'}).click();

        // Certificados
        await page.getByRole('menuitem', {name: 'Certificados'}).first().click();
    });

    test('No debe permitir crear una nueva cuenta sin elegir un tipo de captacion', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados`);

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CERTIFICADOS'})).toBeVisible();

        // Boton de nueva cuenta
        const botonNuevaCuenta = page.locator('text=Nueva Cuenta');
        await expect(botonNuevaCuenta).toBeVisible();
        // Click al boton
        await botonNuevaCuenta.click();

        // No debe permitir crear una cuenta sin elegir el tipo de certificado y debe salir un mensaje
        await expect(page.locator('text=No ha seleccionado un tipo de captación.')).toBeVisible();
    });

    test('Elegir un tipo de certificado', async () => {
        // Boton de seleccionar captaciones
        const botonCaptaciones = page.locator('#form_CLASE_TIPO_SELECIONADO');
        await expect(botonCaptaciones).toBeVisible();
        // Click al boton
        await botonCaptaciones.click();

        // Seleccionar el tipo de captacion Ahorros Normales
        await page.locator('text=FINANCIEROS PAGADERAS').click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8`);
    });

    test('Crear una Nueva Cuenta de Certificado - Paso 1 - Datos Generales', async () => {
        // Boton de nueva cuenta
        const botonNuevaCuenta = page.getByRole('button', {name: 'plus Nueva Cuenta'});
        await expect(botonNuevaCuenta).toBeVisible();
        // Click al boton
        await botonNuevaCuenta.click();

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8/create?step=1`);

        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE CERTIFICADOS'})).toBeVisible();

        // La cuenta debe ser de financieros pagaderos
        await expect(page.locator('text=FINANCIEROS PAGADERAS').first()).toBeVisible();

        // Titular
        const campoTitular = page.locator('#select-search').first();
        // Cedula de la persona almacenada en el state
        const cedula = await page.evaluate(() => window.localStorage.getItem('cedula'));

        await campoTitular?.fill(`${cedula}`);
        // Seleccionar la opcion que aparece
        await page.locator(`text=${cedula}`).click(); 

        // Cambiar la descripcion de la cuenta
        const descripcionCuenta = page.getByPlaceholder('Descripción o alias de la cuenta, ejemplo: Cuenta para vacaciones.');
        // Viene con una descripcion por defecto, borrar dicha descripcion
        await descripcionCuenta.clear();
        // Nueva descripcion de la cuenta
        await descripcionCuenta.fill('Cuenta de certificado financiero pagadera');

        // La categoria del socio debe ser socio ahorrante
        await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();

        // Plazo
        await page.getByPlaceholder('PLAZO').fill('24');

        // El plazo debe ser mensual, que es el que viene por defecto
        await expect(page.locator('text=MENSUAL')).toBeVisible();

        // Ver los rangos del monto de apertura
        await page.locator('[aria-label="eye"]').click();
        // Debe salir un modal
        const modalRangos = page.getByRole('heading', {name: 'Detalles de Rango'}).first();
        await expect(modalRangos).toBeVisible();

        // Debe mostrar que el monto minimo es 1 peso dominicano
        await expect(page.getByRole('cell', {name: 'RD$ 1.00'}).nth(1)).toBeVisible();

        // Click en Aceptar
        await page.getByRole('button', {name: 'check Aceptar'}).nth(1).click();

        // El modal se debe cerrar
        await expect(modalRangos).not.toBeVisible();

        // No debe permitir un monto menor de 1
        const campoMonto = page.getByPlaceholder('MONTO');
        await campoMonto.fill('0');

        // Debe salir una advertencia
        await expect(page.locator("text='Monto' debe estar entre 1 y 99999999999")).toBeVisible();

        // Ingresar un monto valido
        await campoMonto.clear();
        await campoMonto.fill('50');

        // Desmarcar el via de cobro, debito a cuenta
        const casillaDebitoCuenta = page.getByLabel('Débito a cuenta(s)');
        await casillaDebitoCuenta.click();

        // Debe salir una advertencia
        await expect(page.locator('text=Via Cobro es requerido.')).toBeVisible();

        // Marcar la casilla de debito a cuenta
        await casillaDebitoCuenta.click();

        // Ingresar la tasa
        await page.locator('#FINANCIEROS\\ PAGADERAS_TASA').fill('5');

        // Click al boton de cargar autorizacion
        await page.locator('text=Cargar Autorización').click();

        // El titulo de cuentas a debitar debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CUENTAS Y MONTOS A DEBITAR'})).toBeVisible();

        // Buscar una cuenta de la persona
        const campoBuscarCuenta = page.locator('#select-search').last();
        await campoBuscarCuenta.click();
        // Elegir la cuenta de ahorros
        await page.locator('text=AHORROS NORMALES').click();

        // Boton Agregar la cuenta
        const botonAgregar = page.getByRole('button', {name: 'plus Agregar'});
        await expect(botonAgregar).toBeVisible();
        // Click al boton 
        await botonAgregar.click();

        // El monto por defecto es el monto de apertura, clickear en otro lugar para que se guarde el monto
        await page.locator('text=TOTALES').click();

        // Click al boton de Continuar
        Continuar();
    });

    test('Crear una Nueva Cuenta de Certificado - Paso 2 - Contacto de Firmante', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8/create?step=2`);

        // El titulo principal de la seccion debe estar visible
        await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();
        
        // La firma del titular debe estar visible
        await expect(page.locator('text=TITULAR')).toBeVisible();

        // Cerrar los mensajes que se muestran
        await page.locator('[aria-label="close"]').first().click();
        await page.locator('[aria-label="close"]').last().click();

        // Agregar firmante
        const botonAgregarFirmante = page.getByRole('button', {name: 'Agregar Firmante'});
        await expect(botonAgregarFirmante).toBeVisible();
        // Click al boton
        await botonAgregarFirmante.click();

        // Debe salir un modal
        await expect(page.locator('text=SELECCIONAR FIRMANTE')).toBeVisible();

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

        // Click en Aceptar
        await page.locator('text=Aceptar').click();

        // Debe estar visible la firma del firmante como firma condicional
        await expect(page.locator('text=(O) FIRMA CONDICIONAL')).toBeVisible();

        // Click en Continuar
        Continuar();
    });

    test('Crear una Nueva Cuenta de Certificado - Paso 3 - Metodo de Interes', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-4/certificados/8/create?step=3`);

        // El titulo principal debe estar visible
        await expect(page.locator('text=FORMA DE PAGO DE INTERESES O EXCEDENTES')).toBeVisible();
    });

    test('Finalizar con la Creacion de Cuenta de Certificado', async () => {
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
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});