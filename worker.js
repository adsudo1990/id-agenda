// worker.js — Mesa de Contenido: API mínima sobre Cloudflare Workers + KV
//
// Qué hace:
//  - GET  /       -> devuelve el estado guardado (JSON) o null si todavía no hay nada
//  - POST /       -> guarda el estado que le mandes (JSON) en KV, protegido con una clave
//
// Antes de desplegar, cambiá AUTH_TOKEN por una clave propia (cualquier texto),
// y usá esa misma clave en index.html (constante AUTH_TOKEN).

export default {
  async fetch(request, env) {
    const AUTH_TOKEN = "bflTw_yeL56TSywBPRxTNg9T4o6L3ExN"; // clave compartida con index.html

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // en producción podés reemplazar "*" por tu URL de GitHub Pages
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Auth",
    };

    // El navegador manda un OPTIONS antes del POST real (preflight de CORS)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "GET") {
      const data = await env.DB.get("estado");
      return new Response(data || "null", {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (request.method === "POST") {
      const auth = request.headers.get("X-Auth");
      if (auth !== AUTH_TOKEN) {
        return new Response("No autorizado", { status: 401, headers: corsHeaders });
      }
      const body = await request.text();
      // validación mínima: que sea JSON de verdad antes de guardarlo
      try {
        JSON.parse(body);
      } catch (e) {
        return new Response("JSON inválido", { status: 400, headers: corsHeaders });
      }
      await env.DB.put("estado", body);
      return new Response("ok", { headers: corsHeaders });
    }

    return new Response("Método no soportado", { status: 405, headers: corsHeaders });
  },
};
