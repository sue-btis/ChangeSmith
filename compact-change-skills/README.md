# Compact Change Skills

Plugin proporcional para preparar, especificar, planear, implementar y verificar cambios de software desde correcciones pequeñas hasta cambios grandes pero acotables.

Compatible con **OpenAI Codex** y **Claude Code**. Los `SKILL.md` están en inglés para maximizar portabilidad entre agentes y runtimes; los artefactos pueden escribirse en el idioma del usuario.

## Qué cambia en 2.1

La versión 2.1 conserva el flujo proporcional de 2.0 y añade integración explícita con paquetes de diseño canónicos producidos por `software-design-skills`, sin convertir `compact-change-skills` en un workflow greenfield.

Se incorporan los controles más útiles de un workflow spec-to-execution:

- auditoría enfocada y persistente del estado actual;
- autoridad clara de artefactos y contexto reducido entre fases;
- decisiones explícitas antes de congelar contratos;
- trazabilidad `REQ-*` → `AC-*` → `TST-*`;
- grafo de dependencias y Gate 0 opcional;
- ownership exacto de write sets, generated files, migrations y lockfiles;
- ejecución por waves con integration gates;
- preflight anti-staleness antes de editar;
- separación entre implementación y verificación independiente;
- descubrimiento opcional de `manifest.yaml` y fuentes canónicas de producto/arquitectura/API/datos/UX;
- obligación de declarar y sincronizar los artefactos canónicos afectados por un cambio;
- reutilización de `implementing-change` y `verifying-change` para ejecutar un build slice greenfield ya aprobado, sin reabrir diseño.

## Flujo proporcional

```text
shaping-change
   ├─ quick
   │    └─ writing-change-spec
   │         └─ implementing-change
   │              └─ verifying-change
   │
   ├─ medium
   │    └─ writing-change-spec
   │         ├─ implementing-change
   │         └─ writing-change-plan -> implementing-change
   │                                   └─ verifying-change
   │
   ├─ large
   │    └─ auditing-change
   │         └─ writing-change-spec
   │              └─ writing-change-plan
   │                   └─ implementing-change
   │                        └─ verifying-change
   │
   └─ escalate
        └─ detener y reportar por qué el cambio no puede acotarse con seguridad
```

`large` ya no significa automáticamente "usar otro workflow". `escalate` queda reservado para cambios que no pueden congelarse o ejecutarse de forma segura dentro de un repositorio o conjunto de ownerships claramente delimitados.

## Integración con software-design-skills

Si el repositorio contiene un manifiesto de diseño canónico (por defecto `docs/spec/manifest.yaml`, o una ruta equivalente descubierta por inspección), trátalo como un índice de autoridades, no como una copia de contenido.

Para cambios brownfield:

```text
manifest -> canonical sources -> audit/spec -> plan -> implement -> verify
```

El `spec.md` debe declarar qué fuentes canónicas son afectadas y si deben actualizarse. El cierre exige que código y fuentes canónicas aplicables vuelvan a estar alineados.

Para la construcción inicial de un sistema diseñado con `software-design-skills`, se puede invocar directamente `implementing-change` sobre **un solo build slice aprobado** y después `verifying-change`. No se usa `shaping-change` para rediseñar ese slice: el paquete greenfield aprobado ya gobierna el comportamiento y los contratos.

## Clasificación

La **dimensión de tamaño** y la **dimensión de confiabilidad** son independientes.

### Tamaño

- `quick`: una conducta observable, una superficie pequeña y sin secuencia compleja.
- `medium`: varias piezas acopladas pero todavía manejables con una especificación y, cuando aporta valor, un plan.
- `large`: múltiples workstreams o contratos, dependencias reales, migraciones/rollout, integración amplia o superficie suficientemente grande para requerir auditoría persistente y ejecución por waves.
- `escalate`: el trabajo no puede acotarse de forma segura por evidencia, ownership, repositorio, decisiones o riesgo.

### Confiabilidad

- `lean`: bajo riesgo.
- `strict`: contratos compartidos, regresiones relevantes o lógica de negocio no trivial.
- `critical`: autorización, dinero, datos sensibles, operaciones destructivas, concurrencia o invariantes críticas.

