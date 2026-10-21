# Software Design Skills

Plugin para convertir una idea de producto, o un sistema que ya existe, en un paquete de diseño de software listo para implementación sin convertir el PRD en un documento monolítico.

Compatible con **OpenAI Codex** y **Claude Code**. Los `SKILL.md` están en inglés para portabilidad; los artefactos pueden escribirse en el idioma del usuario.

## Qué cambia en 1.2

- **Después de aprobar, el paquete cambia por carpetas de compact-change.** Solo un cambio material abre una baseline nueva, y su revisión cubre la zona de impacto más las contradicciones globales.
- **No hay estados guardados que se desactualicen.** El brief, el PRD y el plan pierden su línea `Status:`. El estado de cada milestone es el encabezado de su `verification.md`.
- **No hay semver del paquete.** La versión es la baseline (`RV-n`), y lo que cambió después de aprobar se ve en git. Solo los contratos con consumidores llevan semver propio.
- **Las decisiones viven en un solo registro**, la sección 15 del PRD, con quién, fecha y cita textual. Los ADR nacen `Proposed` y solo pasan a `Accepted` con la cita del dueño.
- **Un script verificador corre antes de la revisión con el modelo**, sin dependencias y solo en paquetes con `schema_version: 3`.
- **El tope de 3 ciclos tiene salida**: la elige el usuario, y cada hallazgo abierto va al "Detente si" del milestone que afecta.
- **Se agregan** `quality-attributes.md`, el modo retroactivo, `cross_repo_dependencies` en el manifest e IDs uniformes de tres dígitos.

## Idea central

Una sola fuente de verdad por tipo de decisión:

| Pregunta | Autoridad |
|---|---|
| ¿Por qué existe el producto y qué debe hacer? | `docs/product/prd.md` |
| ¿Qué decidió el stakeholder? | `docs/product/prd.md` §15 |
| ¿Qué conceptos y reglas forman el dominio? | `docs/design/domain.md` |
| ¿Cómo se estructura el sistema? | `docs/design/architecture/architecture.dsl` |
| ¿Por qué se eligió una decisión técnica? | `docs/design/architecture/adr/` |
| ¿Cómo responde el diseño a cada NFR y cómo se verificará? | `docs/design/architecture/quality-attributes.md` |
| ¿Cuál es el modelo persistente? | `docs/design/data/schema.dbml` |
| ¿Cuál es el contrato HTTP? | `docs/design/api/openapi.yaml` |
| ¿Cuál es el contrato de eventos? | `docs/design/events/asyncapi.yaml` |
| ¿Cómo fluye el usuario? | `docs/design/ux/flows.mmd` |
| ¿Cómo se valida visualmente una UI importante? | `docs/design/ux/prototype.html` |
| ¿Cuál es el estado de los hallazgos de revisión? | `docs/design/review.md` *(evidencia, no autoridad de diseño)* |
| ¿En qué orden se construye? | `docs/build/plan.md` |
| ¿Cómo va cada milestone? | encabezado de `verification.md` en su carpeta de cambio |
| ¿Dónde se declara qué archivo manda? | `docs/spec/manifest.yaml` |

No todos los proyectos necesitan todos los archivos. La skill de diseño crea únicamente los artefactos aplicables.

## Flujo

```text
shaping-product
      ↓
writing-prd
      ↓
designing-system
      ↓
reviewing-system-design        # comprobaciones mecánicas, luego baseline RV-001
      ↓
   ¿BLOCKER/MAJOR?
      ├─ no ───────────────→ approved
      │                         ↓
      │                  writing-build-plan
      │
      └─ sí
          ↓
reconciling-system-design      # corrige findings existentes
          ↓
reviewing-system-design        # follow-up por impact cone
          ↓
      approved / reconcile / blocked / escalate
```

La revisión no corrige sus propios hallazgos. `reviewing-system-design` actúa como gate independiente, en una sesión que no escribió el diseño; `reconciling-system-design` modifica las autoridades canónicas y devuelve el paquete a verificación.

## Después de aprobar

```text
paquete approved (RV-n)
   │
   ├─ milestone del plan ──────────→ carpeta de compact-change (Mxx)
   ├─ capacidad nueva o enmienda ──→ carpeta de compact-change (Parent: si aplica)
   └─ cambio material ─────────────→ baseline RV-n+1: revisión del impacto + contradicciones globales
```

- La carpeta de cambio declara en su "Canonical Design Impact" qué autoridades toca, y la implementación las actualiza. Un cambio de comportamiento en el PRD agrega o actualiza su fila de la §15 en el mismo cambio.
- compact-change no necesita saber nada de este plugin.
- El estado de cada milestone se lee con el comando que trae la plantilla del plan.
- Lo que cambió después de aprobar:

```bash
git log -1 --format=%H -S'status: approved' -- docs/spec/manifest.yaml
```

```bash
git log --oneline <sha>.. -- docs/product docs/design
```

## Convergencia de review

