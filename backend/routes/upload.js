const { Router } = require("express");
const router = Router();

// POST /api/upload
// Recibe un archivo y lo sube a Pinata/IPFS
// La API key nunca sale del servidor
router.post("/", async (req, res) => {
  try {
    if (!process.env.PINATA_JWT) {
      return res.status(500).json({ error: "Pinata no configurado" });
    }

    // El archivo llega como base64 en el body
    const { fileBase64, fileName, mimeType } = req.body;
    if (!fileBase64 || !fileName) {
      return res
        .status(400)
        .json({ error: "fileBase64 y fileName son requeridos" });
    }

    // Convertir base64 a buffer
    const buffer = Buffer.from(fileBase64, "base64");

    // Crear FormData para Pinata
    const FormData = require("form-data");
    const form = new FormData();
    form.append("file", buffer, {
      filename: fileName,
      contentType: mimeType || "application/octet-stream",
    });
    form.append("pinataMetadata", JSON.stringify({ name: fileName }));
    form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    // Subir a Pinata
    const fetch = (...args) =>
      import("node-fetch").then(({ default: f }) => f(...args));
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          ...form.getHeaders(),
        },
        body: form,
      },
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: `Pinata error: ${err}` });
    }

    const data = await response.json();
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;

    res.json({
      ok: true,
      ipfsHash: data.IpfsHash,
      url: ipfsUrl,
      fileName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
