import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { numerosCelular } from './utils/cedulasypasaporte';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page;

// URL de la pagina
const url_base = process.env.REACT_APP_WEB_SERVICE_API;

// Celular del Menor
const CelularMenor = numerosCelular;

// Pruebas

test.describe('Editar la Cuenta de un Menor - Agregar otro numero telefonico', () => {
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

        // Ingresar a la pagina
        await page.goto(`${url_base}`);
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

    test('Buscar la cuenta del menor', async () => {
        // Cedula, nombre y apellido del menor
        const cedulaMenor = await page.evaluate(() => window.localStorage.getItem('cedulaMenor'));
        const nombreMenor = await page.evaluate(() => window.localStorage.getItem('nombreMenor'));
        const apellidoMenor = await page.evaluate(() => window.localStorage.getItem('apellidoMenor'));

        // Buscar al menor
        await page.locator('#form_search').fill(`${cedulaMenor}`);
        
        // Click al boton de editar cuenta
        const botonEditarCuenta = page.getByRole('row', {name: `${nombreMenor} ${apellidoMenor}`}).getByRole('button', {name: 'edit'});
        await expect(botonEditarCuenta).toBeVisible();
        await botonEditarCuenta.click();

        // La URL debe cambiar
        await expect(page).toHaveURL(/\/edit/);
    });

    test('Ir a la opcion de Direcciones, telefonos y redes sociales', async () => {
        // El titulo de la primera seccion se debe cambiar
        await expect(page.locator('h1').filter({hasText: 'DATOS GENERALES'})).toBeVisible();

        // Seccion de direcciones y contactos
        const direccionesConstantes = page.locator('text=Direcciones y Contactos');
        await expect(direccionesConstantes).toBeVisible();
        await direccionesConstantes.click();
    });

    test('Agregar otro numero telefonico para el menor', async () => {
        // El titulo de telefonos debe estar visible
        await expect(page.locator('h1').filter({hasText: 'TELÉFONOS'})).toBeVisible();

        // Boton de agregar telefono
        const botonAgregarTelefono = page.locator('text=Agregar teléfono');
        await expect(botonAgregarTelefono).toBeVisible();
        await botonAgregarTelefono.click();

        // Seleccionar el tipo de telefono
        await page.locator('#form_VALOR').click();
        await page.getByText('CELULAR').first().click(); 

        // Input del numero
        const campoNumero = page.locator('#form_NUMERO');
        await campoNumero.click();
        await campoNumero?.fill(`${CelularMenor}`);

        // Hacer click al icono de guardar telefono
        await page.locator('button', {has: page.locator('span > svg[data-icon=save]')}).click();

        // Debe mostrarse un mensaje de que se agrego correctamente el numero
        await expect(page.locator('text=Contacto Persona almacenado exitosamente.')).toBeVisible();

        // Click en Actualizar y continuar
        actualizarContinuar();
    });

    test('Finalizar con la Edicion de la Cuenta del menor', async () => {
        // Titulo de la ultima seccion
        await expect(page.locator('h1').filter({hasText: 'RELACIONADOS DEL SOCIO'})).toBeVisible();

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
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
})