- Antes de leer el paquete se corren `scripts/check-package.mjs` (dentro de `reviewing-system-design`), los comandos `checks:` del manifest y los validadores oficiales de cada artefacto.
- Hay una **baseline review** completa para la primera aprobación. Una baseline nueva revisa solo la zona de impacto del cambio material más las contradicciones globales.
- Los findings llevan IDs estables y severidad `BLOCKER`, `MAJOR`, `MINOR` o `NOTE`, siempre en inglés.
- Solo `BLOCKER` y `MAJOR` bloquean el plan de construcción.
- Las follow-up reviews verifican findings existentes y regresiones dentro del **impact cone**, sin agregar `MINOR` ni `NOTE` nuevos.
- Máximo 3 ciclos automáticos de reconciliación por baseline. El contador vive solo en `review.md`.
- **Salida de `escalate`:** el usuario elige y queda como decisión en la §15:
  - construir los milestones no afectados (por defecto);
  - aceptar con riesgo, con su cita;
  - recortar alcance.

  En cualquier salida, cada `BLOCKER`/`MAJOR` abierto se anota con los IDs de requisito que afecta, y el plan lo copia al "Detente si" de cada milestone que los cubre (regla única en `writing-build-plan` §3).
- El reviewer nunca modifica fuentes canónicas.
- `review.md` guarda solo la baseline vigente; las anteriores quedan en git.

La aprobación tiene umbral objetivo: cero `BLOCKER`, cero `MAJOR`, cero contradicciones semánticas bloqueantes y ninguna decisión de stakeholder que impida implementar, o la salida de `escalate` registrada con sus hallazgos enrutados. La deuda menor no impide aprobar.

## Artefactos

### Núcleo

```text
docs/
├── product/
│   ├── brief.md
│   └── prd.md
├── spec/
│   └── manifest.yaml
├── design/
│   ├── review.md
│   ├── domain.md
│   ├── architecture/
│   │   ├── architecture.dsl
│   │   ├── quality-attributes.md
│   │   └── adr/
│   ├── data/
│   ├── api/
│   ├── events/
│   └── ux/
└── build/
    └── plan.md
```

`data/`, `api/`, `events/`, `quality-attributes.md` y los prototipos UX son condicionales. `review.md` aparece cuando inicia la revisión y contiene evidencia/estado de workflow, no especificación canónica. El brief es un insumo histórico una vez que existe el PRD.

## Paquete retroactivo

Para un sistema que ya existe:

- se marca el manifest con `nature: retroactive` y `superseded_documents`;
- el código puede ser autoridad, con su snapshot marcado como no autoritativo;
- cada desfase entre código y diseño se lista en el brief con los requisitos que afecta (y el plan lo lleva al "Detente si" del milestone que lo corrige), o se vuelve una decisión en la §15. Nunca es un hallazgo de revisión.

## Reglas de autoridad

- El PRD posee **producto, alcance, usuarios, comportamiento requerido, metas de los NFR y decisiones de producto**.
- Structurizr/C4 posee **estructura técnica y relaciones arquitectónicas**, no objetivos de producto.
- ADR posee **rationale y trade-offs de decisiones técnicas**.
- `quality-attributes.md` posee **la respuesta de diseño a cada NFR y su evidencia**; cita el NFR por ID sin repetir la meta.
- DBML posee **schema persistente**; el PRD no replica columnas/tablas.
- OpenAPI/AsyncAPI poseen **contratos de integración** y su propio semver; el PRD referencia requisitos, no duplica payloads.
- Mermaid posee **flujos**, no decisiones arquitectónicas.
- HTML sirve como **prototipo verificable**, no como arquitectura.
- `manifest.yaml` declara qué fuentes son autoritativas y cuáles no aplican, y solo lleva las claves de su plantilla.
- `review.md` registra findings y ciclos, pero no puede redefinir producto ni arquitectura.
- Ningún artefacto cita la versión de otro.
- Solo una contradicción **semántica material** detiene implementación. Diferencias editoriales, de casing o de representación no se tratan automáticamente como blockers.

## PRD

El PRD de este plugin es deliberadamente más pequeño que un mega-PRD. Conserva:

- problem/purpose;
- users/context;
- goals/non-goals;
- journeys;
- capabilities;
- FR/NFR;
- business rules e invariants;
- constraints;
- MVP, citando los IDs de sus FR;
- success criteria;
- future scope;
- product decisions (§15).

La arquitectura, el schema, los contratos y el orden de implementación viven en artefactos separados. El PRD no lleva versión ni secciones "Cambios desde": su historia queda en git y en las carpetas de cambio.

## Implementación inicial

No ejecutar todo el proyecto en un único prompt. `writing-build-plan` divide el sistema en slices verticales verificables:

```text
M01 -> implement -> verify
M02 -> implement -> verify
M03 -> implement -> verify
```

`compact-change-skills:implementing-change` 2.2+ puede consumir directamente un slice aprobado de este plugin junto con el `manifest.yaml` y las autoridades relevantes. Antes de editar, comprueba que el slice esté completo.

## Principios

- Primero problema y restricciones; después tecnología.
- No inventar decisiones que el usuario o el repositorio/proyecto no hayan aprobado.
- Una fuente de verdad por tipo de decisión.
- Texto versionable y machine-readable cuando existe un estándar mejor que prosa libre.
- Lo mecánico lo revisa un script; el modelo revisa el significado.
- Crear solo los artefactos que reduzcan ambigüedad real.
- No guardar estados que otra fuente ya conoce.
- No mezclar requisitos de producto con elecciones de implementación.
- Diseñar para implementación incremental por slices verticales.
- Separar discovery de defectos, corrección y verificación.
- Aprobar por build readiness objetivo, no por ausencia absoluta de posibles mejoras.
