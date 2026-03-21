// Calcula el score de reputación basado en historial
function calcularScore(usuario) {
  if (!usuario) return 0;
  const score =
    (usuario.contratos_completados || 0) * 10 +
    (usuario.contratos_creados || 0) * 3 +
    (usuario.apuestas_ganadas || 0) * 2;
  return score;
}

// Genera insignias según el historial
function getInsignias(usuario) {
  if (!usuario) return [];
  const insignias = [];

  if (usuario.contratos_completados >= 1)
    insignias.push({
      id: "primer_contrato",
      label: "Primer Contrato",
      icon: "◆",
    });
  if (usuario.contratos_completados >= 5)
    insignias.push({
      id: "cinco_contratos",
      label: "Cinco Contratos",
      icon: "◆◆",
    });
  if (usuario.contratos_completados >= 10)
    insignias.push({ id: "veterano", label: "Veterano", icon: "◆◆◆" });
  if (usuario.contratos_creados >= 1)
    insignias.push({
      id: "primer_empleador",
      label: "Primer Empleador",
      icon: "⬡",
    });
  if (usuario.apuestas_ganadas >= 1)
    insignias.push({
      id: "primer_acierto",
      label: "Primer Acierto",
      icon: "◈",
    });
  if (usuario.apuestas_ganadas >= 5)
    insignias.push({ id: "pronosticador", label: "Pronosticador", icon: "◈◈" });
  if (usuario.reputacion_score >= 50)
    insignias.push({ id: "reputado", label: "Reputado", icon: "✦" });
  if (usuario.reputacion_score >= 100)
    insignias.push({ id: "elite", label: "Élite", icon: "✦✦" });

  return insignias;
}

// Nivel basado en score
function getNivel(score) {
  if (score >= 200) return { label: "Maestro", color: "var(--gold)" };
  if (score >= 100) return { label: "Experto", color: "var(--amber)" };
  if (score >= 50) return { label: "Avanzado", color: "var(--navy)" };
  if (score >= 20) return { label: "Intermedio", color: "var(--plum)" };
  return { label: "Principiante", color: "var(--ink3)" };
}

module.exports = { calcularScore, getInsignias, getNivel };
