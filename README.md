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
| **Groq API** | LLM gratuito — modelo `llama-3.3-70b-versatile` para el chat de primeros auxilios |
| **ElevenLabs** | Síntesis de voz (TTS) — modelo `eleven_flash_v2_5`, voz Matilda |
| **Open-Meteo** | API de clima en tiempo real (gratuita, sin clave) |
| **Nominatim / OpenStreetMap** | Geocodificación inversa — convierte coordenadas GPS a ciudad y país |

### Autenticación y seguridad
| Tecnología | Uso |
|---|---|
| **JWT** (`jsonwebtoken`) | Tokens de acceso (15 min) y refresh (7 días) almacenados en cookies HttpOnly |
| **bcryptjs** | Hash de contraseñas con salt |
| **Zod** | Validación de esquemas en API Routes |

### Base de datos
| Tecnología | Uso |
|---|---|
| **PostgreSQL** | Base de datos relacional principal |
| **Supabase** | Plataforma que provee la instancia de PostgreSQL en la nube |
| **Prisma ORM** (`@prisma/client`, `@prisma/adapter-pg`) | Modelado, migraciones y queries tipados contra la base de datos |
| **Pinecone** | Base de datos vectorial para RAG — almacena embeddings del historial médico y documentos de primeros auxilios para enriquecer las respuestas del asistente IA |
| **Cloudinary** | Almacenamiento y optimización de imágenes de perfil y documentos médicos del usuario |

### Hardware (pulsera física)
| Tecnología | Uso |
|---|---|
| **MicroPython** | Lenguaje de programación del microcontrolador embebido en la pulsera |
| **NFC (Near Field Communication)** | Tag pasivo integrado en la pulsera — al ser escaneado redirige al perfil del usuario sin necesidad de batería |
| **GPS / Geolocalización** | Módulo de localización en el hardware + Web Geolocation API en el navegador para mostrar la posición exacta del usuario |

### APIs de dispositivo (Web APIs)
| API | Uso |
|---|---|
| **Web Geolocation API** | Obtiene coordenadas GPS del dispositivo del usuario |
| **Web Speech API** (`SpeechRecognition`) | Entrada de voz en el chat — reconocimiento en español colombiano (`es-CO`) |
| **Web Audio API** | Reproducción del audio generado por ElevenLabs TTS |

---

## Modelos de datos principales

```
User → PersonalInformation, MedicalProfile, Allergy[], ChronicCondition[],
        UserMedication[], EmergencyContact[], MedicalHistory[],
        NfcScan[], EmergencyAlert[], PrivacySettings
```

Cada usuario puede controlar qué información es visible públicamente mediante `PrivacySettings`.

---

## Variables de entorno requeridas

```env
DATABASE_URL=           # Cadena de conexión PostgreSQL (Supabase)
JWT_SECRET=             # Secreto para firmar tokens JWT
GROQ_API_KEY=           # API key de Groq (LLM gratuito)
ELEVENLABS_API_KEY=     # API key de ElevenLabs (TTS)
PINECONE_API_KEY=       # API key de Pinecone (RAG vectorial)
CLOUDINARY_URL=         # URL de conexión a Cloudinary
```

---

## Pagos con Mercado Pago

- Flujo principal: `/tienda` → `/checkout` → Mercado Pago → `/payment/*`.
- Webhook: `/api/payments/webhook`.
- Estado de orden: `/api/payments/status/[orderId]`.

### Variables de entorno necesarias

```
NEXT_PUBLIC_APP_URL="http://localhost:3000"
MP_ACCESS_TOKEN="..."
MP_PUBLIC_KEY="..."

# SMTP para correos con PDF
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="465"
EMAIL_SECURE="true"
EMAIL_USER="tu-correo@gmail.com"
EMAIL_PASS="APP_PASSWORD_GMAIL"
EMAIL_FROM="tu-correo@gmail.com"
EMAIL_TO="tu-correo@gmail.com"
```

> Para compras reales, `NEXT_PUBLIC_APP_URL` debe ser una URL publica HTTPS y el webhook debe ser accesible desde Mercado Pago.

---

## Email de confirmacion

- Se envia al aprobar el pago en el webhook.
- Incluye un PDF con resumen de la orden y direccion de envio.

---

## Instalación y desarrollo

```bash
npm install
npx prisma generate
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.  
Usuarios no autenticados son redirigidos a `/login`.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/              # Endpoints: auth, chat, tts
│   ├── dashboard/        # Panel principal del usuario
│   │   └── _components/  # ChatModal, LocationMap, WeatherCard, SplineRobot...
│   ├── login/
│   └── register/
├── shared/
│   └── lib/              # JWT, cookies, Prisma client
prisma/
└── schema.prisma         # Esquema relacional completo
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
