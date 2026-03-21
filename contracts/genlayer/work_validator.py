from genlayer import gl
import json


class WorkValidator(gl.Contract):

    work_address:       str
    title:              str
    conditions_ia:      str
    required_approvals: int
    delivery_url:       str
    status:             str
    is_approved:        bool
    summary:            str
    votes_yes:          int
    votes_no:           int

    def __init__(
        self,
        work_address:       str,
        title:              str,
        conditions_ia:      str,
        required_approvals: int,
    ):
        self.work_address       = work_address
        self.title              = title
        self.conditions_ia      = conditions_ia
        self.required_approvals = required_approvals
        self.delivery_url       = ""
        self.status             = "pending"
        self.is_approved        = False
        self.summary            = ""
        self.votes_yes          = 0
        self.votes_no           = 0

    def _leer_url(self, url: str) -> str:
        """Intenta leer el contenido de una URL. Devuelve string con lo que encontró."""
        url = url.strip()
        if not url:
            return ""
        try:
            content = gl.get_webpage(url)
            return content[:4000] if len(content) > 4000 else content
        except Exception:
            return f"[No se pudo acceder a: {url}]"

    def _extraer_urls(self, delivery_url: str) -> list:
        """Extrae URLs individuales de un string que puede tener varias separadas por saltos de línea."""
        urls = [u.strip() for u in delivery_url.split('\n') if u.strip()]
        # Filtrar solo los que parecen URLs
        return [u for u in urls if u.startswith('http') or u.startswith('ipfs')]

    @gl.public.write
    def validate_delivery(self, delivery_url: str) -> dict:
        assert self.status == "pending", "Ya fue validado"
        assert len(delivery_url) > 0,    "URL de entrega vacía"

        self.delivery_url = delivery_url
        urls = self._extraer_urls(delivery_url)

        @gl.nondet
        def evaluate() -> str:
            # Leer contenido de todas las URLs entregadas
            contenidos = []
            for i, url in enumerate(urls[:5]):  # máximo 5 URLs
                contenido = self._leer_url(url)
                if contenido:
                    contenidos.append(f"RECURSO {i+1} ({url}):\n{contenido}")

            contenido_total = "\n\n".join(contenidos) if contenidos else \
                f"No se pudieron acceder a las URLs: {delivery_url}"

            prompt = f"""
Eres un juez imparcial evaluando la entrega de un trabajo freelance.

TÍTULO DEL CONTRATO:
{self.title}

CONDICIONES ESPECÍFICAS QUE DEBE CUMPLIR LA ENTREGA:
{self.conditions_ia}

URLS/ARCHIVOS ENTREGADOS:
{delivery_url}

CONTENIDO LEÍDO DE LOS RECURSOS:
{contenido_total}

INSTRUCCIONES DE EVALUACIÓN:
1. Evalúa si la entrega cumple TODAS las condiciones especificadas.
2. Si se entregaron imágenes o archivos visuales, evalúa su contenido visible.
3. Si se entregaron PDFs o documentos, evalúa el texto extraído.
4. Si se entregó código, evalúa si cumple los requisitos técnicos.
5. Sé estricto con requisitos cuantitativos (palabras, páginas, formatos, etc).
6. Si no puedes acceder a algún recurso, indica que no pudiste verificarlo.
7. Si NINGÚN recurso fue accesible, rechaza la entrega.

RESPONDE ÚNICAMENTE con un JSON válido con este formato exacto:
{{
  "decision": "si" o "no",
  "summary": "Resumen en 2-3 oraciones de por qué aprueba o rechaza, mencionando qué recursos revisaste"
}}

No agregues texto antes ni después del JSON.
"""
            return gl.exec_prompt(prompt)

        final = gl.eq_principle_prompt_comparative(
            evaluate,
            principle=(
                "La entrega cumple si satisface razonablemente todas las "
                "condiciones especificadas por el cliente. "
                "Dos respuestas son equivalentes si coinciden en la decisión "
                "(si/no) aunque el resumen sea diferente."
            ),
        )

        try:
            parsed   = json.loads(final)
            decision = parsed.get("decision", "no").lower().strip()
            summary  = parsed.get("summary", "Sin resumen disponible")
        except Exception:
            decision = "si" if "si" in final.lower()[:20] else "no"
            summary  = final[:200]

        self.is_approved = decision == "si"
        self.summary     = summary
        self.status      = "validated" if self.is_approved else "rejected"

        return {
            "approved":     self.is_approved,
            "summary":      self.summary,
            "work_address": self.work_address,
        }

    @gl.public.view
    def get_result(self) -> dict:
        return {
            "work_address":       self.work_address,
            "status":             self.status,
            "is_approved":        self.is_approved,
            "summary":            self.summary,
            "required_approvals": self.required_approvals,
            "delivery_url":       self.delivery_url,
        }