# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Configure environment variables (ver sección de configuración más abajo)
# Crea un archivo .env en la raíz del proyecto con VITE_OPEN_AI_KEY=tu-clave-api-aqui

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- OpenAI API (para generación de planes personalizados)
- Supabase (base de datos y autenticación)
- Stripe (pagos y membresías)

## Configuración de Variables de Entorno

Para que la aplicación funcione correctamente, necesitas configurar las siguientes variables de entorno:

### 1. Configurar la API Key de OpenAI

La aplicación utiliza OpenAI para generar planes de entrenamiento y nutrición personalizados. Sigue estos pasos:

1. **Obtén tu API Key de OpenAI**:
   - Ve a [OpenAI Platform](https://platform.openai.com/)
   - Inicia sesión o crea una cuenta
   - Navega a [API Keys](https://platform.openai.com/api-keys)
   - Haz clic en "Create new secret key"
   - Copia la clave generada (solo se mostrará una vez)

2. **Crea el archivo `.env` en la raíz del proyecto**:
   ```bash
   # En la raíz del proyecto
   touch .env
   ```

3. **Agrega la variable de entorno**:
   ```env
   VITE_OPEN_AI_KEY=sk-tu-clave-api-aqui
   ```

   **Importante**: 
   - Reemplaza `sk-tu-clave-api-aqui` con tu clave real de OpenAI
   - No compartas nunca tu clave API públicamente
   - No hagas commit del archivo `.env` al repositorio (debe estar en `.gitignore`)

4. **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

### 2. Otras Variables de Entorno Necesarias

El proyecto también puede requerir estas variables (según tu configuración):

```env
# OpenAI (requerido)
VITE_OPEN_AI_KEY=sk-tu-clave-api-aqui

# Supabase (si usas Supabase)
VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase

# Stripe (si usas pagos)
VITE_STRIPE_PUBLISHABLE_KEY=tu-clave-publica-de-stripe
```

### Verificar que la configuración funciona

Después de configurar las variables de entorno:

1. Reinicia el servidor de desarrollo
2. Intenta crear un nuevo plan desde el onboarding
3. Si todo está configurado correctamente, deberías ver que el plan se genera usando OpenAI

**Nota**: Si no configuras la API Key de OpenAI, la aplicación intentará usar plantillas básicas, pero no podrá generar planes personalizados con IA.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)


## Suplementos con Enlaces de Afiliados de Amazon

El proyecto incluye una sección de suplementos con productos afiliados de Amazon. Para configurar tus enlaces de afiliado:

1. **Obtén tu Tag de Afiliado de Amazon**:
   - Regístrate en el [Programa de Afiliados de Amazon](https://afiliados.amazon.es/)
   - Una vez aprobado, obtendrás tu tag de afiliado (ejemplo: `tu-tag-21`)

2. **Configura el Tag en el código**:
   - Abre el archivo `src/lib/supplements.ts`
   - Busca la constante `AMAZON_AFFILIATE_TAG`
   - Reemplaza `"TU-TAG-AFILIADO"` con tu tag real

3. **Actualiza los ASINs de los productos**:
   - Los ASINs actuales son ejemplos
   - Busca los productos reales en Amazon.es
   - Reemplaza los ASINs en el array `supplements` con los ASINs reales

4. **Personaliza los productos**:
   - Agrega o elimina productos según tus necesidades
   - Actualiza descripciones, beneficios y precios
   - Los productos se mostrarán automáticamente según el objetivo del usuario

**Nota**: Los enlaces de afiliados solo funcionarán si tienes un tag válido de Amazon Associates.

** Todo ****




