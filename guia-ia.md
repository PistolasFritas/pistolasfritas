# Conectar Claude al chat de PistolasFritas.com — Guía paso a paso

El chat de tu sitio ya está listo para usar Claude. Solo faltan estos pasos, que
tienes que hacer tú porque involucran tus cuentas y tu tarjeta. Total: ~15 minutos.

## Paso 1 — Consigue tu clave del API de Anthropic (~5 min)

1. Ve a **console.anthropic.com** y crea una cuenta (o entra con la que tengas).
2. En el menú, ve a **Billing** y agrega un método de pago.
   - El chat usa el modelo Haiku, que es el más barato: cada respuesta cuesta
     fracciones de centavo. Con $5-10 USD de crédito tienes para miles de
     preguntas de fans.
   - Recomendado: en Billing pon un **límite mensual** (por ejemplo $10) para
     que nunca te lleves sorpresas.
3. Ve a **API Keys** → **Create Key**. Ponle nombre "pistolas-chat".
4. **Copia la clave** (empieza con `sk-ant-...`) y guárdala en un lugar seguro.
   Solo se muestra una vez. NO la compartas con nadie ni la pegues en la página.

## Paso 2 — Crea el Worker en Cloudflare (~8 min, gratis)

1. Ve a **dash.cloudflare.com** y crea una cuenta gratis (o entra).
2. En el menú izquierdo: **Workers & Pages** → **Create** → **Create Worker**.
3. Ponle de nombre `pistolas-chat` y dale **Deploy** (con el código de ejemplo).
4. Dale **Edit code**, **borra todo** lo que hay, y pega el contenido completo
   del archivo `worker-pistolas.js` (está en tu carpeta pistolasfritas del
   Desktop). Dale **Deploy** arriba a la derecha.
5. Ahora guarda tu clave como secreto: regresa al panel del Worker →
   **Settings** → **Variables and Secrets** → **Add** →
   - Type: **Secret**
   - Name: `ANTHROPIC_API_KEY`  (exactamente así, en mayúsculas)
   - Value: tu clave `sk-ant-...`
   - **Save**
6. (Opcional pero recomendado, para el límite anti-abuso): en el panel principal
   de Cloudflare → **Storage & Databases** → **KV** → **Create namespace**,
   nómbralo `LIMITES`. Luego en tu Worker → Settings → **Bindings** → Add →
   **KV namespace** → Variable name: `LIMITES`, selecciona el namespace → Save.
   (Si te saltas este paso, el chat funciona igual, solo sin límite por visitante.)
7. Copia la **URL de tu Worker**. Se ve así:
   `https://pistolas-chat.TUUSUARIO.workers.dev`

## Paso 3 — Dame la URL

Regresa al chat conmigo (Claude en la app) y dime:
"la URL del worker es https://pistolas-chat.____.workers.dev"

Yo la conecto en el sitio (una línea), lo pruebo, y te dejo el index.html
actualizado en tu carpeta para que lo subas a GitHub. Desde ese momento el
chat 💬 de pistolasfritas.com responde con Claude de verdad, con toda tu
personalidad, y si algún día el Worker falla, el chat cae automáticamente al
modo de respuestas guardadas (nunca se queda mudo).

## Notas

- **Seguridad**: la clave vive solo en Cloudflare como secreto. El Worker solo
  acepta llamadas desde pistolasfritas.com y limita a ~10 preguntas por minuto
  por visitante para que nadie te vacíe el crédito.
- **Personalidad**: dentro de worker-pistolas.js está el "guion" del personaje
  (datos del canal, tu estilo, reglas de seguridad: nunca da instrucciones
  técnicas de armas, redirige a armeros certificados). Si quieres cambiarle
  algo al guion, dime y te doy el archivo actualizado.
- **Costos**: revisa console.anthropic.com → Usage cuando quieras. Con el
  límite mensual puesto, lo peor que puede pasar es que el chat se apague
  hasta el mes siguiente (y el respaldo local sigue contestando).
