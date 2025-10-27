# StevStore — Tienda Demo (Maquetación ADSO)

Proyecto de maquetación y consumo de API realizado como actividad del programa ADSO (SENA). Construido con HTML, CSS y JavaScript (Vanilla), servido y desarrollado con Vite, y respaldado por Supabase como backend mínimo para categorías, productos y pedidos.

## Contenido
- Descripción del proyecto
- Características
- Tecnologías usadas
- Instrucciones rápidas (instalación y desarrollo)
- Backend (script SQL para Supabase)
- Variables de entorno
- Estructura del proyecto
- Créditos

## Descripción

Este repositorio contiene una tienda online parecida a la del proyecto que se va a implementar sobre articulos del hogar —interfaz responsiva y dinámica— que muestra cómo maquetar componentes, consumir datos desde un backend (Supabase) y ofrecer experiencia de carrito de compras. El objetivo principal es demostrar buenas prácticas en la maquetación, organización del código y consumo de un backend ligero usando JavaScript puro (sin frameworks frontend).

## Características
- Página principal con hero, productos destacados y grid de productos.
- Slider horizontal para productos destacados (táctil y con controles).
- Filtro/ordenamiento básico de productos.
- Carrito de compras persistente (localStorage) y flujo de checkout (crea pedidos en Supabase).
- Backend en Supabase con tablas para categorías, productos, pedidos y order_items.

## Tecnologías
- HTML, CSS (vanilla)
- JavaScript (ES Modules, Vanilla)
- Vite (dev server / build)
- Supabase (Postgres, autenticación y API)
- Dependencias: `@supabase/supabase-js`

## Requisitos previos
- Node.js (v16+ recomendado)
- Cuenta en Supabase
- Git (opcional)

## Instalación y desarrollo (PowerShell)

Abrir PowerShell en la carpeta del proyecto y ejecutar:

```powershell
# clonar
git clone <repo-url>
cd ecommerce

# instalar dependencias
npm install

# crear archivo .env.local o configurar variables de entorno
# VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# levantar servidor de desarrollo
npm run dev
```

Luego abrir la URL que Vite indica (por defecto `http://localhost:5173`).

## Variables de entorno
Crea un archivo `.env` o `.env.local` en el root del proyecto con las siguientes variables:

Si alguien desea usar las variables de entorno SUPABASE te las proporcina, pero toca
pasarle el archivo .env porque los productos cargan desde la base de datos de PostGres


```env
VITE_SUPABASE_URL=https://tu-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu_anonymous_key...
```

Estas variables son usadas por `src/main.js` para instanciar el cliente de Supabase.

## Backend — Script SQL (Supabase)
Puedes pegar este script en la sección SQL del panel de Supabase (SQL Editor) para crear las tablas y datos de ejemplo.

```sql
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) NOT NULL,
  image_url text NOT NULL,
  stock integer DEFAULT 0,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL,
  price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies para categories (lectura publica)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- RLS Policies para products (lectura publica)
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

-- RLS Policies for orders (solo insertar para crear nuevas ordenes)
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- RLS Policies for order_items (solo insertar para agregar items a una orden)
CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- Insertar categorias de ejemplo
INSERT INTO categories (name, slug) VALUES
  ('Electrónica', 'electronica'),
  ('Ropa', 'ropa'),
  ('Hogar', 'hogar'),
  ('Deportes', 'deportes')
ON CONFLICT (slug) DO NOTHING;

-- Insertar productos de ejemplo
INSERT INTO products (category_id, name, description, price, image_url, stock, featured)
SELECT 
  (SELECT id FROM categories WHERE slug = 'electronica'),
  'Auriculares Bluetooth',
  'Auriculares inalámbricos con cancelación de ruido y 30 horas de batería',
  79.99,
  'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800',
  50,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Auriculares Bluetooth');


```


## Rutas y comportamiento del frontend
- `index.html` — punto de entrada, contiene las secciones: hero, productos destacados (slider), todos los productos, modales y footer.
- `src/main.js` — lógica principal: carga de categorías y productos desde Supabase, renderizado dinámico, manejo de carrito y checkout.
- `src/style.css` — estilos globales y componentes (hero, grids, slider, modales, footer).

## Cómo funciona el slider de "Productos Destacados"
- El frontend filtra los productos con la propiedad `featured = true` desde Supabase y los renderiza dentro de un contenedor horizontal (`featuredGrid`).
- Hay botones prev/next que desplazan el contenedor con `scrollBy` y soporte táctil para dispositivos móviles.

## Despliegue

```powershell
npm run build
```



## Contribuciones
Este proyecto es una actividad académica; si quieres sugerir mejoras, abrir issues o enviar PRs con mejoras de maquetación, accesibilidad o rendimiento, son bienvenidas.

## Créditos
Desarrollado por Henry Steeven Jaimes Bastos — Estudiante ADSO, SENA.

---


