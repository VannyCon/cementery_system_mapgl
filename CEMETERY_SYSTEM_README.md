# Cemetery Locator & Management System

A comprehensive web-based cemetery management system built with PHP, MySQL, and Leaflet.js for interactive mapping and navigation.

## Features

### 🗺️ Interactive Map System
- **Leaflet.js Integration**: High-quality interactive maps with OpenStreetMap tiles
- **Real-time Drawing**: Add cemeteries, roads, grave plots, and annotations directly on the map
- **Multi-layer Support**: Separate layers for different data types with toggle controls

### 🏛️ Cemetery Management
- **Cemetery Locations**: Add and manage cemetery locations with GPS coordinates
- **Photo Upload**: Attach photos to cemetery records
- **Detailed Information**: Store descriptions and metadata for each cemetery

### 🛣️ Road Network & Navigation
- **Road Mapping**: Draw and manage road networks within cemeteries
- **Route Planning**: Advanced Dijkstra algorithm for optimal pathfinding
- **Graph-based Routing**: Intelligent node snapping and connection system
- **AR Navigation**: Augmented reality navigation for mobile devices

### ⚰️ Burial Records Management
- **Complete Records**: Track deceased information, burial dates, and grave numbers
- **Next of Kin**: Store contact information for family members
- **Search & Filter**: Advanced search capabilities for burial records

### 📍 Grave Plot System
- **Plot Mapping**: Define grave plot boundaries using polygon drawing
- **Status Tracking**: Available, occupied, or reserved status management
- **Visual Indicators**: Color-coded status representation on the map

### 🏷️ Annotation System
- **Custom Labels**: Add custom annotations and labels to map areas
- **Color Coding**: Customizable colors for different annotation types
- **Notes & Descriptions**: Detailed notes for each annotation

### 🔐 Authentication & Authorization
- **JWT-based Authentication**: Secure token-based authentication system
- **Role-based Access**: Admin and staff role permissions
- **Session Management**: Automatic session handling and token refresh

## Technical Stack

### Backend
- **PHP 7.4+**: Server-side scripting
- **MySQL/MariaDB**: Database with spatial data support
- **JWT Authentication**: Firebase PHP-JWT library
- **RESTful API**: Clean API endpoints for all operations

### Frontend
- **Leaflet.js**: Interactive mapping library
- **Leaflet.draw**: Drawing and editing capabilities
- **Bootstrap 5**: Responsive UI framework
- **Vanilla JavaScript**: ES6+ for modern browser support

### Database Schema
- `tbl_users`: User authentication and roles
- `tbl_place_cemeteries`: Cemetery locations and information
- `tbl_roads`: Road network data with JSON coordinates
- `tbl_burial_records`: Complete burial record information
- `tbl_grave_plots`: Grave plot boundaries with spatial data
- `tbl_layer_annotations`: Custom map annotations and labels

## Installation

### Prerequisites
- PHP 7.4 or higher
- MySQL/MariaDB 10.4+
- Apache/Nginx web server
- Composer for PHP dependencies

### Setup Steps

1. **Clone/Copy the project** to your web server directory
2. **Import the database**:
   ```sql
   -- Use the corrected database file
   mysql -u root -p < database/cementery_system_db_fixed.sql
   ```

3. **Install PHP dependencies**:
   ```bash
   composer install
   ```

4. **Configure database connection**:
   Edit `connection/config.php`:
   ```php
   define("H", "localhost");
   define("U", "your_username");
   define("P", "your_password");
   define("DB", "cementery_system_db");
   ```

5. **Set up file permissions**:
   - Ensure write permissions for upload directories
   - Configure PHP upload limits if needed

6. **Access the system**:
   - Navigate to your web server URL
   - Login with default admin credentials:
     - Username: `admin123`
     - Password: `admin123` (change after first login)

## Usage Guide

### Getting Started
1. **Login** with your admin credentials
2. **Add Cemetery Locations**:
   - Click "Add Cemetery" button
   - Click on the map to set location
   - Fill in cemetery details and save

3. **Create Road Network**:
   - Click "Add Road" button
   - Draw roads by clicking points on the map
   - Name the road and associate with a cemetery

4. **Add Grave Plots**:
   - Click "Add Grave Plot" button
   - Draw rectangles to define plot boundaries
   - Set status (available/occupied/reserved)

5. **Record Burial Information**:
   - Use the "Burial Records" tab
   - Add deceased information and grave assignments
   - Link to existing grave plots

### Navigation Features
- **Set Start/End Points**: Click near roads to set navigation points
- **Find Route**: Calculate optimal path between points
- **AR Navigation**: Use mobile AR for real-world navigation
- **My Location**: Use GPS to set current location as start point

