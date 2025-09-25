// Retro S&P 500 Stock Chart Background
class RetroStockChart {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.data = [];
        this.currentIndex = 0;
        this.isActive = false;
        this.duration = 20000; // 20 seconds
        this.startTime = Date.now();
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.generateMockData();
        this.startAnimation();
    }
    
    createCanvas() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.zIndex = '-1'; // Behind everything
        this.canvas.style.pointerEvents = 'auto'; // Make clickable for INVEST button
        this.canvas.style.opacity = '1.0'; // Full opacity to replace background
        
        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.ctx = this.canvas.getContext('2d');
        
        // Add to body
        document.body.appendChild(this.canvas);
        
        // Add click handler for INVEST button
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        // Initialize button state
        this.buttonClicked = false;
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    generateMockData() {
        // Generate multiple volatile tickers with crazy movements
        this.tickers = [
            { symbol: 'TSLA', baseValue: 200, volatility: 0.15, trend: 0.02 },
            { symbol: 'NVDA', baseValue: 400, volatility: 0.12, trend: 0.03 },
            { symbol: 'GME', baseValue: 25, volatility: 0.25, trend: -0.01 },
            { symbol: 'AMC', baseValue: 8, volatility: 0.3, trend: -0.02 },
            { symbol: 'BTC', baseValue: 45000, volatility: 0.2, trend: 0.01 },
            { symbol: 'ETH', baseValue: 3000, volatility: 0.18, trend: 0.02 },
            { symbol: 'SPY', baseValue: 400, volatility: 0.08, trend: 0.005 },
            { symbol: 'QQQ', baseValue: 350, volatility: 0.1, trend: 0.008 }
        ];
        
        const dataPoints = 300;
        
        this.tickers.forEach(ticker => {
            ticker.data = [];
            let currentValue = ticker.baseValue;
            
            for (let i = 0; i < dataPoints; i++) {
                // Add trend
                currentValue += ticker.trend * currentValue;
                
                // Add volatility with occasional crazy spikes
                let volatility = ticker.volatility;
                
                // Random crazy events
                if (Math.random() < 0.05) { // 5% chance of crazy event
                    volatility *= 3; // Triple volatility
                    if (Math.random() < 0.3) { // 30% chance of crash
                        currentValue *= 0.7; // 30% drop
                    } else if (Math.random() < 0.5) { // 50% chance of pump
                        currentValue *= 1.4; // 40% pump
                    }
                }
                
                // Random walk with high volatility
                const change = (Math.random() - 0.5) * volatility * currentValue;
                currentValue += change;
                
                // Keep values reasonable
                currentValue = Math.max(currentValue, ticker.baseValue * 0.1);
                
                ticker.data.push({
                    value: currentValue,
                    time: i,
                    symbol: ticker.symbol
                });
            }
        });
    }
    
    startAnimation() {
        this.isActive = true;
        this.startTime = Date.now();
        this.animate();
    }
    
    animate() {
        if (!this.isActive) return;
        
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        
        if (progress >= 1) {
            this.destroy();
            return;
        }
        
        // Clear canvas with black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw retro grid
        this.drawGrid();
        
        // Draw stock chart with continuous scrolling
        this.drawStockChart(progress);
        
        // Draw retro elements
        this.drawRetroElements();
        
        // Draw market alerts and crazy events
        this.drawMarketAlerts(progress);
        
        // Draw giant INVEST button
        this.drawInvestButton();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        
        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawStockChart(progress) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = 30;
        
        // Create continuous scrolling effect
        const scrollSpeed = 0.3; // Slower for more detail
        const scrollOffset = (progress * scrollSpeed) % 1;
        
        // Draw multiple charts in a grid
        const chartsPerRow = 2;
        const chartHeight = (height - padding * 2) / 4; // 4 rows
        const chartWidth = (width - padding * 2) / chartsPerRow;
        
        this.tickers.forEach((ticker, index) => {
            const row = Math.floor(index / chartsPerRow);
            const col = index % chartsPerRow;
            
            const chartX = padding + col * chartWidth;
            const chartY = padding + row * chartHeight;
            
            this.drawSingleChart(ticker, chartX, chartY, chartWidth, chartHeight, scrollOffset);
        });
    }
    
    drawSingleChart(ticker, x, y, width, height, scrollOffset) {
        // Calculate visible data range
        const dataPointsPerScreen = Math.floor(width / 3);
        const startIndex = Math.floor(scrollOffset * ticker.data.length);
        const endIndex = Math.min(startIndex + dataPointsPerScreen, ticker.data.length);
        
        if (startIndex >= endIndex) return;
        
        const visibleData = ticker.data.slice(startIndex, endIndex);
        const minValue = Math.min(...visibleData.map(d => d.value));
        const maxValue = Math.max(...visibleData.map(d => d.value));
        const valueRange = maxValue - minValue;
        
        if (valueRange === 0) return;
        
        // Draw chart border
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.5;
        this.ctx.strokeRect(x, y, width, height);
        
        // Draw the line with different colors for volatility
        const volatility = ticker.volatility;
        if (volatility > 0.2) {
            this.ctx.strokeStyle = '#ff0000'; // Red for high volatility
        } else if (volatility > 0.15) {
            this.ctx.strokeStyle = '#ffff00'; // Yellow for medium volatility
        } else {
            this.ctx.strokeStyle = '#00ff00'; // Green for low volatility
        }
        
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.9;
        
        this.ctx.beginPath();
        
        visibleData.forEach((point, index) => {
            const chartX = x + (index / (visibleData.length - 1)) * (width - 10);
            const chartY = y + height - 10 - ((point.value - minValue) / valueRange) * (height - 20);
            
            if (index === 0) {
                this.ctx.moveTo(chartX, chartY);
            } else {
                this.ctx.lineTo(chartX, chartY);
            }
        });
        
        this.ctx.stroke();
        
        // Draw data points for extreme movements
        this.ctx.fillStyle = this.ctx.strokeStyle;
        this.ctx.globalAlpha = 0.7;
        
        visibleData.forEach((point, index) => {
            const chartX = x + (index / (visibleData.length - 1)) * (width - 10);
            const chartY = y + height - 10 - ((point.value - minValue) / valueRange) * (height - 20);
            
            // Only draw points for significant movements
            if (index > 0) {
                const prevValue = visibleData[index - 1].value;
                const changePercent = Math.abs((point.value - prevValue) / prevValue);
                
                if (changePercent > 0.05) { // 5% change
                    this.ctx.beginPath();
                    this.ctx.arc(chartX, chartY, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        });
        
        this.ctx.globalAlpha = 1;
        
        // Draw ticker symbol and current value
        if (visibleData.length > 0) {
            const currentValue = visibleData[visibleData.length - 1].value;
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '12px "Courier New", monospace';
            this.ctx.globalAlpha = 0.9;
            
            // Ticker symbol
            this.ctx.fillText(ticker.symbol, x + 5, y + 15);
            
            // Current value
            this.ctx.fillText(`$${currentValue.toFixed(2)}`, x + 5, y + height - 5);
            
            // Change indicator
            if (visibleData.length > 1) {
                const prevValue = visibleData[visibleData.length - 2].value;
                const change = currentValue - prevValue;
                const changePercent = (change / prevValue) * 100;
                
                if (change > 0) {
                    this.ctx.fillStyle = '#00ff00';
                    this.ctx.fillText(`+${changePercent.toFixed(1)}%`, x + width - 50, y + 15);
                } else {
                    this.ctx.fillStyle = '#ff0000';
                    this.ctx.fillText(`${changePercent.toFixed(1)}%`, x + width - 50, y + 15);
                }
            }
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    drawRetroElements() {
        // Draw retro scan lines
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.1;
        
        for (let y = 0; y < this.canvas.height; y += 2) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Draw corner brackets
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = 0.5;
        
        const bracketSize = 20;
        
        // Top-left bracket
        this.ctx.beginPath();
        this.ctx.moveTo(10, 10);
        this.ctx.lineTo(10 + bracketSize, 10);
        this.ctx.moveTo(10, 10);
        this.ctx.lineTo(10, 10 + bracketSize);
        this.ctx.stroke();
        
        // Top-right bracket
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width - 10, 10);
        this.ctx.lineTo(this.canvas.width - 10 - bracketSize, 10);
        this.ctx.moveTo(this.canvas.width - 10, 10);
        this.ctx.lineTo(this.canvas.width - 10, 10 + bracketSize);
        this.ctx.stroke();
        
        // Bottom-left bracket
        this.ctx.beginPath();
        this.ctx.moveTo(10, this.canvas.height - 10);
        this.ctx.lineTo(10 + bracketSize, this.canvas.height - 10);
        this.ctx.moveTo(10, this.canvas.height - 10);
        this.ctx.lineTo(10, this.canvas.height - 10 - bracketSize);
        this.ctx.stroke();
        
        // Bottom-right bracket
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width - 10, this.canvas.height - 10);
        this.ctx.lineTo(this.canvas.width - 10 - bracketSize, this.canvas.height - 10);
        this.ctx.moveTo(this.canvas.width - 10, this.canvas.height - 10);
        this.ctx.lineTo(this.canvas.width - 10, this.canvas.height - 10 - bracketSize);
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
    }
    
    drawMarketAlerts(progress) {
        // Random market alerts and crazy events
        const alerts = [
            "🚀 TO THE MOON!",
            "📉 MARKET CRASH!",
            "🔥 DIAMOND HANDS!",
            "💎 HODL!",
            "📊 PUMP IT!",
            "⚠️ SELL EVERYTHING!",
            "🎯 TARGET HIT!",
            "💥 EXPLOSIVE GROWTH!",
            "📈 BREAKING RESISTANCE!",
            "🦍 APE STRONG!",
            "⚡ VOLATILITY SPIKE!",
            "🎪 CIRCUS MARKET!",
            "🔥 FOMO ALERT!",
            "📉 PANIC SELL!",
            "🚀 ROCKET SHIP!",
            "💀 DEATH SPIRAL!"
        ];
        
        // Show random alerts
        if (Math.random() < 0.1) { // 10% chance per frame
            const alert = alerts[Math.floor(Math.random() * alerts.length)];
            const x = Math.random() * (this.canvas.width - 200);
            const y = Math.random() * (this.canvas.height - 50);
            
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 16px "Courier New", monospace';
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillText(alert, x, y);
            this.ctx.globalAlpha = 1;
        }
        
        // Draw market status
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '14px "Courier New", monospace';
        this.ctx.globalAlpha = 0.7;
        
        const statusMessages = [
            "MARKET: VOLATILE",
            "STATUS: CHAOS",
            "MODE: APE",
            "ALERT: HIGH VOLATILITY",
            "WARNING: PUMP DETECTED",
            "NOTICE: DIAMOND HANDS ACTIVE"
        ];
        
        const status = statusMessages[Math.floor(progress * statusMessages.length) % statusMessages.length];
        this.ctx.fillText(status, 20, this.canvas.height - 20);
        
        // Draw scrolling ticker tape
        const tickerText = "TSLA NVDA GME AMC BTC ETH SPY QQQ ";
        const tickerX = (progress * 2000) % (this.canvas.width + 200);
        
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = '12px "Courier New", monospace';
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillText(tickerText, tickerX, 25);
        this.ctx.globalAlpha = 1;
    }
    
    drawInvestButton() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Button dimensions
        const buttonWidth = 300;
        const buttonHeight = 100;
        const buttonX = (width - buttonWidth) / 2;
        const buttonY = (height - buttonHeight) / 2;
        
        // Draw button background with gradient effect
        this.ctx.fillStyle = '#00ff00';
        this.ctx.globalAlpha = 0.9;
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Draw button border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.globalAlpha = 1;
        this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Draw inner border
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(buttonX + 5, buttonY + 5, buttonWidth - 10, buttonHeight - 10);
        
        // Draw "INVEST" text
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 48px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.globalAlpha = 1;
        
        // Add text shadow effect
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('INVEST', buttonX + buttonWidth/2 + 2, buttonY + buttonHeight/2 + 2);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText('INVEST', buttonX + buttonWidth/2, buttonY + buttonHeight/2);
        
        // Add pulsing effect
        const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.9;
        this.ctx.globalAlpha = pulse;
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        this.ctx.globalAlpha = 1;
        
        // Add click effect if button was clicked
        if (this.buttonClicked) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            this.ctx.globalAlpha = 1;
        }
        
        // Store button bounds for click detection
        this.investButtonBounds = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
    }
    
    handleCanvasClick(e) {
        if (!this.investButtonBounds) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if click is within INVEST button bounds
        if (x >= this.investButtonBounds.x && 
            x <= this.investButtonBounds.x + this.investButtonBounds.width &&
            y >= this.investButtonBounds.y && 
            y <= this.investButtonBounds.y + this.investButtonBounds.height) {
            
            console.log('INVEST button clicked!');
            this.buttonClicked = true;
            
            // Add some crazy market effects
            this.triggerInvestEffect();
            
            // Reset button state after a short delay
            setTimeout(() => {
                this.buttonClicked = false;
            }, 500);
        }
    }
    
    triggerInvestEffect() {
        // Add some crazy market alerts
        const investAlerts = [
            "🚀 INVESTMENT INITIATED!",
            "💰 MONEY PRINTER GO BRRR!",
            "📈 PORTFOLIO TO THE MOON!",
            "💎 DIAMOND HANDS ACTIVATED!",
            "🎯 TARGET ACQUIRED!",
            "⚡ LIGHTNING FAST TRADES!",
            "🔥 INVESTMENT FIRE!",
            "🎪 CIRCUS OF PROFITS!"
        ];
        
        // Show multiple alerts
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const alert = investAlerts[Math.floor(Math.random() * investAlerts.length)];
                const x = Math.random() * (this.canvas.width - 300);
                const y = Math.random() * (this.canvas.height - 100);
                
                this.ctx.fillStyle = '#ffff00';
                this.ctx.font = 'bold 20px "Courier New", monospace';
                this.ctx.globalAlpha = 1;
                this.ctx.fillText(alert, x, y);
                
                // Fade out effect
                setTimeout(() => {
                    this.ctx.globalAlpha = 0.5;
                }, 1000);
            }, i * 200);
        }
    }
    
    destroy() {
        this.isActive = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.canvas) {
            this.canvas.remove();
        }
        
        // Notify the event manager that this event has ended
        if (window.randomEventManager) {
            window.randomEventManager.endEvent('retro-stock-chart');
        }
    }
}

// Register the retro stock chart event
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('test-page.html')) {
        window.randomEventManager.registerEvent('retro-stock-chart', 0.15, () => {
            return new RetroStockChart();
        });
    }
});
