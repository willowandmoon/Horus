# Horus Braslet

**Horus Braslet** es un sistema de identificación médica de emergencia basado en una pulsera inteligente con NFC. Al escanear la pulsera, el personal de emergencias o cualquier persona puede acceder al perfil médico completo del portador: tipo de sangre, alergias, medicamentos, condiciones crónicas y contactos de emergencia. La plataforma también incluye un asistente de primeros auxilios con inteligencia artificial y voz.

---

## ¿Cómo funciona?

1. El usuario se registra y completa su perfil médico en la aplicación web.
2. Un tag NFC físico (integrado en la pulsera) queda vinculado a su cuenta.
3. Al acercar la pulsera a cualquier teléfono con NFC, se redirige automáticamente al perfil público del usuario.
4. Desde el dashboard, el usuario puede consultar su ubicación en tiempo real, el pronóstico del clima y chatear con Horus, el asistente de primeros auxilios IA.

---

## Stack tecnológico

### Frontend
| Tecnología | Uso |
|---|---|
| **Next.js 16** | Framework principal — App Router, Server Components, API Routes |
| **React 19** | UI declarativa con hooks y componentes del lado del cliente |
| **TypeScript 5** | Tipado estático en todo el proyecto |
| **Tailwind CSS 4** | Estilos utilitarios y diseño responsivo |
| **Spline** (`@splinetool/react-spline`) | Animaciones 3D interactivas — robot asistente y fondo del mapa |

### Backend / API Routes
| Tecnología | Uso |
|---|---|
| **Next.js API Routes** | Endpoints REST dentro del mismo proyecto (`/api/*`) |
| **OpenAI** (`gpt-4o-mini`) | LLM para corrección OCR, estructuración de texto médico y normalización de medicamentos |
| **ElevenLabs** | Síntesis de voz (TTS) — modelo `eleven_flash_v2_5`, voz Matilda |
| **Open-Meteo** | API de clima en tiempo real (gratuita, sin clave) |
| **Nominatim / OpenStreetMap** | Geocodificación inversa — convierte coordenadas GPS a ciudad y país |

### Autenticación y seguridad
| Tecnología | Uso |
|---|---|
| **JWT** (`jsonwebtoken`) | Tokens de acceso (15 min) y refresh (7 días) almacenados en cookies HttpOnly |
| **bcryptjs** | Hash de contraseñas con salt |
| **Zod** | Validación de esquemas en API Routes |

### Base de datos y almacenamiento
| Tecnología | Uso |
|---|---|
| **PostgreSQL** (Neon) | Base de datos relacional principal — usuarios, perfiles médicos, pagos |
| **Prisma ORM** | Modelado, migraciones y queries tipados. Genera cliente en `src/generated/` |
| **Firebase Firestore** | Historial de documentos médicos subidos (trazabilidad) |
| **Cloudinary** | Almacenamiento de archivos médicos e imágenes de perfil — fuente de verdad para los archivos activos |

### Pagos
| Tecnología | Uso |
|---|---|
| **MercadoPago SDK v2** | Checkout Pro, webhook de confirmación, envío de recibo por email con PDF |
| **Nodemailer** | SMTP Gmail — envío del email de confirmación de compra |
| **PDFKit** | Generación del PDF de recibo adjunto al email |

---

## Modelos de datos principales

```
User → PersonalInformation, MedicalProfile, Allergy[], ChronicCondition[],
        UserMedication[], EmergencyContact[], MedicalHistory[],
        ProfileScan[], EmergencyAlert[], PrivacySettings,
        UserDevice[], DeviceSession[], SecurityLog[]

Product → Order → Payment → Subscription
```

Cada usuario puede controlar qué información es visible públicamente mediante `PrivacySettings`.

---

## Instalación y desarrollo

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd horus-braslet
npm install
```

### 2. Archivos que debes colocar manualmente

Estos archivos están en `.gitignore` y **no se incluyen en el repositorio**. Debes crearlos/colocarlos antes de correr el proyecto:

#### `.env` (raíz del proyecto)

```env
# Base de datos PostgreSQL (Neon)
DATABASE_URL="postgresql://..."

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# JWT
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."

# MercadoPago (TEST para desarrollo, producción sin TEST- prefix)
MP_PUBLIC_KEY="TEST-..."
MP_ACCESS_TOKEN="TEST-..."
MP_WEBHOOK_SECRET="..."