### Map Controls
- **Zoom**: Mouse wheel or +/- buttons
- **Pan**: Click and drag to move around
- **Layer Toggle**: Show/hide different data layers
- **Draw Tools**: Integrated drawing tools for all features

## API Endpoints

### Authentication
- `POST /auth/auth.php?action=login` - User login
- `GET /auth/auth.php?action=validate` - Token validation
- `POST /auth/auth.php?action=logout` - User logout

### Cemetery Management
- `GET /api/cemetery.php?action=getMapData` - Get all map data
- `POST /api/cemetery.php` - Create/Update/Delete operations
  - Actions: `createCemetery`, `updateCemetery`, `deleteCemetery`
  - Actions: `createRoad`, `updateRoad`, `deleteRoad`
  - Actions: `createBurialRecord`, `updateBurialRecord`, `deleteBurialRecord`
  - Actions: `createGravePlot`, `updateGravePlot`, `deleteGravePlot`
  - Actions: `createLayerAnnotation`, `updateLayerAnnotation`, `deleteLayerAnnotation`

## Advanced Features

### Routing Algorithm
The system implements a sophisticated routing algorithm:
- **Graph Construction**: Builds a graph from road segments
- **Node Snapping**: Automatically connects nearby road endpoints
- **Dijkstra's Algorithm**: Finds optimal paths between points
- **Real-time Updates**: Recalculates routes when road network changes

### Spatial Data Handling
- **MySQL Spatial Extensions**: Uses native spatial data types
- **WKT Format**: Well-Known Text format for geometry storage
- **Polygon Operations**: Advanced polygon operations for grave plots
- **Coordinate Systems**: Supports latitude/longitude coordinate system

### AR Navigation
- **Device Orientation**: Uses device compass for direction
- **GPS Integration**: Real-time location tracking
- **Visual Indicators**: Augmented reality overlays
- **Progressive Enhancement**: Falls back gracefully on unsupported devices

## Security Features

### Authentication Security
- **Password Hashing**: Bcrypt password hashing
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access**: Granular permission system
- **Session Management**: Automatic token refresh and expiration

### Data Security
- **SQL Injection Protection**: Prepared statements throughout
- **Input Validation**: Server-side validation for all inputs
- **CSRF Protection**: Cross-site request forgery protection
- **File Upload Security**: Secure file upload handling

## Customization

### Adding New Features
1. **Database**: Add new tables or columns as needed
2. **Services**: Extend `CemeteryServices.php` for new operations
3. **API**: Add new endpoints in `api/cemetery.php`
4. **Frontend**: Update JavaScript classes for new functionality

### Styling Customization
- **Bootstrap Themes**: Easy theme switching
- **Custom CSS**: Override styles in custom stylesheets
- **Map Styling**: Customize Leaflet map appearance
- **Icon Sets**: Replace FontAwesome icons as needed

### Configuration Options
- **Map Settings**: Default zoom, center coordinates
- **Upload Limits**: File size and type restrictions
- **Database Settings**: Connection pooling, timeouts
- **Security Settings**: Token expiration, password policies

## Troubleshooting

### Common Issues
1. **Database Connection Errors**:
   - Check database credentials in `config.php`
   - Verify database server is running
   - Ensure database exists and is accessible

2. **Map Not Loading**:
   - Check internet connection for tile loading
   - Verify Leaflet.js CDN accessibility
   - Check browser console for JavaScript errors

3. **File Upload Issues**:
   - Check PHP upload settings (`upload_max_filesize`, `post_max_size`)
   - Verify directory permissions for upload folders
   - Check available disk space

4. **Authentication Problems**:
   - Clear browser cache and cookies
   - Check JWT token expiration settings
   - Verify user credentials in database

### Performance Optimization
- **Database Indexing**: Ensure proper indexes on frequently queried columns
- **Image Optimization**: Compress uploaded images
- **Caching**: Implement caching for frequently accessed data
- **CDN**: Use CDN for static assets in production

## Contributing

### Development Setup
1. Set up local development environment
2. Use the provided database schema
3. Follow PSR coding standards
4. Test all changes thoroughly

### Code Structure
- **Services**: Business logic in service classes
- **API**: RESTful endpoints in api directory
- **Views**: Separate presentation layer
- **Components**: Reusable UI components

## License

This project is developed for educational and practical cemetery management purposes. Please ensure compliance with local regulations and privacy laws when handling burial records and personal information.

## Support

For technical support or feature requests, please refer to the documentation or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: September 2025  
**Compatibility**: PHP 7.4+, MySQL 8.0+, Modern Browsers
