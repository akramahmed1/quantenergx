import { PluginInterface } from '../types/index';
import winston from 'winston';
import path from 'path';
import fs from 'fs/promises';

/**
 * Plugin Manager - Handles dynamic loading and management of plugin modules
 * Supports data sources, analytics, notifications, and compliance plugins
 */
export class PluginManager {
  private plugins: Map<string, PluginInterface> = new Map();
  private pluginConfigs: Map<string, PluginConfig> = new Map();
  private logger: winston.Logger;
  private pluginsDirectory: string;

  constructor(logger: winston.Logger, pluginsDir?: string) {
    this.logger = logger;
    this.pluginsDirectory = pluginsDir || path.join(__dirname, 'modules');
  }

  /**
   * Initialize plugin manager and load all plugins
   */
  async initialize(): Promise<void> {
    try {
      await this.ensurePluginsDirectory();
      await this.loadPluginConfigurations();
      await this.loadPlugins();

      this.logger.info(`Plugin manager initialized with ${this.plugins.size} plugins`);
    } catch (error) {
      this.logger.error('Failed to initialize plugin manager:', error);
      throw error;
    }
  }

  /**
   * Ensure plugins directory exists
   */
  private async ensurePluginsDirectory(): Promise<void> {
    try {
      await fs.access(this.pluginsDirectory);
    } catch {
      await fs.mkdir(this.pluginsDirectory, { recursive: true });
      this.logger.info(`Created plugins directory: ${this.pluginsDirectory}`);
    }
  }

  /**
   * Load plugin configurations from JSON files
   */
  private async loadPluginConfigurations(): Promise<void> {
    try {
      const configPath = path.join(this.pluginsDirectory, 'plugin-config.json');

      try {
        const configData = await fs.readFile(configPath, 'utf-8');
        const configs = JSON.parse(configData);

        for (const [name, config] of Object.entries(configs)) {
          this.pluginConfigs.set(name, config as PluginConfig);
        }
      } catch {
        // Create default configuration if none exists
        await this.createDefaultPluginConfig(configPath);
      }
    } catch (error) {
      this.logger.error('Failed to load plugin configurations:', error);
    }
  }

  /**
   * Create default plugin configuration
   */
  private async createDefaultPluginConfig(configPath: string): Promise<void> {
    const defaultConfig = {
      'sample-data-source': {
        enabled: true,
        type: 'data_source',
        version: '1.0.0',
        settings: {
          updateInterval: 30000,
          retryAttempts: 3,
        },
      },
      'basic-analytics': {
        enabled: true,
        type: 'analytics',
        version: '1.0.0',
        settings: {
          windowSize: 100,
          smoothingFactor: 0.3,
        },
      },
      'email-notifications': {
        enabled: false,
        type: 'notification',
        version: '1.0.0',
        settings: {
          smtpHost: 'localhost',
          smtpPort: 587,
        },
      },
    };

    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    this.logger.info('Created default plugin configuration');
  }

  /**
   * Load all enabled plugins
   */
  private async loadPlugins(): Promise<void> {
    for (const [name, config] of this.pluginConfigs) {
      if (config.enabled) {
        try {
          await this.loadPlugin(name, config);
        } catch (error) {
          this.logger.error(`Failed to load plugin ${name}:`, error);
        }
      }
    }
  }

  /**
   * Load a specific plugin
   */
  private async loadPlugin(name: string, config: PluginConfig): Promise<void> {
    try {
      const pluginPath = path.join(this.pluginsDirectory, name);

      // Check if plugin exists
      try {
        await fs.access(pluginPath);
      } catch {
        // Create sample plugin if it doesn't exist
        await this.createSamplePlugin(name, config);
      }

      // Dynamically import the plugin
      const pluginModule = await import(pluginPath);
      const PluginClass = pluginModule.default || pluginModule[name];

      if (!PluginClass) {
        throw new Error(`Plugin class not found in ${pluginPath}`);
      }

      // Instantiate and initialize the plugin
      const plugin: PluginInterface = new PluginClass(config.settings, this.logger);

      // Validate plugin interface
      this.validatePluginInterface(plugin);

      await plugin.initialize();

      this.plugins.set(name, plugin);

      this.logger.info(`Plugin loaded successfully: ${name}`, {
        type: plugin.type,
        version: plugin.version,
      });
    } catch (error) {
      this.logger.error(`Failed to load plugin ${name}:`, error);
      throw error;
    }
  }

  /**
   * Validate that plugin implements required interface
   */
  private validatePluginInterface(plugin: any): void {
    const requiredMethods = ['initialize', 'execute', 'cleanup'];
    const requiredProperties = ['name', 'version', 'type'];

    for (const method of requiredMethods) {
      if (typeof plugin[method] !== 'function') {
        throw new Error(`Plugin missing required method: ${method}`);
      }
    }

    for (const property of requiredProperties) {
      if (!plugin[property]) {
        throw new Error(`Plugin missing required property: ${property}`);
      }
    }
  }

  /**
   * Create a sample plugin file
   */
  private async createSamplePlugin(name: string, config: PluginConfig): Promise<void> {
    const pluginTemplate = this.generatePluginTemplate(name, config);
    const pluginPath = path.join(this.pluginsDirectory, `${name}.ts`);

    await fs.writeFile(pluginPath, pluginTemplate);
    this.logger.info(`Created sample plugin: ${name}`);
  }

