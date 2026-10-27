# Sistema visual

El diagrama se dibuja como SVG inline dentro de una página HTML: vectorial, con tema claro y oscuro, y exportable sin pérdida. Nada de librerías ni imágenes externas.

Parte siempre de `assets/plantilla.html`, que ya trae la hoja de estilos, los iconos y los marcadores de flecha. Está armada para arquitectura: en otros tipos conserva la hoja de estilos, los marcadores y el bloque que lee el script de exportación, y reemplaza las zonas y los iconos. Este documento explica **por qué** está armada así, que es lo que necesitas para extenderla sin romperla.

## Lo que decide si el diagrama se ve bien

No es la paleta ni los iconos. Es el **trazado de las flechas**. Un diagrama con líneas que se cruzan, que nacen en un punto ambiguo o que pasan por debajo de una caja se lee como descuidado aunque todo lo demás esté impecable — y peor, se lee mal: una flecha que sale a la altura de la caja equivocada dice algo que no es cierto.

### El componente central irradia

Identifica el componente que habla con todo lo demás. Casi siempre es el backend: recibe del frontend, consulta bases de datos, sale a servicios externos, recibe despliegues.

Colócalo de forma que **cada salida vaya en una dirección distinta**, y ordena las zonas alrededor para que ninguna flecha tenga que cruzarse con otra:

```
                    ┌──────────┐   ← CI/CD entra por la derecha
   frontend  ──────▶│          │──────▶  servicios externos (derecha)
                    │  Backend │
   red interna ◀────│          │
      (izq/abajo)   └────┬─────┘
                         │
                         ▼
                   datos privados (abajo)
```

Si dos flechas necesitan el mismo lado, mueve una zona antes que aceptar el cruce.

### Ortogonal, y por los pasillos

Traza en segmentos horizontales y verticales, nunca en diagonal ni con curvas largas. Usa `<polyline>` con puntos explícitos.

Deja **pasillos** entre zonas —de 20 a 30 píxeles— y haz que los recorridos largos pasen por ahí. El margen entre el borde del contenedor exterior y la primera zona sirve de canal vertical para una flecha que deba cruzar todo el alto sin atravesar nada.

```xml
<!-- baja, cruza por el pasillo, baja por el canal izquierdo, entra -->
<polyline class="ed-int" points="620,424 620,460 42,460 42,1000 78,1000"
          marker-end="url(#ar-orng)"/>
```

Termina las flechas entre 4 y 8 píxeles antes del borde de destino: la punta necesita aire para leerse.

### Las etiquetas llevan halo

Una etiqueta que cruza una línea o un borde queda ilegible. La solución es pintar el contorno del texto con el color del fondo antes que el relleno:

```css
.halo {
  paint-order: stroke;
  stroke: var(--dg-bg);
  stroke-width: 4px;
  stroke-linejoin: round;
}
```

Esto perfora limpiamente lo que haya debajo y libera de tener que encontrar un hueco perfecto para cada texto. Aplícalo a todas las etiquetas de flecha, a los títulos de zona y a las etiquetas que van sobre el borde de un grupo.

### Un atributo, una dimensión

Elige un significado para el borde punteado y respétalo en todo el diagrama. El que funciona: **"fuera del alcance"** — en arquitectura, lo que no forma parte de este despliegue; en relaciones, entidades que no vinieron en los datos o terceros.

En cuanto un borde punteado significa dos cosas distintas —"existente" en un lugar y "opcional" o "agrupador" en otro— el lector deja de confiar en la codificación y tiene que leer cada caja. Es el tipo de error que no se ve al dibujar y salta de inmediato al revisar.

El matiz sí funciona en un caso: una **zona** punteada porque la red es ajena, con una **caja sólida** dentro porque ese recurso concreto sí lo despliegas tú. Se lee bien y dice algo verdadero.

**Cuando necesitas una segunda dimensión, dásela a otro atributo.** El caso típico es distinguir además lo que hay que crear de lo que ya existe. Reparte así:

| Atributo | Dimensión | Valores |
|---|---|---|
| Trazo del borde | Pertenencia | Sólido: dentro de este despliegue · Punteado: fuera |
| Color del borde | Estado | Neutro: existe · Acento: por crear |

Lo que rompe la lectura es que el mismo atributo cargue las dos cosas: si el color ya dice "por crear", el trazo no puede decirlo también en unos lugares y algo distinto en otros. Cuando termines, recorre el diagrama preguntándote de cada borde punteado *"¿esto está fuera del despliegue?"* — si alguno responde que no, esa es la inconsistencia.

