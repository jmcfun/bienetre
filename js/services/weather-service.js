// Service météo utilisant OpenWeatherMap
export class WeatherService {
    constructor() {
        this.baseUrl = 'https://api.open-meteo.com/v1';
        this.weatherIcons = {
            'Clear': '☀️',
            'PartlyCloudy': '🌤️',
            'Cloudy': '☁️',
            'Rain': '🌧️',
            'Snow': '🌨️',
            'Thunderstorm': '⛈️',
            'Drizzle': '🌦️',
            'Fog': '🌫️',
            'default': '🌤️'
        };
        
        // Codes WMO (World Meteorological Organization)
        this.weatherCodes = {
            0: 'Clear',          // Clear sky
            1: 'PartlyCloudy',   // Mainly clear
            2: 'PartlyCloudy',   // Partly cloudy
            3: 'Cloudy',         // Overcast
            45: 'Fog',           // Foggy
            48: 'Fog',           // Depositing rime fog
            51: 'Drizzle',       // Light drizzle
            53: 'Drizzle',       // Moderate drizzle
            55: 'Drizzle',       // Dense drizzle
            61: 'Rain',          // Slight rain
            63: 'Rain',          // Moderate rain
            65: 'Rain',          // Heavy rain
            71: 'Snow',          // Slight snow
            73: 'Snow',          // Moderate snow
            75: 'Snow',          // Heavy snow
            95: 'Thunderstorm',  // Thunderstorm
            96: 'Thunderstorm',  // Thunderstorm with slight hail
            99: 'Thunderstorm'   // Thunderstorm with heavy hail
        };
    }

    async getWeatherData(lat, lon) {
        try {
            console.log('Récupération données météo pour:', { lat, lon });
            const response = await fetch(
                `${this.baseUrl}/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
            );
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('Données météo reçues:', data);

            return this.formatWeatherData(data);
        } catch (error) {
            console.error('Erreur récupération météo:', error);
            throw error;
        }
    }

    formatWeatherData(data) {
        console.log('Formatage données météo:', data);
        const current = data.current_weather;
        const weatherType = this.weatherCodes[current.weathercode] || 'Clear';
        
        return {
            temperature: Math.round(current.temperature),
            conditions: weatherType,
            description: this.getWeatherDescription(weatherType),
            icon: this.getWeatherIcon(weatherType),
            isGoodWeather: this.isGoodWeather(current.temperature, weatherType)
        };
    }

    getWeatherDescription(weatherType) {
        const descriptions = {
            'Clear': 'Ciel dégagé',
            'PartlyCloudy': 'Partiellement nuageux',
            'Cloudy': 'Nuageux',
            'Rain': 'Pluvieux',
            'Snow': 'Neigeux',
            'Thunderstorm': 'Orageux',
            'Drizzle': 'Bruine',
            'Fog': 'Brumeux'
        };
        return descriptions[weatherType] || descriptions['Clear'];
    }

    getWeatherIcon(condition) {
        return this.weatherIcons[condition] || this.weatherIcons.default;
    }

    isGoodWeather(temperature, conditions) {
        return temperature >= 15 && temperature <= 25 && 
               !['Rain', 'Snow', 'Thunderstorm', 'Fog'].includes(conditions);
    }
} 