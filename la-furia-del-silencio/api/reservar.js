const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw2DO0twlC7EH_etaFkSWZE0iz71uxgqJgfNbWrm2n0cuxEthxgHrUdWE8nbunXfwHm/exec";

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      ok: false,
      error: "Método no permitido.",
    });
  }

  const apiSecret = process.env.RESERVATION_API_SECRET;

  if (!apiSecret) {
    return response.status(500).json({
      ok: false,
      error: "La conexión de reservas todavía no está configurada.",
    });
  }

  try {
    const payload = {
      ...(request.body || {}),
      apiSecret,
    };

    const googleResponse = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const text = await googleResponse.text();
    const data = JSON.parse(text);

    if (!data.ok) {
      return response.status(400).json(data);
    }

    return response.status(201).json(data);
  } catch (error) {
    return response.status(502).json({
      ok: false,
      error: "No pudimos registrar la reserva. Intentá nuevamente.",
    });
  }
};
