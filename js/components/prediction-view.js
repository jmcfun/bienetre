class PredictionView {
    render(predictions) {
        return `
            <div class="advanced-analytics">
                <h3>
                    Analyses Avancées
                    <span class="premium-badge">Premium</span>
                </h3>
                <div class="prediction-section">
                    <div class="prediction-row">
                        <span class="prediction-label">Demain</span>
                        <div class="prediction-value">
                            <span class="mood-prediction">${predictions.mood}</span>
                            <div class="confidence-wrapper">
                                <div class="confidence-bar">
                                    <div class="confidence-fill" style="width: ${predictions.confidence * 100}%"></div>
                                </div>
                                <span class="confidence-label">Confiance</span>
                            </div>
                        </div>
                    </div>
                    <div class="prediction-row">
                        <div class="weather-info">
                            <span class="weather-icon">${predictions.weather.icon}</span>
                            <span class="weather-temp">${predictions.weather.temperature}°C</span>
                            <span class="weather-desc">${predictions.weather.description}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
} 