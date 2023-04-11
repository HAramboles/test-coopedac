import { Browser, BrowserContext, chromium, Page, expect, test } from '@playwright/test';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Imagen de la firma
const firma = './tests/firma.jpg'; // Con este path la imagen de la firma debe estar en la carpeta tests

interface AportacionePreferentesParametros {
    REQUIERE_FIRMA_TITULAR: 'N' | 'S' | ''
    PERMITE_DEPOSITO_INICIAL: 'S' | 'N' | ''
    TIPOS_CUENTAS_DEBITAR: '16,17,18,19' | '1' | ''

}

const EscenariosPruebas: AportacionePreferentesParametros[] = [
    {
        REQUIERE_FIRMA_TITULAR: 'S',
        PERMITE_DEPOSITO_INICIAL: 'S',
        TIPOS_CUENTAS_DEBITAR: '16,17,18,19'
    },
    {
        REQUIERE_FIRMA_TITULAR: 'S',
        PERMITE_DEPOSITO_INICIAL: 'N',
        TIPOS_CUENTAS_DEBITAR: '16,17,18,19'
    },
    {
        REQUIERE_FIRMA_TITULAR: 'S',
        PERMITE_DEPOSITO_INICIAL: '',
        TIPOS_CUENTAS_DEBITAR: '16,17,18,19'
    },
    {
        REQUIERE_FIRMA_TITULAR: 'S',
        PERMITE_DEPOSITO_INICIAL: 'S',
        TIPOS_CUENTAS_DEBITAR: '1'
    },
    {
        REQUIERE_FIRMA_TITULAR: 'S',
        PERMITE_DEPOSITO_INICIAL: 'N',
        TIPOS_CUENTAS_DEBITAR: '1'
    },
    {
        REQUIERE_FIRMA_TITULAR: 'S',
        PERMITE_DEPOSITO_INICIAL: '',
        TIPOS_CUENTAS_DEBITAR: '1'
    },
    {
        REQUIERE_FIRMA_TITULAR: 'S',
        PERMITE_DEPOSITO_INICIAL: 'S',
        TIPOS_CUENTAS_DEBITAR: ''
    },
    {
        REQUIERE_FIRMA_TITULAR: 'S',
        PERMITE_DEPOSITO_INICIAL: 'N',
        TIPOS_CUENTAS_DEBITAR: ''
    },
    {
        REQUIERE_FIRMA_TITULAR: 'S',
        PERMITE_DEPOSITO_INICIAL: '',
        TIPOS_CUENTAS_DEBITAR: ''
    },
]

// Pruebas

