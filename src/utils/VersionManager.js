/**
 * Version Manager
 * Handles version compatibility and data migration
 */

export class VersionManager {
    constructor() {
        this.currentVersion = '1.0.0';
        this.migrations = new Map();
    }
    
    /**
     * Register a migration function
     * @param {string} fromVersion - Source version
     * @param {string} toVersion - Target version
     * @param {Function} migrationFn - Migration function
     */
    registerMigration(fromVersion, toVersion, migrationFn) {
        const key = `${fromVersion}->${toVersion}`;
        this.migrations.set(key, migrationFn);
    }
    
    /**
     * Migrate data from one version to another
     * @param {Object} data - Data to migrate
     * @param {string} dataVersion - Current data version
     * @returns {Object} - Migrated data
     */
    async migrate(data, dataVersion) {
        if (dataVersion === this.currentVersion) {
            return data;
        }
        
        const path = this.findMigrationPath(dataVersion, this.currentVersion);
        
        if (!path) {
            throw new Error(`No migration path from ${dataVersion} to ${this.currentVersion}`);
        }
        
        let migratedData = { ...data };
        
        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];
            const migrationKey = `${from}->${to}`;
            const migrationFn = this.migrations.get(migrationKey);
            
            if (migrationFn) {
                migratedData = await migrationFn(migratedData);
                migratedData.__version = to;
            }
        }
        
        return migratedData;
    }
    
    /**
     * Find migration path between versions
     * @param {string} from - Source version
     * @param {string} to - Target version
     * @returns {Array|null} - Version path or null
     */
    findMigrationPath(from, to) {
        // Simple implementation - assumes linear version progression
        const versions = this.getVersionSequence();
        const fromIndex = versions.indexOf(from);
        const toIndex = versions.indexOf(to);
        
        if (fromIndex === -1 || toIndex === -1) {
            return null;
        }
        
        return versions.slice(fromIndex, toIndex + 1);
    }
    
    /**
     * Get version sequence
     * @returns {Array}
     */
    getVersionSequence() {
        return ['0.1.0', '0.2.0', '0.5.0', '1.0.0'];
    }
    
    /**
     * Check if data is compatible
     * @param {Object} data - Data with version
     * @returns {boolean}
     */
    isCompatible(data) {
        if (!data.__version) {
            return false;
        }
        
        const dataVersion = this.parseVersion(data.__version);
        const currentVersion = this.parseVersion(this.currentVersion);
        
        // Major version must match
        return dataVersion.major === currentVersion.major;
    }
    
    /**
     * Parse version string
     * @param {string} version - Version string
     * @returns {Object}
     */
    parseVersion(version) {
        const parts = version.split('.').map(Number);
        return {
            major: parts[0] || 0,
            minor: parts[1] || 0,
            patch: parts[2] || 0
        };
    }
    
    /**
     * Compare versions
     * @param {string} v1 - Version 1
     * @param {string} v2 - Version 2
     * @returns {number} - -1 if v1 < v2, 0 if equal, 1 if v1 > v2
     */
    compareVersions(v1, v2) {
        const ver1 = this.parseVersion(v1);
        const ver2 = this.parseVersion(v2);
        
        if (ver1.major !== ver2.major) {
            return ver1.major - ver2.major;
        }
        if (ver1.minor !== ver2.minor) {
            return ver1.minor - ver2.minor;
        }
        return ver1.patch - ver2.patch;
    }
    
    /**
     * Add version info to data
     * @param {Object} data - Data object
     * @returns {Object}
     */
    addVersionInfo(data) {
        return {
            ...data,
            __version: this.currentVersion,
            __timestamp: Date.now()
        };
    }
}

// Create singleton instance
const versionManager = new VersionManager();

// Register example migrations
versionManager.registerMigration('0.1.0', '0.2.0', (data) => {
    // Example: Add new field
    return { ...data, newField: 'default' };
});

versionManager.registerMigration('0.2.0', '0.5.0', (data) => {
    // Example: Rename field
    const { oldField, ...rest } = data;
    return { ...rest, renamedField: oldField };
});

versionManager.registerMigration('0.5.0', '1.0.0', (data) => {
    // Example: Data structure change
    return {
        ...data,
        config: {
            ...data.config,
            version: '1.0.0'
        }
    };
});

export default versionManager;
