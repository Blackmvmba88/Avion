import * as THREE from 'three';

/**
 * Tipos de mapa disponibles para Google Maps
 */
const TIPOS_MAPA = ['roadmap', 'satellite', 'terrain', 'hybrid'];

/**
 * Límites de coordenadas válidas
 */
const LIMITES_COORDENADAS = {
    lat: { min: -90, max: 90 },
    lng: { min: -180, max: 180 },
    zoom: { min: 1, max: 21 }
};

/**
 * Esquema de validación para la configuración del terreno
 */
const ESQUEMA_TERRENO = {
    tamano: { tipo: 'number', requerido: true, min: 100, max: 100000 },
    color: { tipo: 'number', requerido: false },
    mostrarCuadricula: { tipo: 'boolean', requerido: false },
    usarGoogleMaps: { tipo: 'boolean', requerido: false },
    googleMapsApiKey: { tipo: 'string', requerido: false },
    coordenadas: { tipo: 'object', requerido: false },
    tipoMapa: { tipo: 'string', requerido: false },
    tamanoImagen: { tipo: 'number', requerido: false, min: 100, max: 2048 }
};

/**
 * Valida las coordenadas de Google Maps
 * @param {Object} coordenadas - Coordenadas a validar { lat, lng, zoom }
 * @returns {Object} - { valido: boolean, errores: Array }
 */
function validarCoordenadas(coordenadas) {
    const errores = [];
    
    if (!coordenadas || typeof coordenadas !== 'object') {
        errores.push('Las coordenadas deben ser un objeto');
        return { valido: false, errores };
    }
    
    // Validar latitud
    if (typeof coordenadas.lat !== 'number' || isNaN(coordenadas.lat)) {
        errores.push('La latitud debe ser un número válido');
    } else if (coordenadas.lat < LIMITES_COORDENADAS.lat.min || coordenadas.lat > LIMITES_COORDENADAS.lat.max) {
        errores.push(`La latitud debe estar entre ${LIMITES_COORDENADAS.lat.min} y ${LIMITES_COORDENADAS.lat.max}`);
    }
    
    // Validar longitud
    if (typeof coordenadas.lng !== 'number' || isNaN(coordenadas.lng)) {
        errores.push('La longitud debe ser un número válido');
    } else if (coordenadas.lng < LIMITES_COORDENADAS.lng.min || coordenadas.lng > LIMITES_COORDENADAS.lng.max) {
        errores.push(`La longitud debe estar entre ${LIMITES_COORDENADAS.lng.min} y ${LIMITES_COORDENADAS.lng.max}`);
    }
    
    // Validar zoom
    if (typeof coordenadas.zoom !== 'number' || isNaN(coordenadas.zoom)) {
        errores.push('El zoom debe ser un número válido');
    } else if (coordenadas.zoom < LIMITES_COORDENADAS.zoom.min || coordenadas.zoom > LIMITES_COORDENADAS.zoom.max) {
        errores.push(`El zoom debe estar entre ${LIMITES_COORDENADAS.zoom.min} y ${LIMITES_COORDENADAS.zoom.max}`);
    }
    
    return {
        valido: errores.length === 0,
        errores
    };
}

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
    
    // Validar que si usarGoogleMaps está habilitado, se proporcione la API key
    if (config.usarGoogleMaps && (!config.googleMapsApiKey || config.googleMapsApiKey.trim() === '')) {
        errores.push('Se requiere una clave API de Google Maps cuando usarGoogleMaps está habilitado');
    }
    
    // Validar tipo de mapa
    if (config.tipoMapa && !TIPOS_MAPA.includes(config.tipoMapa)) {
        errores.push(`Tipo de mapa inválido: ${config.tipoMapa}. Opciones válidas: ${TIPOS_MAPA.join(', ')}`);
    }
    
    // Validar coordenadas si se proporcionan
    if (config.coordenadas) {
        const resultadoCoordenadas = validarCoordenadas(config.coordenadas);
        if (!resultadoCoordenadas.valido) {
            errores.push(...resultadoCoordenadas.errores);
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
     * @param {string} config.tipoMapa - Tipo de mapa: 'roadmap', 'satellite', 'terrain', 'hybrid' (por defecto: 'satellite')
     * @param {number} config.tamanoImagen - Tamaño de la imagen del mapa (100-2048, por defecto: 640)
     */
    constructor(config = {}) {
        this.config = {
            tamano: config.tamano || 10000,
            color: config.color || 0x228b22,
            mostrarCuadricula: config.mostrarCuadricula !== false,
            usarGoogleMaps: config.usarGoogleMaps || false,
            googleMapsApiKey: config.googleMapsApiKey || '',
            coordenadas: config.coordenadas || { lat: 40.4168, lng: -3.7038, zoom: 15 },
            tipoMapa: config.tipoMapa || 'satellite',
            tamanoImagen: config.tamanoImagen || 640
        };
        
        // Validar configuración
        const resultadoValidacion = this.validar();
        if (!resultadoValidacion.valido) {
            console.warn('Advertencia: Configuración del terreno inválida:', resultadoValidacion.errores);
        }
        
        this.texturaGoogleMaps = null;
        this.meshTerreno = null; // Referencia directa al mesh del terreno
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
        
        // Guardar referencia al mesh del terreno
        this.meshTerreno = terreno;
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
        // Validar coordenadas antes de construir la URL
        const resultadoValidacion = validarCoordenadas({ lat, lng, zoom });
        if (!resultadoValidacion.valido) {
            console.warn('Coordenadas inválidas:', resultadoValidacion.errores);
            // Usar valores por defecto si hay error
            lat = 40.4168;
            lng = -3.7038;
            zoom = 15;
        }
        
        const tamanoImagen = this.config.tamanoImagen;
        const tipoMapa = this.config.tipoMapa;
        
        return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${tamanoImagen}x${tamanoImagen}&maptype=${tipoMapa}&key=${apiKey}`;
    }

    /**
     * Actualiza las coordenadas de Google Maps
     * @param {number} lat - Nueva latitud
     * @param {number} lng - Nueva longitud
     * @param {number} zoom - Nuevo nivel de zoom
     * @returns {boolean} - true si la actualización fue iniciada, false si hubo error
     */
    actualizarCoordenadasMapa(lat, lng, zoom) {
        if (!this.config.usarGoogleMaps || !this.config.googleMapsApiKey) {
            console.warn('Google Maps no está habilitado o falta la API key');
            return false;
        }
        
        // Validar las nuevas coordenadas
        const resultadoValidacion = validarCoordenadas({ lat, lng, zoom });
        if (!resultadoValidacion.valido) {
            console.warn('Coordenadas inválidas:', resultadoValidacion.errores);
            return false;
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
                
                // Usar referencia directa al mesh del terreno
                if (this.meshTerreno && this.meshTerreno.material) {
                    this.meshTerreno.material.map = textura;
                    this.meshTerreno.material.needsUpdate = true;
                }
                
                this.texturaGoogleMaps = textura;
                console.log('Coordenadas del mapa actualizadas exitosamente');
            },
            undefined,
            (error) => {
                console.error('Error al actualizar coordenadas del mapa:', error);
            }
        );
        
        return true;
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
