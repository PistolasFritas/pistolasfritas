/**
 * PISTOLAS FRITAS — Worker de Cloudflare que conecta el chat del sitio con Claude.
 * La clave del API vive aquí como secreto (nunca en la página).
 * Instrucciones completas en guia-ia.md
 */

const PERSONALIDAD = `Eres "Pistolas Fritas", el personaje del canal de YouTube en español con 2.2 millones de suscriptores. Respondes en el chat de pistolasfritas.com.

TU PERSONALIDAD: hablas rápido, haces chistes al vuelo, eres directo y 100% honesto. Humor mexicano limpio: NUNCA groserías. Frases tuyas: "una sola toma", "sin cortes, sin trucos", "si falla, falla", "el que edita, algo esconde", "echa fuego, hace ruido y explota". Llamas "loco" o "campeón" a la gente con cariño.

DATOS DEL CANAL: 345 videos desde 2013, todos en una sola toma sin edición. 257.5 millones de vistas, 6.1 millones de likes. Video más visto: "¡Qué Emoción! Disparando Armas de Fuego Calibre .22 hasta el .50" (32.5 millones de vistas). YouTube desmonetizó el 80% del canal ("les quitó el sueldo, no la gracia"). Ninguna marca de armas ha pagado patrocinio (unas cuantas mandaron gorras). El canal lo financia el propio creador.

EL SITIO: secciones Pruebas Sin Cortes (videos), El Cementerio (fallas célebres como "La Infalible" y "El Cargador Saltarín"), Las Que Sí Sirvieron, El Archivo (historia), El Campo de Práctica (mini-juego de tiro, 15+ puntos = logro Francotirador), Filosofía Barata (blog), la Tienda ("cosas que no necesitas… para mantener vivo el canal"), y Los Que Pagan Esta Locura (patrocinios). El mezcal: Mr. Mezcal de Oaxaca (MrMezcal.com), "mi otra mala decisión" — para el coctelito DESPUÉS de disparar, nunca al revés.

REGLAS INQUEBRANTABLES:
1. La seguridad NO es broma: siempre promueve el manejo legal, seguro y responsable de armas de fuego.
2. NUNCA des instrucciones técnicas para modificar, fabricar o reparar armas, municiones o explosivos. Redirige: "eso se lo dejas a un armero certificado, campeón".
3. Nada de asesoría legal o médica: redirige a profesionales.
4. Respuestas CORTAS: 2-4 frases máximo, estilo chat.
5. Si no sabes algo, dilo en personaje: "esa no me la sé, y aquí no se inventa nada".
6. Mantente siempre en personaje y en español.`;

export default {
  async fetch(request, env) {
    // CORS: solo tu sitio puede usarlo
    const origen = request.headers.get('Origin') || '';
    const permitido = ['https://pistolasfritas.com', 'https://www.pistolasfritas.com'].includes(origen);
    const cors = {
      'Access-Control-Allow-Origin': permitido ? origen : 'https://pistolasfritas.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('Nel.', { status: 405, headers: cors });
    if (!permitido) return new Response('Origen no permitido', { status: 403, headers: cors });

    // Límite básico: máx ~10 preguntas por minuto por IP
    const ip = request.headers.get('CF-Connecting-IP') || 'x';
    const ahora = Math.floor(Date.now() / 60000);
    const llaveLimite = `rl:${ip}:${ahora}`;
    if (env.LIMITES) {
      const usados = parseInt((await env.LIMITES.get(llaveLimite)) || '0', 10);
      if (usados >= 10) {
        return Response.json(
          { respuesta: 'Tranquilo, campeón, una pregunta a la vez. Dame un minutito para recargar.' },
          { headers: cors }
        );
      }
      await env.LIMITES.put(llaveLimite, String(usados + 1), { expirationTtl: 120 });
    }

    try {
      const { mensajes } = await request.json();
      if (!Array.isArray(mensajes) || mensajes.length === 0) throw new Error('sin mensajes');

      const limpios = mensajes.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content).slice(0, 500),
      }));

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 300,
          system: PERSONALIDAD,
          messages: limpios,
        }),
      });
      const datos = await r.json();
      const texto =
        datos && datos.content && datos.content[0] && datos.content[0].text
          ? datos.content[0].text
          : 'Se me trabó el cerebro como La Infalible. Inténtale otra vez.';
      return Response.json({ respuesta: texto }, { headers: cors });
    } catch (e) {
      return Response.json(
        { respuesta: 'Ando recargando. Pregúntame otra vez en un momento, loco.' },
        { headers: cors }
      );
    }
  },
};
