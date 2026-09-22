# Clase vs Interfaz (desde cero)

## La idea en una frase

- **Interfaz**: describe cómo se ve algo. Como la ficha de un carnet.
- **Clase**: construye la cosa de verdad y le enseña a hacer cosas. Como la persona con el carnet en la mano.

## Analogía: receta de cocina

Imagina una receta de panqueques escrita en un papel:

- El **papel con la receta** es la **interfaz**: dice qué ingredientes lleva (2 huevos, 1 taza de leche), pero no puedes comerte el papel.
- **Cocinar la receta** es la **clase**: produce panqueques reales que sí puedes comer, doblar, servir.

En programación pasa igual: la interfaz describe, la clase fabrica.

## Interfaz: solo describe la forma

Una interfaz dice "todo objeto de este tipo tiene estos datos", y nada más. No hace nada, no crea nada.

```ts
// Interfaz: la "ficha" de un usuario
interface UsuarioProps {
  nombre: string;
  email: string;
}
```

Esto NO crea ningún usuario. Solo avisa al programador (y al editor de código): "si dices que algo es un `UsuarioProps`, más te vale que tenga `nombre` y `email`".

Si intentas usarla como si fuera un objeto, falla:

```ts
const u = new UsuarioProps(); // ❌ ERROR: la interfaz no se puede "usar"
```

La interfaz desaparece cuando el programa se convierte a código final (compilar). Es solo ayuda para no equivocarse escribiendo.

## Clase: fabrica objetos de verdad

Una clase es un **molde** que crea objetos reales, con datos Y acciones.

```ts
// Clase: el "molde" para fabricar usuarios
class Usuario {
  nombre: string;
  email: string;

  // El constructor es la "línea de partida":
  // recibe los datos y arma el objeto
  constructor(nombre: string, email: string) {
    this.nombre = nombre;
    this.email = email;
  }

  // Los métodos son "cosas que sabe hacer"
  saludar(): string {
    return `Hola, soy ${this.nombre}`;
  }
}

// Fabricar un usuario de verdad:
const u = new Usuario("Ana", "ana@duoc.cl");
console.log(u.saludar()); // "Hola, soy Ana" ✅
```

`new` = "fabrica uno nuevo usando el molde". Cada objeto guarda sus propios datos.

## Comparación lado a lado

| | Interfaz | Clase |
|---|---|---|
| ¿Crea objetos? | No | Sí (con `new`) |
| ¿Tiene acciones (métodos)? | No | Sí |
| ¿Existe al correr el programa? | No, se borra al compilar | Sí |
| ¿Para qué sirve? | Describir la forma de los datos | Fabricar cosas + ponerles reglas |

## Juntas: la clase cumple la interfaz

Lo normal es usar ambas: la interfaz pone el contrato y la clase lo cumple.

```ts
interface CuentaProps {
  email: string;
  clave: string;
}

class Cuenta implements CuentaProps {
  email: string;
  clave: string;

  constructor(email: string, clave: string) {
    this.email = email;
    this.clave = clave;
  }
}
```

`implements` = "prometo tener todo lo que pide la ficha". Si falta algo, el editor avisa antes de correr el programa.

## Herencia: `extends` (tu caso Cuenta → Usuario)

Una clase puede **heredar** de otra: recibe todo lo de la madre y suma lo suyo. Como decir "un Usuario ES una Cuenta, con datos extra".

```ts
class Cuenta {
  email: string;
  bloqueado: boolean;

  constructor(email: string) {
    this.email = email;
    this.bloqueado = false;
  }

  bloquear(motivo: string): void {
    this.bloqueado = true;
    console.log(`Cuenta ${this.email} bloqueada: ${motivo}`);
  }
}

class Usuario extends Cuenta {
  nombre: string; // dato extra, solo del usuario

  constructor(email: string, nombre: string) {
    super(email); // primero se arma la parte "Cuenta"
    this.nombre = nombre;
  }
}

const u = new Usuario("ana@duoc.cl", "Ana");
u.bloquear("spam"); // ✅ funciona: lo heredó de Cuenta
console.log(u.nombre); // "Ana"
```

Las interfaces también heredan forma con `extends`, pero solo copian la descripción (sin acciones):

```ts
interface BaseProps {
  creado: Date;
}

interface CuentaProps extends BaseProps {
  email: string;
}
// CuentaProps ahora exige: creado + email
```

Tu cadena completa se lee así:

- `BaseExtra extends Base` → la ficha suma auditoría + bloqueo.
- `Cuenta extends BaseExtra` → el molde suma email, clave, teléfono.
- `Usuario extends Cuenta` → el molde suma nombre, run, rol, sede.

## El truco `instanceof` y `fromJSON`

Cuando los datos llegan de internet (backend), vienen como texto plano: tienen los campos, pero NO son objetos de la clase (no saben hacer nada).

```ts
const plano = { nombre: "Ana", email: "ana@duoc.cl" };

console.log(plano instanceof Usuario); // false ❌
// Tiene la forma, pero no salió del molde.
```

Por eso existe `fromJSON`: toma el dato plano y lo mete al molde para fabricar el objeto real.

```ts
const real = Usuario.fromJSON(plano);
console.log(real instanceof Usuario); // true ✅
console.log(real.saludar()); // ahora sí sabe saludar
```

## Resumen para recordar

1. **Interfaz** = ficha que describe. No fabrica.
2. **Clase** = molde que fabrica objetos con datos y acciones.
3. **`implements`** = la clase promete cumplir la ficha.
4. **`extends`** = hereda todo lo de la madre y suma lo propio.
5. **Dato de internet** = plano, sin acciones. **`fromJSON`** = lo convierte en objeto real.
