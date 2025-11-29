/**
 * Spanish Translations
 */

export const es = {
    common: {
        loading: 'Cargando...',
        error: 'Error',
        ok: 'Aceptar',
        cancel: 'Cancelar',
        save: 'Guardar',
        reset: 'Restablecer',
        close: 'Cerrar'
    },
    
    hud: {
        altitude: 'Altitud',
        speed: 'Velocidad',
        throttle: 'Acelerador',
        heading: 'Rumbo',
        pitch: 'Cabeceo',
        roll: 'Alabeo',
        fps: 'FPS',
        stall: 'ADVERTENCIA DE PÉRDIDA'
    },
    
    controls: {
        pitchUp: 'Cabeceo Arriba',
        pitchDown: 'Cabeceo Abajo',
        rollLeft: 'Alabeo Izquierda',
        rollRight: 'Alabeo Derecha',
        yawLeft: 'Guiñada Izquierda',
        yawRight: 'Guiñada Derecha',
        increaseThrottle: 'Aumentar Potencia',
        decreaseThrottle: 'Disminuir Potencia',
        pause: 'Pausa',
        resetCamera: 'Restablecer Cámara',
        resetAircraft: 'Restablecer Aeronave'
    },
    
    menu: {
        resume: 'Reanudar',
        settings: 'Configuración',
        controls: 'Controles',
        graphics: 'Gráficos',
        audio: 'Audio',
        language: 'Idioma',
        mainMenu: 'Menú Principal',
        quit: 'Salir'
    },
    
    settings: {
        quality: {
            title: 'Calidad Gráfica',
            low: 'Baja',
            medium: 'Media',
            high: 'Alta',
            ultra: 'Ultra'
        },
        shadows: 'Sombras',
        antialiasing: 'Anti-aliasing',
        postProcessing: 'Post-procesamiento',
        fov: 'Campo de Visión',
        sensitivity: 'Sensibilidad del Ratón'
    },
    
    game: {
        paused: 'Pausado',
        crashed: 'Aeronave Estrellada',
        landing: 'Aterrizando',
        takeoff: 'Despegando',
        flying: 'Volando'
    },
    
    network: {
        connecting: 'Conectando al servidor...',
        connected: 'Conectado',
        disconnected: 'Desconectado',
        reconnecting: 'Reconectando...',
        connectionLost: 'Conexión perdida',
        connectionError: 'Error de conexión'
    },
    
    terreno: {
        titulo: 'Configuración del Terreno',
        tamano: 'Tamaño',
        color: 'Color',
        cuadricula: 'Mostrar Cuadrícula',
        googleMaps: {
            titulo: 'Google Maps',
            habilitar: 'Habilitar Google Maps',
            apiKey: 'Clave API',
            latitud: 'Latitud',
            longitud: 'Longitud',
            zoom: 'Nivel de Zoom',
            tipoMapa: 'Tipo de Mapa',
            satelite: 'Satélite',
            calles: 'Calles',
            terreno: 'Terreno',
            hibrido: 'Híbrido',
            cargando: 'Cargando mapa...',
            exito: 'Mapa cargado exitosamente',
            error: 'Error al cargar el mapa',
            actualizar: 'Actualizar Coordenadas'
        },
        validacion: {
            campoRequerido: 'Campo requerido faltante',
            tipoInvalido: 'Tipo de dato inválido',
            valorMinimo: 'El valor está por debajo del mínimo permitido',
            valorMaximo: 'El valor excede el máximo permitido',
            configuracionInvalida: 'Configuración del terreno inválida',
            apiKeyRequerida: 'Se requiere una clave API de Google Maps'
        },
        optimizacion: {
            titulo: 'Optimización',
            arbolesRemovidos: 'Árboles removidos para mejor rendimiento',
            usarObjetos: 'Use el sistema de objetos de ENVIRONMENT_CONFIG para vegetación'
        }
    }
};

export default es;
