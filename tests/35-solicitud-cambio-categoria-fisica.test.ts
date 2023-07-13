import { Browser, BrowserContext, chromium, expect, Page, test } from '@playwright/test';
import { url_base, selectBuscar } from './utils/dataTests';

// Variables globales
let browser: Browser;
let context: BrowserContext;
let page: Page

// Nombre de la presona juridica
let nombre: string | null;
let apellido: string | null;

// Pruebas

test.describe.serial('Pruebas con la Solicitud de Cambio de Categoria de la Persona Fisica', async () => {
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

        // Nombre de la empresa
        nombre = await page.evaluate(() => window.localStorage.getItem('nombrePersona'));
        apellido = await page.evaluate(() => window.localStorage.getItem('apellidoPersona'));
    });

    test('Ir a la seccion de Solicitar Cambio Categoria', async () => {
        // Captaciones
        await page.getByRole('menuitem', {name: 'CAPTACIONES'}).click();

        // Operaciones
        await page.getByRole('menuitem', {name: 'OPERACIONES'}).click();

        // Solicitar cambio categoria
        await page.getByRole('menuitem', {name: 'Solicitar cambio categoría'}).click();

        // La URL debe cambiar 
        await expect(page).toHaveURL(`${url_base}/solicitar_cambio_categoria/01-2-2-100/`);
    });

    test('Solicitar Cambio de Categoria', async () => {
        // El titulo debe estar visible
        await expect(page.locator('h1').filter({hasText: 'SOLICITAR CAMBIO DE CATEGORÍA'})).toBeVisible();

        // Boton Agregar
        const botonAgregar = page.getByRole('button', {name: 'Agregar'});
        await expect(botonAgregar).toBeVisible();
        await botonAgregar.click();

        // Debe salir un modal
        await expect(page.locator('h1').filter({hasText: 'AGREGAR SOLICITUD PARA CAMBIO DE CATEGORÍA'})).toBeVisible();

        // Buscar un socio
        await page.locator(`${selectBuscar}`).fill(`${nombre} ${apellido}`);
        // Elegir al socio
        await page.getByText(`${nombre} ${apellido}`).click();

        // La categoria actual debe ser Microempresarial
        await expect(page.locator('#form_DESC_CATEGORIA')).toHaveValue('SOCIO AHORRANTE');

        // Via Cobro
        await page.locator('#form_VIA_COBRO').click();
        // Elegir Debito a cuenta
        await page.getByText('DEBITO A CUENTA', {exact: true}).click();

        // En la cuenta de cobro se coloca automaticamente la cuenta de ahorros del socio
        await expect(page.getByText('AHORROS NORMALES')).toBeVisible();

        // Elegir la Categoria Solicitada
        await page.locator('#form_ID_CATEGORIA_SOCIO').click();
        // Elegir Socio Micro Empresarial
        await page.getByTitle('SOCIO MICROEMPRESARIAL').click();

        // Monto Admision
        const montoAdmision = page.locator('#form_MONTO_ADMISION');
        await expect(montoAdmision).toBeDisabled();
        await expect(montoAdmision).toHaveValue('RD$ 4,500');

        // Comentario
        await page.locator('#form_COMENTARIO').fill('CAMBIO DE SOCIO AHORRANTE A SOCIO MICROEMPRESARIAL');

        // Click en Aceptar
        const botonAceptar = page.getByRole('button', {name: 'Aceptar'});
        await expect(botonAceptar).toBeVisible();
        await botonAceptar.click();

        // Debe salir un mensaje de confirmacion
        await expect(page.getByText('Categoria cta. socio almacenado exitosamente.')).toBeVisible();
    });

    test.afterAll(async () => { // Despues de las pruebas
        // Cerrar la page
        await page.close();

        // Cerrar el context
        await context.close();
    });
});