Y declara la codificación en el propio diagrama, en una línea junto al título o en la leyenda. Obliga a que sea explícita, y quien revisa puede verificarla sin adivinar.

## Codificación por color

Cada tipo de conexión lleva color y trazo propios, y aparecen en la leyenda. Los nombres son de rol, no de tono, para que el significado sobreviva a un cambio de paleta.

Cada tipo de diagrama define sus roles en su referencia de `tipos/`. Uno es común a todos: **pendiente**, en ámbar sobre el texto, para lo que falta confirmar.

## Tipografía

Dos familias, cada una con un trabajo:

- **Identificadores** (nombres de recursos, códigos, claves) en fuente monoespaciada. Son cosas que alguien va a escribir en un portal, un script o una búsqueda, y la monoespaciada lo comunica sin decirlo.
- **Todo lo demás** en la sans del sistema.

En Windows y Azure, la familia Segoe encaja con el contexto y no requiere descargar nada — importante, porque la política de seguridad de los artefactos bloquea fuentes externas y una fuente que no carga degrada en silencio.

Escala de tamaños, en unidades del `viewBox`:

| Elemento | Tamaño | Peso |
|---|---|---|
| Título de zona | 15.5 | 650 |
| Nombre de recurso | 12.5 | 650 |
| Identificador | 11.5 | 400 |
| Detalle | 11 | 400 |
| Nota | 10.5 | itálica |
| Etiqueta de flecha | 10.5 | itálica |

No bajes de 10.5: al exportar a PNG y reducir para un documento, todo lo menor se vuelve ilegible.

## Rejilla

Trabaja sobre una rejilla explícita. Los desalineamientos a ojo son la mitad de lo que hace que un diagrama se vea improvisado.

- `viewBox` alrededor de `1560 × 1160` para una topología completa. Ajusta el alto según el contenido.
- Columnas: una ancha a la izquierda (≈ 850) y una angosta a la derecha (≈ 570), separadas por un pasillo de 30.
- Cajas de recurso: alto de 62 a 124 según cuántas líneas lleven, con esquinas de radio 7.
- Texto interno: primera línea a 24 del borde superior, luego cada 17 o 18.
- Icono a la izquierda, 40 × 40, con el texto empezando unos 50 a la derecha.

Antes de dar por terminada una zona, verifica que **las dos columnas terminen a la misma altura**. Una columna corta deja un hueco muerto que desequilibra todo, y suele resolverse estirando una zona o moviendo otra.

## Temas claro y oscuro

Define todos los colores como variables en `:root` y estiliza solo a través de ellas. El visor tiene tres estados —claro, oscuro y "el del sistema", que no marca nada— así que hacen falta tres bloques:

```css
:root { /* paleta clara completa */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* solo redefinir variables */ }
}

:root[data-theme="dark"] { /* otra vez, para que el selector explícito gane */ }
```

Nunca declares un color únicamente dentro de un bloque de media query o de `[data-theme]`: en el estado sin marcar no aplica, y la página termina pintando el texto de un tema sobre el fondo del otro. Y dale al `body` un fondo explícito, porque un fondo transparente hereda el del visor.

Para exportar, el script resuelve la paleta clara sobre el elemento raíz del SVG. Por eso todas las variables tienen que estar declaradas en `:root` y no repartidas.

## Verificación antes de entregar

Antes de exportar, recorre esta lista. Detecta lo que se ve mal en una revisión y evita una vuelta completa:

- Ninguna flecha cruza otra, ni pasa por debajo de una caja.
- Cada flecha nace en el borde del componente correcto — no cerca de él.
- Cada etiqueta de flecha está junto a su flecha y no toca otra.
- El punteado significa lo mismo en todo el diagrama.
- Las dos columnas terminan a la misma altura.
- La leyenda cubre todos los trazos usados, y ninguno más.
- Los pendientes están marcados y se distinguen.
- Cada elemento del inventario aparece; ninguna caja está inventada.

Renderiza el PNG y **míralo** antes de entregar. Los solapamientos de texto son invisibles en el código fuente y obvios en la imagen: dos etiquetas contiguas que se tocan, una cadena larga que desborda su caja, un título que choca con una insignia. Un vistazo a la imagen ahorra la vuelta.
