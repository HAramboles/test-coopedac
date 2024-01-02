# Playwright Tests para Coopedac app  
  
## Instalación  
npm install  
npm init @playwright/test@latest

Tests **OBLIGATORIOS** de ejecutar   
001-login.test.ts   
003-activar-caja.test.ts  
005-registro-tasa.test.ts   

## Variables de entorno  
Crear un archivo .env.development en la raíz del proyecto con las siguientes variables:  

**Para conectarse al servidor**  
REACT_APP_WEB_SERVICE_API
REACT_APP_BIRT_WEB_API
REACT_APP_JASPER_WEB_API  

**Usuario y contraseña**  
REACT_APP_WEB_SERVICE_API_USER
REACT_APP_WEB_SERVICE_API_PASS  

**Nombre del usuario / caja**  
REACT_APP_WEB_SERVICE_API_NAME_USER  

**Usuario y contraseña para el cuadre de caja**  
REACT_APP_WEB_SERVICE_API_USER_CUADRE_CAJA
REACT_APP_WEB_SERVICE_API_PASS_CUADRE_CAJA

