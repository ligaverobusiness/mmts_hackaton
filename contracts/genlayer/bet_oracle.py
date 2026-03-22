# { "Depends": "py-genlayer:test" }
from genlayer import *
import json


class BetOracle(gl.Contract):

    bet_address:          str
    title:                str
    resolution_criteria:  str
    side_a_name:          str
    side_b_name:          str
    status:               str
    side_a_wins:          bool
    summary:              str

    def __init__(
        self,
        bet_address:         str,
        title:               str,
        resolution_criteria: str,
        side_a_name:         str,
        side_b_name:         str,
    ):
        self.bet_address         = bet_address
        self.title               = title
        self.resolution_criteria = resolution_criteria
        self.side_a_name         = side_a_name
        self.side_b_name         = side_b_name
        self.status              = "pending"
        self.side_a_wins         = False
        self.summary             = ""

    @gl.public.write
    def resolve(self):
        assert self.status == "pending", "Ya fue resuelto"

        title               = self.title
        resolution_criteria = self.resolution_criteria
        side_a_name         = self.side_a_name
        side_b_name         = self.side_b_name

        def evaluate() -> str:
            prompt = f"""
Eres un árbitro imparcial resolviendo una apuesta de predicción.

PREGUNTA DE LA APUESTA:
{title}

CRITERIO DE RESOLUCIÓN:
{resolution_criteria}

OPCIONES:
- Opción A: {side_a_name}
- Opción B: {side_b_name}

TAREA:
1. Busca información actualizada sobre el resultado real del evento.
2. Determina cuál de las dos opciones es la correcta según los hechos.
3. Si no puedes determinar el resultado con certeza, indica "indeterminado".

RESPONDE ÚNICAMENTE con un JSON válido con este formato exacto:
{{
  "winner": "A" o "B" o "indeterminado",
  "summary": "Resumen en 2-3 oraciones explicando el resultado y por qué ganó esa opción"
}}

No agregues texto antes ni después del JSON.
"""
            return gl.exec_prompt(prompt)

        final = gl.eq_principle_prompt_comparative(
            evaluate,
            principle=(
                "Dos respuestas son equivalentes si coinciden en el ganador "
                "(A, B o indeterminado) aunque el resumen sea diferente."
            ),
        )

        try:
            parsed  = json.loads(final)
            winner  = parsed.get("winner", "indeterminado").strip().upper()
            summary = parsed.get("summary", "Sin resumen disponible")
        except Exception:
            winner  = "indeterminado"
            summary = final[:200]

        self.side_a_wins = winner == "A"
        self.summary     = summary
        self.status      = "resolved" if winner in ("A", "B") else "undetermined"

    @gl.public.view
    def get_result(self) -> str:
        return json.dumps({
            "bet_address":  self.bet_address,
            "status":       self.status,
            "side_a_wins":  self.side_a_wins,
            "summary":      self.summary,
        })