test.describe('Pruebas con la Apertura de Cuentas de Aportaciones Preferentes', () => {
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

    test('Ir a la opcion de Aportaciones Preferentes', async () => {
        // Captaciones
        await page.locator('text=CAPTACIONES').click();

        // Apertura de cuentas
        await page.locator('text=APERTURA DE CUENTAS').click();

        // Captaciones
        await page.getByRole('menuitem', {name: 'Aportaciones Preferentes', exact: true}).click();
    });

    test('Click al boton de Nueva Cuenta', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20`);

        // El titulo debe estar presente
        await expect(page.locator('h1').filter({hasText: 'APORTACIONES PREFERENTES'})).toBeVisible();

        // Nueva Cuenta
        const botonNuevaCuenta = page.getByRole('button', {name: 'Nueva Cuenta'});
        await expect(botonNuevaCuenta).toBeVisible();
        await botonNuevaCuenta.click();
    });

    test('Crear cuenta de Aportaciones Preferentes - Paso 1 - Datos Generales', async () => {
        // Cedula de la persona almacenada en el state
        const cedula = page.evaluate(() => window.localStorage.getItem('cedula'));

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20/create?step=1`);

        // El titulo principal debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CREAR CUENTA DE APORTACIONES PREFERENTES'})).toBeVisible();

        // El titulo de la seccion debe estar visible
        await expect(page.locator('text=Datos Generales')).toBeVisible();

        // Buscar un socio
        await page.locator('#select-search').first().fill(`${cedula}`);
        // Click al socio
        await page.locator(`text=${cedula}`).click();

        // Cambiar al descripcion de la cuenta
        const descripcion = page.locator('#APORTACIONES\\ PREFERENTES_DESCRIPCION');
        await descripcion.fill('Cuenta de Aportaciones Preferentes');

        // La categoria debe ser de socio ahorrante
        await expect(page.locator('text=SOCIO AHORRANTE')).toBeVisible();

        // Ingresar un monto inicial
        await page.locator('#APORTACIONES\\ PREFERENTES_MONTO_APERTURA').fill('1500');

        // El monto disponible en aportaciones debe estar visible
        await expect(page.getByText('Monto disponible en aportacines es: 3,000.00')).toBeVisible();

        // Monto maximo de apertura
        const montoMaximo = page.getByText('Monto máximo de apertura: 9,000.00');
        // Debe estar visible
        await expect(montoMaximo).toBeVisible();

        // Subir la imagen de la firma
        const subirFirmaPromesa = page.waitForEvent('filechooser'); // Esperar por el evento de filechooser
        await page.getByText('Cargar ').click(); 
        const subirFirma = await subirFirmaPromesa; // Guardar el evento del filechooser en una constante
        await subirFirma.setFiles(`${firma}`); // setFiles para elegir un archivo

        // El titulo de cuentas a debitar debe estar visible
        await expect(page.locator('h1').filter({hasText: 'CUENTAS Y MONTOS A DEBITAR'})).toBeVisible();

        // Buscar una cuenta de la persona
        const campoBuscarCuenta = page.locator('#select-search').last();
        await campoBuscarCuenta.click();
        // Elegir la cuenta de ahorros
        await page.locator('text=AHORROS NORMALES').click();

        // El monto maximo de apertura no debe cambiar
        await expect(montoMaximo).toBeVisible();

        // Boton Agregar la cuenta
        const botonAgregar = page.getByRole('button', {name: 'plus Agregar'});
        await expect(botonAgregar).toBeVisible();
        // Click al boton 
        await botonAgregar.click();

        // El monto por defecto es el monto de apertura, clickear en otro lugar para que se guarde el monto
        await page.locator('text=TOTALES').click();

        // Click en continuar
        Continuar();
    });

    test('Crear cuenta de Aportaciones Preferentes - Paso 2 - Contacto de Firmante', async () => {
        // Cedula, nombre y apellido de la persona relacionada almacenada en el state
        const cedulaFirmante = page.evaluate(() => window.localStorage.getItem('cedulaPersonaJuridicaRelacionado'));
        const nombreFirmante = page.evaluate(() => window.localStorage.getItem('nombrePersonaJuridicaRelacionada'));
        const apellidoFirmante = page.evaluate(() => window.localStorage.getItem('apellidoPersonaJuridicaRelacionada'));

        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20/create?step=2`);

        // El titulo debe estar presente
        await expect(page.locator('h1').filter({hasText: 'FIRMANTES'})).toBeVisible();

        // Cerrar los mensajes que se muestran
        await page.locator('[aria-label="close"]').first().click();
        await page.locator('[aria-label="close"]').last().click();

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
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Debe esatr visible el firmante agregado
        await expect(page.getByRole('row', {name: `${nombreFirmante} ${apellidoFirmante}`})).toBeVisible();

        // Click en continuar
        Continuar();
    });

    test('Crear cuenta de Aportaciones Preferentes - Paso 3 - Metodo de Interes', async () => {
        // La URL debe cambiar
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20/create?step=2`);

        // El titulo debe estar visible
        await expect(page.locator('text=FORMA PAGO DE INTERESES O EXCEDENTES')).toBeVisible();
    });

    test('Finalizar con el registro de cuenta de aportaciones preferentes', async () => {
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
        await expect(page).toHaveURL(`${url_base}/crear_cuentas/01-2-5-5/aportaciones_preferentes/20`);

        // El titulo de Ahorros debe estar visible
        await expect(page.locator('h1').filter({hasText: 'APORTACIONES PREFERENTES'})).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerra la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});