# work_validator.py — Intelligent Contract de GenLayer
# Valida entregas de contratos de trabajo con consenso de IA

from genlayer import gl
import json


class WorkValidator(gl.Contract):
    """
    Contrato inteligente que valida entregas de trabajo.
    Cada instancia corresponde a un contrato de trabajo en Solidity.
    """

    # Datos del contrato
    work_address: str       # Address del WorkCOFI en Solidity
    title: str
    conditions_ia: str      # Condiciones privadas — nunca se exponen
    required_approvals: int # 3, 4, o 5
    delivery_url: str
    status: str             # pending | validated | rejected

    # Resultado
    is_approved: bool
    summary: str
    votes_yes: int
    votes_no: int

    def __init__(
        self,
        work_address: str,
        title: str,
        conditions_ia: str,
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

    @gl.public.write
    def validate_delivery(self, delivery_url: str) -> dict:
        """
        Llamado cuando el freelancer entrega el trabajo.
        5 validadores IA evalúan si cumple las condiciones.
        """
        assert self.status == "pending", "Ya fue validado"
        assert len(delivery_url) > 0, "URL de entrega vacía"

        self.delivery_url = delivery_url

        @gl.nondet
        def evaluate() -> str:
            # Intenta leer el contenido del link entregado
            try:
                content = gl.get_webpage(delivery_url)
                content_preview = content[:3000] if len(content) > 3000 else content
            except Exception:
                content_preview = f"No se pudo acceder a: {delivery_url}"

            prompt = f"""
Eres un juez imparcial evaluando la entrega de un trabajo freelance.

TÍTULO DEL CONTRATO:
{self.title}

CONDICIONES ESPECÍFICAS QUE DEBE CUMPLIR LA ENTREGA:
{self.conditions_ia}

URL/REFERENCIA DE LA ENTREGA:
{delivery_url}

CONTENIDO ENCONTRADO (si aplica):
{content_preview}

TAREA:
1. Evalúa si la entrega cumple TODAS las condiciones especificadas.
2. Sé estricto con los requisitos cuantitativos (número de páginas, palabras, referencias, etc).
3. Si la URL no es accesible, evalúa solo con la información disponible.

RESPONDE ÚNICAMENTE con un JSON válido con este formato exacto:
{{
  "decision": "si" o "no",
  "summary": "Resumen en 1-2 oraciones de por qué aprueba o rechaza"
}}

No agregues texto antes ni después del JSON.
"""
            result = gl.exec_prompt(prompt)
            return result

        # Aplicar Equivalence Principle — los 5 validadores deben coincidir
        final = gl.eq_principle_prompt_comparative(
            evaluate,
            principle=(
                "La entrega cumple si satisface razonablemente todas las "
                "condiciones especificadas por el cliente. "
                "Dos respuestas son equivalentes si coinciden en la decisión "
                "(si/no) aunque el resumen sea diferente."
            ),
        )

        # Parsear resultado
        try:
            parsed = json.loads(final)
            decision = parsed.get("decision", "no").lower().strip()
            summary  = parsed.get("summary", "Sin resumen disponible")
        except Exception:
            # Si el JSON no es válido, buscamos si/no en el texto
            decision = "si" if "si" in final.lower()[:20] else "no"
            summary  = final[:200]

        self.is_approved = decision == "si"
        self.summary     = summary
        self.status      = "validated" if self.is_approved else "rejected"

        return {
            "approved": self.is_approved,
            "summary":  self.summary,
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