const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw2DO0twlC7EH_etaFkSWZE0iz71uxgqJgfNbWrm2n0cuxEthxgHrUdWE8nbunXfwHm/exec";

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({
      ok: false,
      error: "Método no permitido.",
    });
  }

  try {
    const googleResponse = await fetch(`${APPS_SCRIPT_URL}?action=funciones`, {
      redirect: "follow",
    });
    const text = await googleResponse.text();
    const data = JSON.parse(text);

    if (!data.ok) {
      throw new Error(data.error || "No se pudieron consultar las funciones.");
    }

    response.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=60"
    );
    return response.status(200).json(data);
  } catch (error) {
    return response.status(502).json({
      ok: false,
      error: "No pudimos consultar el stock. Intentá nuevamente.",
    });
  }
};
