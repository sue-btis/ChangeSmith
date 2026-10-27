# Ficha de indicador

Cada indicador es un objeto en `indicadores.json`. El expediente y el tablero leen de aquí sus títulos, textos y reglas. Los valores no se escriben aquí: los calcula la consulta `sql`.

```json
{
  "id": "molienda",
  "etapa": "Molienda",
  "pregunta": "¿La planta muele todo lo que puede?",
  "nombre": "Molienda",
  "clase": "principal",
  "bloque": "icos",
  "sistema": null,
  "padre": "icos",
  "formula": "horas con el molino andando entre horas del periodo, por toneladas por hora entre la mejor velocidad demostrada",
  "unidad": "%",
  "unidad_minima": "turno × planta",
  "agregacion": "suma toneladas y horas; recalcula el porcentaje",
  "separar_por": ["planta"],
  "referencia": {
    "tipo": "maximo_fisico",
    "valor": 1,
    "lado": "abajo",
    "regla": "moler todas las horas a la velocidad que la planta superó solo en el 5 % de los días"
  },
  "fuente": "planta",
  "sql": "pipeline/sql/indicadores/molienda.sql",
  "estado": "disponible",
  "falta": null,
  "libro": "investigacion-libro.html#c13"
}
```

| Campo | Valores |
|---|---|
| `clase` | `principal`, `apoyo`, `cuadre`, `consulta` |
| `padre` | `id` del indicador del árbol que este explica; `null` en el ICOS, en la cifra de uso y en los principales fuera de la cadena |
| `formula` | En palabras, como la diría el lector, no en código |
| `agregacion` | Qué se suma al subir de nivel y qué se recalcula |
| `separar_por` | Unidades que nunca se mezclan: `metal`, `planta`, `tipo de pieza` |
| `referencia.tipo` | `maximo_fisico`, `mejor_demostrada` (lo mejor que la unidad ya logró, por ejemplo el percentil 95 de sus días; se usa cuando no existe una capacidad de diseño), `meta_cliente`, `meta_provisional` (su regla no puede salir del mismo dato que mide), `tendencia` (sin máximo: contra el periodo anterior y las otras unidades), `ninguna` (solo en `consulta`) |
| `referencia.lado` | `abajo` (malo quedar debajo; es el valor por omisión), `arriba` o `ambos` (un equilibrio) |
| `referencia.regla` | Obligatoria si es `meta_provisional`: cómo se fijó y por qué es defendible |
| `fuente` | `planta`, `contabilidad`, `calculo` (cruza las dos), con el nombre de los sistemas del cliente en el expediente |
| `bloque` | `icos` (entra al índice o lo explica) o `uso` (uso de los sistemas, al lado del ICOS) |
| `sistema` | Solo en el bloque `uso`: el sistema del cliente que se mide |
| `estado` | `disponible`, `parcial` (va en su etapa con etiqueta), `requiere_dato` (existe y no se anota; va a sugerencias), `adicional` (su proceso lo tiene, ningún sistema lo registra; va a sugerencias) |
| `falta` | Si no está disponible: qué dato existe y no se anota, con la evidencia |
| `libro` | Ancla del capítulo del libro que explica el concepto |
