class ConfigManager {
  constructor() {
    this.config = {
      payment: {
        enablePaymentAwait: false
      }
      // Future configurations can be added here without modifying existing structure
    };
  }

  // Generic getter that supports nested paths
  get(path) {
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    return value;
  }

  // Generic setter that supports nested paths
  set(path, value) {
    const keys = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return true;
  }

  // Specific getters/setters for backward compatibility
  getEnablePaymentAwait() {
    return this.get('payment.enablePaymentAwait');
  }

  setEnablePaymentAwait(value) {
    return this.set('payment.enablePaymentAwait', value);
  }
}

// Singleton instance
const configManager = new ConfigManager();

module.exports = configManager;