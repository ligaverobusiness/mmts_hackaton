# { "Depends": "py-genlayer:test" }
from genlayer import *
import json


class WorkValidator(gl.Contract):

    work_address:       str
    title:              str
    conditions_ia:      str
    required_approvals: u256
    delivery_url:       str
    status:             str
    is_approved:        bool
    summary:            str

    def __init__(
        self,
        work_address:       str,
        title:              str,
        conditions_ia:      str,
        required_approvals: u256,
    ):
        self.work_address       = work_address
        self.title              = title
        self.conditions_ia      = conditions_ia
        self.required_approvals = required_approvals
        self.delivery_url       = ""
        self.status             = "pending"
        self.is_approved        = False
        self.summary            = ""

    @gl.public.write
    def validate_delivery(self, delivery_url: str):
        assert self.status == "pending", "Ya fue validado"
        assert len(delivery_url) > 0, "URL de entrega vacía"

        self.delivery_url = delivery_url
        title         = self.title
        conditions_ia = self.conditions_ia

        def evaluate() -> str:
            raw_urls = [u.strip() for u in delivery_url.split('\n') if u.strip()]
            urls     = [u for u in raw_urls if u.startswith('http') or u.startswith('ipfs')]

            contenidos = []
            for i, url in enumerate(urls[:5]):
                try:
                    content = gl.get_webpage(url)
                    preview = content[:4000] if len(content) > 4000 else content
                    contenidos.append(f"RECURSO {i+1} ({url}):\n{preview}")
                except Exception:
                    contenidos.append(f"RECURSO {i+1} ({url}): [No accesible]")

            contenido_total = "\n\n".join(contenidos) if contenidos else \
                f"No se pudieron acceder a las URLs: {delivery_url}"

            prompt = f"""
Eres un juez imparcial evaluando la entrega de un trabajo freelance.

TÍTULO DEL CONTRATO:
{title}

CONDICIONES ESPECÍFICAS QUE DEBE CUMPLIR LA ENTREGA:
{conditions_ia}

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
  "summary": "Resumen en 2-3 oraciones de por qué aprueba o rechaza"
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

    @gl.public.view
    def get_result(self) -> str:
        return json.dumps({
            "work_address":       self.work_address,
            "status":             self.status,
            "is_approved":        self.is_approved,
            "summary":            self.summary,
            "required_approvals": int(self.required_approvals),
            "delivery_url":       self.delivery_url,
        })