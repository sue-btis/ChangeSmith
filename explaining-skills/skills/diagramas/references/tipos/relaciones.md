# Relaciones

Responde "¿quién con quién?": empresas que se facturan, dueños de plantas, sistemas que se pasan datos.

## Trazado

- Las entidades son cajas. La que se relaciona con más va al centro e irradia (ver `../sistema-visual.md`).
- Una flecha es **un tipo de relación**: ser dueño, operar, facturar. Si hay dos tipos, cada uno lleva su propio trazo en la leyenda.
- La dirección se declara una vez: por ejemplo, la flecha va de quien cobra a quien paga.
- Cada flecha lleva una etiqueta con el qué, el monto y el periodo: "operación de mina · 1,402 M MXN · jun 2022–abr 2025".
- Si el monto importa para la explicación, el grosor es proporcional al monto, y la escala va en la leyenda.

## Pertenencia

Las entidades fuera del alcance (empresas que no vinieron en los datos, terceros) llevan borde punteado. Las que existen pero no se pudieron confirmar van en ámbar con "por confirmar".

## Cuando la relación cambia con el tiempo

No encimes años en el mismo dibujo. Dibuja la relación vigente o la típica, y pon la sucesión en un diagrama de tiempo aparte (`tiempo.md`). Por ejemplo: "una operadora a la vez" va aquí, y el orden OMRT → TAS → MWK → NMS va en la línea de tiempo.