Un cambio puede ser `quick + critical` o `large + strict`.

## Artefactos

### Quick

```text
docs/changes/YYYY-MM-DD-<slug>/
├── spec.md
└── verification.md
```

`execution.md` se crea solo si la implementación necesita un handoff persistente o se ejecuta en más de una sesión/agente.

### Medium

```text
docs/changes/YYYY-MM-DD-<slug>/
├── spec.md
├── plan.md          # condicional
├── execution.md     # condicional
└── verification.md
```

### Large

```text
docs/changes/YYYY-MM-DD-<slug>/
├── audit.md
├── spec.md
├── plan.md
├── execution.md
└── verification.md
```

No se generan copias separadas de draft, review, freeze o sanity check. La revisión endurece el mismo `spec.md`; el preflight actualiza el mismo `execution.md`.

## Autoridad de contexto

Cada fase debe consumir el paquete mínimo necesario.

| Momento | Fuente autoritativa |
|---|---|
| Antes de auditar | solicitud + resultado de `shaping-change` |
| Después de auditar | `audit.md` para hechos del repositorio |
| Antes de implementar | `spec.md` para comportamiento y contratos |
| Durante ejecución planificada | `spec.md` + `plan.md` |
| Antes de declarar terminado | diff real + `spec.md` + evidencia reproducible |

No pases historiales completos a agentes de implementación. Para un workstream grande, usa únicamente el spec congelado, la sección relevante del plan y los paths permitidos.

## Skills

- `shaping-change`: inspección inicial, clasificación `quick|medium|large|escalate`, auditoría de decisiones y selección de confiabilidad.
- `auditing-change`: auditoría read-only persistente para cambios grandes, con baseline, behavior trace, contratos, comandos, ownership candidato y hotspots.
- `writing-change-spec`: especificación proporcional. Para large incluye IDs estables, proveniencia, contratos congelados y self-review antes de marcarla aprobada.
- `writing-change-plan`: planificación de medium/large. Para large añade dependencias, Gate 0 opcional, topology, write-set ownership, waves, integration gates y fallback secuencial.
- `implementing-change`: preflight contra el repositorio actual, ejecución controlada por workstream/wave, límites de escritura, pruebas y registro de evidencia.
- `verifying-change`: auditoría final independiente basada en el diff real y la trazabilidad del spec, sin confiar únicamente en resúmenes de implementación.

## Invocación sugerida

### Claude Code

```text
/shape-software-change
/audit-software-change
/write-change-spec
/write-change-plan
/implement-software-change
/verify-software-change
```

Forma canónica:

```text
/compact-change-skills:shaping-change
/compact-change-skills:auditing-change
/compact-change-skills:writing-change-spec
/compact-change-skills:writing-change-plan
/compact-change-skills:implementing-change
/compact-change-skills:verifying-change
```

### OpenAI Codex

```text
Use $shaping-change for this request. Inspect the repository and choose the smallest safe workflow.
```

Para un cambio grande ya clasificado:

```text
Use $auditing-change, then $writing-change-spec and $writing-change-plan. Keep the implementation context bounded to the frozen spec and the assigned workstream.
```

Para ejecutar:

```text
Use $implementing-change. Run the preflight first and stop if the plan is stale or the write set overlaps unrelated work.
```

Para cierre:

```text
Use $verifying-change in independent audit mode. Inspect the declared diff range and verify every applicable requirement and acceptance criterion.
```

## Principios

- No hacer grande un cambio pequeño.
- No hacer pequeño un cambio grande.
- Preguntar solo por decisiones que cambian corrección, alcance, contrato, seguridad, rollout o testabilidad.
- Resolver por inspección todo lo que el repositorio pueda responder.
- Recomendaciones no equivalen a aprobaciones.
- No permitir que un agente de implementación invente arquitectura o contratos.
- Ningún writer escribe fuera de su write set.
- Generated files, migrations, project files y lockfiles siempre tienen owner explícito cuando pueden cambiar.
- El integration owner revisa el diff real y corre checks combinados.
- No declarar `Pass` usando únicamente el reporte del agente que implementó.
