# Volleyball Stats Backend

Backend API para la aplicación de estadísticas de voleibol.

## Requisitos en Linux

- Ubuntu/Debian o distro Linux compatible
- Node.js 18 o superior
- npm 9 o superior
- MySQL 8 o superior
- sudo para instalar dependencias del sistema

## 1) Instalar Node.js y npm (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y curl ca-certificates gnupg
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 2) Instalar MySQL local

```bash
sudo apt update
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

## 3) Crear la base de datos local

```bash
sudo mysql -u root -p
```

Dentro de MySQL:

```sql
CREATE DATABASE appstats;
CREATE USER 'root'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON appstats.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> Si prefieres usar un usuario distinto a `root`, crea ese usuario y usa sus credenciales en el archivo `.env`.

## 4) Clonar y preparar el proyecto

```bash
git clone <URL_DEL_REPO_BACKEND>
cd backend
npm install
cp .env.example .env
```

Edita `.env` con tus valores reales:

```env
NODE_ENV=development
HOST=127.0.0.1
DB_PORT=3306
PORT=4001
DB_NAME=appstats
SQLUSER=root
PASS=tu_password
JWT_SECRET=change_this_secret
COOKIE_SECRET=change_this_cookie_secret
```

> Este archivo no se sube a GitHub.

## 5) Ejecutar el backend

```bash
npm run dev
```

La API quedará disponible en:

```text
http://localhost:4001
```

## 6) Si la base de datos está en otro servidor

En `.env` cambia:

```env
HOST=tu-servidor-db
DB_PORT=3306
DB_NAME=appstats
SQLUSER=app_user
PASS=tu_password
```

## 7) Sincronizar la base de datos

La app intenta sincronizar Sequelize al arrancar. Si quieres forzar migraciones/manuales:

```bash
npm run db:migrate
```

## 8) Subir a GitHub

```bash
git init
git add .
git commit -m "Initial backend commit"
git branch -M main
git remote add origin <URL_DEL_REPO_GITHUB>
git push -u origin main
```

## Notas

- El archivo `.env` nunca debe ir a GitHub.
- El frontend de este proyecto apunta por defecto a `http://localhost:4001`.
- Si usas Linux, estos comandos son los correctos para instalar y arrancar la app en un equipo nuevo.
