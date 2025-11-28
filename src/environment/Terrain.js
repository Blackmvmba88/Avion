import * as THREE from 'three';

/**
 * Esquema de validación para la configuración del terreno
 */
const ESQUEMA_TERRENO = {
    tamano: { tipo: 'number', requerido: true, min: 100, max: 100000 },
    color: { tipo: 'number', requerido: false },
    mostrarCuadricula: { tipo: 'boolean', requerido: false },
    usarGoogleMaps: { tipo: 'boolean', requerido: false },
    googleMapsApiKey: { tipo: 'string', requerido: false },
    coordenadas: { tipo: 'object', requerido: false }
};

/**
 * Validador de configuración del terreno
 * @param {Object} config - Configuración a validar
 * @returns {Object} - { valido: boolean, errores: Array }
 */
function validarConfiguracion(config) {
    const errores = [];
    
    for (const [clave, reglas] of Object.entries(ESQUEMA_TERRENO)) {
        if (reglas.requerido && !(clave in config)) {
            errores.push(`Campo requerido faltante: ${clave}`);
            continue;
        }
        
        if (clave in config) {
            const valor = config[clave];
            
            // Validación de tipo
            if (reglas.tipo && typeof valor !== reglas.tipo) {
                errores.push(`Tipo inválido para ${clave}: se esperaba ${reglas.tipo}, se obtuvo ${typeof valor}`);
            }
            
            // Validación de rango
            if (reglas.min !== undefined && valor < reglas.min) {
                errores.push(`El valor de ${clave} está por debajo del mínimo: ${valor} < ${reglas.min}`);
            }
            if (reglas.max !== undefined && valor > reglas.max) {
                errores.push(`El valor de ${clave} excede el máximo: ${valor} > ${reglas.max}`);
            }
        }
    }
    
    return {
        valido: errores.length === 0,
        errores
    };
}

/**
 * Terrain - Crea un plano de suelo simple con cuadrícula
 * Optimizado: Sin árboles para mejor rendimiento
 * Soporte para integración con Google Maps
 */
export class Terrain {
    /**
     * Constructor del terreno
     * @param {Object} config - Configuración opcional del terreno
     * @param {number} config.tamano - Tamaño del terreno en unidades (por defecto: 10000)
     * @param {number} config.color - Color del terreno en hexadecimal (por defecto: 0x228b22)
     * @param {boolean} config.mostrarCuadricula - Mostrar cuadrícula de referencia (por defecto: true)
     * @param {boolean} config.usarGoogleMaps - Usar textura de Google Maps (por defecto: false)
     * @param {string} config.googleMapsApiKey - API key de Google Maps (requerido si usarGoogleMaps es true)
     * @param {Object} config.coordenadas - Coordenadas para Google Maps { lat, lng, zoom }
     */
    constructor(config = {}) {
        this.config = {
            tamano: config.tamano || 10000,
            color: config.color || 0x228b22,
            mostrarCuadricula: config.mostrarCuadricula !== false,
            usarGoogleMaps: config.usarGoogleMaps || false,
            googleMapsApiKey: config.googleMapsApiKey || '',
            coordenadas: config.coordenadas || { lat: 40.4168, lng: -3.7038, zoom: 15 }
        };
        
        // Validar configuración
        const resultadoValidacion = this.validar();
        if (!resultadoValidacion.valido) {
            console.warn('Advertencia: Configuración del terreno inválida:', resultadoValidacion.errores);
        }
        
        this.texturaGoogleMaps = null;
        this.group = this.crearTerreno();
    }

    /**
     * Valida la configuración del terreno
     * @returns {Object} - { valido: boolean, errores: Array }
     */
    validar() {
        return validarConfiguracion(this.config);
    }

    /**
     * Crea el terreno
     * @returns {THREE.Group}
     */
    crearTerreno() {
        const group = new THREE.Group();

        // Plano del suelo
        const geometriaTerreno = new THREE.PlaneGeometry(this.config.tamano, this.config.tamano);
        
        let materialTerreno;
        
        if (this.config.usarGoogleMaps && this.config.googleMapsApiKey) {
            // Usar textura de Google Maps
            materialTerreno = this.crearMaterialGoogleMaps();
        } else {
            // Usar color sólido
            materialTerreno = new THREE.MeshPhongMaterial({
                color: this.config.color,
                side: THREE.DoubleSide,
            });
        }
        
        const terreno = new THREE.Mesh(geometriaTerreno, materialTerreno);
        terreno.rotation.x = -Math.PI / 2;
        terreno.receiveShadow = true;
        group.add(terreno);

        // Cuadrícula de referencia visual (opcional)
        if (this.config.mostrarCuadricula) {
            const cuadriculaAyuda = new THREE.GridHelper(
                this.config.tamano, 
                100, 
                0x444444, 
                0x666666
            );
            cuadriculaAyuda.position.y = 0.1;
            group.add(cuadriculaAyuda);
        }

        // NOTA: Los árboles han sido removidos para optimizar el rendimiento
        // Si necesita vegetación, use el sistema de objetos de ENVIRONMENT_CONFIG

        return group;
    }