  /**
   * Generate plugin template based on type
   */
  private generatePluginTemplate(name: string, config: PluginConfig): string {
    const className = name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    return `import { PluginInterface } from '@types/index';
import winston from 'winston';

/**
 * ${className} Plugin
 * Type: ${config.type}
 * Auto-generated plugin template
 */
export default class ${className}Plugin implements PluginInterface {
  public readonly name = '${name}';
  public readonly version = '${config.version}';
  public readonly type = '${config.type}' as const;

  private settings: any;
  private logger: winston.Logger;
  private isInitialized = false;

  constructor(settings: any, logger: winston.Logger) {
    this.settings = settings;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info(\`Initializing plugin: \${this.name}\`);
      
      // Plugin-specific initialization logic here
      ${this.getInitializationCode(config.type)}
      
      this.isInitialized = true;
      this.logger.info(\`Plugin initialized successfully: \${this.name}\`);
    } catch (error) {
      this.logger.error(\`Failed to initialize plugin \${this.name}:\`, error);
      throw error;
    }
  }

  async execute(input: any): Promise<any> {
    if (!this.isInitialized) {
      throw new Error(\`Plugin \${this.name} not initialized\`);
    }

    try {
      this.logger.debug(\`Executing plugin: \${this.name}\`, { input });
      
      // Plugin-specific execution logic here
      ${this.getExecutionCode(config.type)}
      
      return result;
    } catch (error) {
      this.logger.error(\`Plugin execution failed \${this.name}:\`, error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.logger.info(\`Cleaning up plugin: \${this.name}\`);
      
      // Plugin-specific cleanup logic here
      ${this.getCleanupCode(config.type)}
      
      this.isInitialized = false;
      this.logger.info(\`Plugin cleanup completed: \${this.name}\`);
    } catch (error) {
      this.logger.error(\`Plugin cleanup failed \${this.name}:\`, error);
    }
  }
}`;
  }

  /**
   * Get initialization code based on plugin type
   */
  private getInitializationCode(type: string): string {
    switch (type) {
      case 'data_source':
        return `// Setup data source connections
      // Configure polling intervals
      // Validate data source availability`;

      case 'analytics':
        return `// Initialize analytics models
      // Setup computation engines
      // Load historical data if needed`;

      case 'notification':
        return `// Setup notification channels
      // Validate credentials
      // Test connectivity`;

      case 'compliance':
        return `// Load compliance rules
      // Setup monitoring systems
      // Initialize audit logging`;

      default:
        return '// Plugin-specific initialization';
    }
  }

  /**
   * Get execution code based on plugin type
   */
  private getExecutionCode(type: string): string {
    switch (type) {
      case 'data_source':
        return `const result = {
        data: input.query ? await this.fetchData(input.query) : [],
        timestamp: new Date(),
        source: this.name
      };`;

      case 'analytics':
        return `const result = {
        analysis: await this.performAnalysis(input.data),
        confidence: 0.85,
        timestamp: new Date()
      };`;

      case 'notification':
        return `const result = {
        sent: await this.sendNotification(input.message, input.recipients),
        timestamp: new Date(),
        channel: this.settings.channel || 'default'
      };`;

      case 'compliance':
        return `const result = {
        compliant: await this.checkCompliance(input.transaction),
        violations: [],
        timestamp: new Date()
      };`;

      default:
        return `const result = { processed: true, input, timestamp: new Date() };`;
    }
  }

  /**
   * Get cleanup code based on plugin type
   */
  private getCleanupCode(type: string): string {
    switch (type) {
      case 'data_source':
        return `// Close database connections
      // Stop polling timers
      // Clear cached data`;

      case 'analytics':
        return `// Save analytics state
      // Close model connections
      // Clear computation caches`;

      case 'notification':
        return `// Close notification channels
      // Flush pending notifications
      // Clear credential caches`;

      case 'compliance':
        return `// Save audit logs
      // Close monitoring connections
      // Archive compliance data`;

      default:
        return '// Plugin-specific cleanup';
    }
  }

  /**
   * Execute plugin by name
   */
  async executePlugin(name: string, input: any): Promise<any> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    try {
      const result = await plugin.execute(input);

      this.logger.debug(`Plugin executed successfully: ${name}`, {
        input: typeof input,
        output: typeof result,
      });

      return result;
    } catch (error) {
      this.logger.error(`Plugin execution failed: ${name}`, error);
      throw error;
    }
  }

  /**
   * Get all plugins of a specific type
   */
  getPluginsByType(type: PluginInterface['type']): PluginInterface[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.type === type);
  }

  /**
   * Get plugin information
   */
  getPluginInfo(name: string): { plugin: PluginInterface; config: PluginConfig } | null {
    const plugin = this.plugins.get(name);
    const config = this.pluginConfigs.get(name);

    if (plugin && config) {
      return { plugin, config };
    }

    return null;
  }

  /**
   * List all loaded plugins
   */
  listPlugins(): Array<{ name: string; type: string; version: string; enabled: boolean }> {
    return Array.from(this.pluginConfigs.entries()).map(([name, config]) => ({
      name,
      type: config.type,
      version: config.version,
      enabled: config.enabled && this.plugins.has(name),
    }));
  }

  /**
   * Gracefully shutdown all plugins
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down plugin manager...');

    const cleanupPromises = Array.from(this.plugins.values()).map(async plugin => {
      try {
        await plugin.cleanup();
      } catch (error) {
        this.logger.error(`Failed to cleanup plugin ${plugin.name}:`, error);
      }
    });

    await Promise.allSettled(cleanupPromises);
    this.plugins.clear();

    this.logger.info('Plugin manager shutdown complete');
  }
}

/**
 * Plugin configuration interface
 */
interface PluginConfig {
  enabled: boolean;
  type: PluginInterface['type'];
  version: string;
  settings: Record<string, any>;
}