# URL pública de la app (ngrok en dev, dominio real en prod)
NEXT_PUBLIC_APP_URL="https://tu-dominio.ngrok-free.dev"

# SMTP Gmail para emails de confirmación
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="465"
EMAIL_SECURE="true"
EMAIL_USER="tu-correo@gmail.com"
EMAIL_PASS="tu-app-password-gmail"
EMAIL_FROM="tu-correo@gmail.com"
EMAIL_TO="tu-correo@gmail.com"

# OCR con IA (true para activar corrección con OpenAI)
USE_AI_CORRECTION="true"
```

> **Gmail App Password**: ve a tu cuenta de Google → Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones.

#### `src/config/<nombre>-firebase-adminsdk-<id>.json`

Credenciales del Firebase Admin SDK. Para obtenerlo:
1. Ve a [Firebase Console](https://console.firebase.google.com) → tu proyecto → Configuración del proyecto → Cuentas de servicio
2. Haz clic en **"Generar nueva clave privada"**
3. Guarda el archivo JSON descargado en `src/config/`

El archivo tiene esta forma:
```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-...@....iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### 3. Generar el cliente de Prisma

```bash
npx prisma generate
```

> El cliente se genera en `src/generated/` (no en `node_modules`). Si ves errores de importación, asegúrate de haber corrido este comando.

### 4. Descargar datos de Tesseract OCR (opcional)

Solo necesario si vas a usar OCR local para imágenes:

```bash
npm run download:tessdata
```

### 5. Correr en desarrollo

```bash
npm run dev
# Disponible en http://localhost:3002
```

> El proyecto corre en el **puerto 3002** (no 3000). Esto es intencional para coexistir con otros servicios del ecosistema Horus.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/              # Login, registro, logout, refresh
│   │   ├── profile/           # Perfil de usuario y foto
│   │   ├── medical-profile/   # Alergias, condiciones, medicamentos, historial
│   │   ├── medical-history/   # Documentos médicos (Cloudinary + Firebase)
│   │   ├── files/download/    # Proxy de descarga segura desde Cloudinary
│   │   ├── payments/          # MercadoPago: create-order, webhook, status
│   │   └── ocr/               # Endpoint de corrección OCR
│   ├── dashboard/             # Panel principal con mapa, clima y chat IA
│   ├── archivos/              # Documentos médicos del usuario
│   ├── profile/               # Perfil personal + perfil médico (tabs)
│   ├── login/ register/       # Autenticación
│   └── layout.tsx             # Fuentes: Pliant (body) + Space Grotesk (headings)
├── components/
│   └── FloatingSidebar.tsx    # Sidebar flotante vertical (estilo mobile)
├── infrastructure/
│   ├── ai/openai.ts           # Corrección OCR, estructuración de texto médico
│   ├── cloudinary/            # Upload y descarga de archivos
│   ├── database/
│   │   ├── prisma/client.ts   # Cliente Prisma (importa de src/generated/client)
│   │   ├── firebase.ts        # Firebase Admin SDK
│   │   └── medicalRecordsRepository.ts
│   └── medical-history/       # Scraper, OCR, PDF extractor, Word extractor
├── generated/                 # Cliente Prisma generado (no commitear, sí .gitignore)
└── config/
    └── *.json                 # Firebase service account (NO commitear)
prisma/
└── schema.prisma              # Esquema relacional completo
public/
└── fonts/                     # Pliant-Variable.ttf, Pliant-Italic-Variable.ttf
```

---

## Pagos con MercadoPago

- Flujo: `/tienda` → `/checkout` → MercadoPago → `/payment/*`
- Webhook: `POST /api/payments/webhook`
- Estado: `GET /api/payments/status/[orderId]`

Para desarrollo local con webhook, usa [ngrok](https://ngrok.com):
```bash
ngrok http 3002
# Copia la URL HTTPS y úsala en NEXT_PUBLIC_APP_URL y en el webhook de MercadoPago
```

---

## Números de emergencia (Colombia)

| Servicio | Número |
|---|---|
| Línea de emergencias unificada | **123** |
| Cruz Roja Colombiana | **132** |
| Bomberos | **119** |

---

> Proyecto desarrollado para mejorar la respuesta ante emergencias médicas en Colombia mediante tecnología accesible, portátil e inmediata.