    /**
     * Crea el material con textura de Google Maps
     * @returns {THREE.MeshPhongMaterial}
     */
    crearMaterialGoogleMaps() {
        const { lat, lng, zoom } = this.config.coordenadas;
        const apiKey = this.config.googleMapsApiKey;
        
        // Construir URL de Google Maps Static API
        const urlMapa = this.construirUrlGoogleMaps(lat, lng, zoom, apiKey);
        
        // Cargar textura
        const cargadorTexturas = new THREE.TextureLoader();
        
        // Material con textura (la textura se carga de forma asíncrona)
        const material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            color: this.config.color // Color de respaldo mientras se carga la textura
        });
        
        // Cargar la textura de forma asíncrona
        cargadorTexturas.load(
            urlMapa,
            (textura) => {
                textura.wrapS = THREE.ClampToEdgeWrapping;
                textura.wrapT = THREE.ClampToEdgeWrapping;
                textura.minFilter = THREE.LinearFilter;
                material.map = textura;
                material.needsUpdate = true;
                this.texturaGoogleMaps = textura;
                console.log('Textura de Google Maps cargada exitosamente');
            },
            undefined,
            (error) => {
                console.error('Error al cargar textura de Google Maps:', error);
            }
        );
        
        return material;
    }

    /**
     * Construye la URL para Google Maps Static API
     * @param {number} lat - Latitud
     * @param {number} lng - Longitud
     * @param {number} zoom - Nivel de zoom (1-21)
     * @param {string} apiKey - API key de Google Maps
     * @returns {string} URL de la imagen del mapa
     */
    construirUrlGoogleMaps(lat, lng, zoom, apiKey) {
        const tamanoImagen = 640; // Tamaño máximo sin pago
        const tipoMapa = 'satellite'; // Tipo de mapa: roadmap, satellite, terrain, hybrid
        
        return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${tamanoImagen}x${tamanoImagen}&maptype=${tipoMapa}&key=${apiKey}`;
    }

    /**
     * Actualiza las coordenadas de Google Maps
     * @param {number} lat - Nueva latitud
     * @param {number} lng - Nueva longitud
     * @param {number} zoom - Nuevo nivel de zoom
     */
    actualizarCoordenadasMapa(lat, lng, zoom) {
        if (!this.config.usarGoogleMaps || !this.config.googleMapsApiKey) {
            console.warn('Google Maps no está habilitado o falta la API key');
            return;
        }
        
        this.config.coordenadas = { lat, lng, zoom };
        
        // Recargar textura
        const urlMapa = this.construirUrlGoogleMaps(lat, lng, zoom, this.config.googleMapsApiKey);
        const cargadorTexturas = new THREE.TextureLoader();
        
        cargadorTexturas.load(
            urlMapa,
            (textura) => {
                // Liberar textura anterior
                if (this.texturaGoogleMaps) {
                    this.texturaGoogleMaps.dispose();
                }
                
                textura.wrapS = THREE.ClampToEdgeWrapping;
                textura.wrapT = THREE.ClampToEdgeWrapping;
                textura.minFilter = THREE.LinearFilter;
                
                // Actualizar material del terreno
                const terreno = this.group.children.find(child => child.isMesh);
                if (terreno && terreno.material) {
                    terreno.material.map = textura;
                    terreno.material.needsUpdate = true;
                }
                
                this.texturaGoogleMaps = textura;
                console.log('Coordenadas del mapa actualizadas exitosamente');
            },
            undefined,
            (error) => {
                console.error('Error al actualizar coordenadas del mapa:', error);
            }
        );
    }

    /**
     * Obtiene el grupo para agregar a la escena
     * @returns {THREE.Group}
     */
    getObject3D() {
        return this.group;
    }

    /**
     * Obtiene la configuración actual del terreno
     * @returns {Object}
     */
    obtenerConfiguracion() {
        return { ...this.config };
    }

    /**
     * Libera los recursos
     */
    dispose() {
        // Liberar textura de Google Maps si existe
        if (this.texturaGoogleMaps) {
            this.texturaGoogleMaps.dispose();
        }
        
        this.group.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (child.material.map) {
                    child.material.map.dispose();
                }
                child.material.dispose();
            }
        });
    }
}

export default Terrain;
