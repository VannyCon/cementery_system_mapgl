# Cemetery Locator Web App

PHP + MySQL backend with Leaflet.js frontend to add cemetery markers (with optional photo) and draw roads.

## Prerequisites
- PHP 8.0+ with pdo_mysql, fileinfo
- MySQL 5.7+/8.0+
- Apache (XAMPP) or any LAMP stack

## Setup
1. Import `database.sql` into MySQL (creates DB `cemetery_locator`).
2. Update DB creds in `config.php` if needed.
3. Create writable `uploads/` folder in project root.
4. Place project in web root (e.g., `C:\xampp\htdocs\Projects\cementry_locator`).
5. Visit `http://localhost/Projects/cementry_locator/`.

## Usage
- Click "Add Cemetery" → click map → fill form → save.
- Click "Add Road" → draw line → fill form → save.
- Click "Reload" to fetch saved data.
- Set Start and End using the buttons, then click "Find Route" to compute shortest path.
- After a route is computed, click "AR Navigate" to open GPS AR guidance.

## Security
- Prepared statements for DB.
- Input sanitization; photo type JPG/PNG; max 2MB.
- Consider adding an `.htaccess` in `uploads/` to block script execution.

## Deployment & Scaling
- Use HTTPS; configure proper file permissions.
- Respect tile server usage; consider paid tiles with API keys.
- Backups: regular MySQL dumps; store code in Git, exclude `uploads/`.
- Consider CDN for static assets if traffic grows.

## Customization
- Change default map center/zoom in `script.js`.
- Enable polygons by turning on polygon draw and sending `geometry_type=polygon`.

## AR Navigation (beta)
- Requires a mobile device with GPS, compass, camera, and HTTPS context for geolocation on many browsers.
- Flow:
  - Compute a route on `index.html`.
  - Click `AR Navigate` to open `ar.html`.
  - Grant camera and location permissions.
  - Follow on-screen markers: green sphere (start), yellow arrows (path), red sphere (destination).
- Tips:
  - Works best outdoors with clear sky; accuracy depends on GPS quality.
  - If AR button is disabled, compute a route first.

## Troubleshooting
- If images fail, check `uploads/` permissions and path.
- Check PHP error logs for details on 500 errors.
