const os = require('os');
const EventEmitter = require('events');

class SystemMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            memoryThreshold: config.memoryThreshold || 80, // Percentage
            processThreshold: config.processThreshold || 50,
            eventQueueThreshold: config.eventQueueThreshold || 1000,
            checkInterval: config.checkInterval || 5000, // 5 seconds
        };

        this.eventQueue = [];
        this.processCount = 0;
        this.isRunning = false;
        this.alerts = [];
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.monitoringInterval = setInterval(() => this.check(), this.config.checkInterval);
        console.log('System monitoring started');
    }

    stop() {
        if (!this.isRunning) return;
        clearInterval(this.monitoringInterval);
        this.isRunning = false;
        console.log('System monitoring stopped');
    }

    check() {
        this.checkMemory();
        this.checkProcesses();
        this.checkEventQueue();
    }

    checkMemory() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMemPercent = ((totalMem - freeMem) / totalMem) * 100;

        if (usedMemPercent > this.config.memoryThreshold) {
            this.alert('memory', `Memory usage critical: ${usedMemPercent.toFixed(2)}%`);
        }

        this.emit('memory', {
            total: totalMem,
            free: freeMem,
            used: totalMem - freeMem,
            percentage: usedMemPercent
        });
    }

    checkProcesses() {
        // Simple process count for now
        // In a real implementation, we'd want to track specific processes
        const processes = Object.keys(process._getActiveHandles()).length;

        if (processes > this.config.processThreshold) {
            this.alert('process', `Process count critical: ${processes}`);
        }

        this.emit('processes', {
            count: processes,
            threshold: this.config.processThreshold
        });
    }

    checkEventQueue() {
        // Get event loop lag as a proxy for queue size
        const start = Date.now();
        setImmediate(() => {
            const lag = Date.now() - start;
            if (lag > 100) { // More than 100ms lag
                this.alert('eventLoop', `Event loop lag critical: ${lag}ms`);
            }
            this.emit('eventLoop', { lag });
        });
    }

    alert(type, message) {
        const alert = {
            type,
            message,
            timestamp: new Date(),
        };

        this.alerts.push(alert);
        this.emit('alert', alert);

        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
            this.alerts.shift();
        }

        console.error(`[ALERT] ${message}`);
    }

    getMetrics() {
        return {
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
            },
            processes: {
                count: Object.keys(process._getActiveHandles()).length,
                threshold: this.config.processThreshold
            },
            alerts: this.alerts.slice(-10), // Last 10 alerts
            uptime: process.uptime()
        };
    }
}

// Create and export monitor instance
const monitor = new SystemMonitor({
    memoryThreshold: 80,    // Alert at 80% memory usage
    processThreshold: 50,   // Alert at 50 active processes
    eventQueueThreshold: 1000,
    checkInterval: 5000     // Check every 5 seconds
});

// Export both the class and a singleton instance
module.exports = {
    SystemMonitor,
    monitor
};

// If running directly, start monitoring
if (require.main === module) {
    monitor.start();

    // Example event handlers
    monitor.on('alert', (alert) => {
        console.error(`[${alert.timestamp.toISOString()}] ${alert.type}: ${alert.message}`);
    });

    monitor.on('memory', (stats) => {
        console.log(`Memory Usage: ${stats.percentage.toFixed(2)}%`);
    });

    monitor.on('processes', (stats) => {
        console.log(`Active Processes: ${stats.count}`);
    });

    monitor.on('eventLoop', (stats) => {
        console.log(`Event Loop Lag: ${stats.lag}ms`);
    });
}
