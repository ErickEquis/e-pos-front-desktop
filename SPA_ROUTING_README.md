# Configuración de Rutas SPA (Single Page Application)

Este proyecto es una SPA (Single Page Application) que utiliza React Router para el manejo de rutas del lado del cliente. Para que funcione correctamente, es necesario configurar el servidor web para que redirija todas las rutas a `index.html`.

## Problema

Cuando accedes directamente a una ruta como `/login`, `/dashboard`, etc., el servidor web busca un archivo físico con ese nombre, pero como es una SPA, todas las rutas deben ser manejadas por React Router.

## Soluciones

### 1. Desarrollo Local

Para desarrollo local, ya está configurado en `vite.config.ts` con `historyApiFallback: true`.

### 2. Producción - Nginx

Si usas Nginx, copia el contenido de `nginx.conf` a tu configuración de servidor:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 3. Producción - Apache

Si usas Apache, el archivo `.htaccess` ya está configurado en `public/.htaccess`:

```apache
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### 4. Producción - Vercel

Si usas Vercel, el archivo `vercel.json` ya está configurado.

### 5. Producción - Netlify

Si usas Netlify, el archivo `_redirects` ya está configurado.

### 6. Producción - Otros servidores

Para otros servidores, asegúrate de que todas las rutas que no sean archivos estáticos redirijan a `index.html`.

## Verificación

Después de aplicar la configuración:

1. Accede a tu dominio raíz (`/`) - debe funcionar
2. Accede directamente a `/login` - debe funcionar
3. Accede directamente a `/dashboard` - debe funcionar
4. Accede a cualquier ruta que no exista - debe mostrar la página 404 de React Router

## Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev-start

# Construir para producción
npm run build
``` 