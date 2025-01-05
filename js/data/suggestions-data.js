export const defaultSuggestions = {
    mood: [
        {
            id: 'mood_1',
            category: 'mood',
            title: 'Méditation guidée',
            description: '10 minutes de méditation pour améliorer l\'humeur',
            steps: [
                'Trouvez un endroit calme',
                'Asseyez-vous confortablement',
                'Respirez profondément pendant 10 minutes',
                'Concentrez-vous sur votre respiration'
            ],
            source: 'Journal of Mental Health',
            intensity: 'low',
            duration: '10min',
            warning: null,
            conditions: {
                mood: { below: 3 },
                stress: { above: 3 }
            }
        },
        {
            id: 'mood_2',
            category: 'mood',
            title: 'Journal de gratitude',
            description: 'Notez 3 choses positives de votre journée',
            steps: [
                'Prenez un moment calme',
                'Réfléchissez à votre journée',
                'Notez 3 éléments positifs, même petits',
                'Décrivez pourquoi ils vous ont rendu heureux'
            ],
            source: 'Positive Psychology Research',
            intensity: 'low',
            duration: '5min',
            warning: null
        },
        {
            id: 'mood_3',
            category: 'mood',
            title: 'Marche consciente',
            description: 'Une courte promenade en pleine conscience',
            steps: [
                'Sortez marcher 10-15 minutes',
                'Observez votre environnement',
                'Concentrez-vous sur vos sens',
                'Respirez l\'air frais'
            ],
            source: 'Mindfulness Studies',
            intensity: 'medium',
            duration: '15min',
            warning: null
        }
    ],
    sleep: [
        {
            id: 'sleep_1',
            category: 'sleep',
            title: 'Routine de sommeil',
            description: 'Établir une routine relaxante avant le coucher',
            steps: [
                'Évitez les écrans 1h avant',
                'Prenez une douche tiède',
                'Faites des étirements doux',
                'Lisez un livre relaxant'
            ],
            source: 'Sleep Foundation Guidelines',
            intensity: 'low',
            duration: '30min',
            warning: null,
            conditions: {
                sleep: { below: 3 }
            }
        }
        // ... autres suggestions pour le sommeil
    ],
    stress: [
        {
            id: 'stress_1',
            category: 'stress',
            title: 'Exercice de respiration 4-7-8',
            description: 'Technique de respiration anti-stress',
            steps: [
                'Inspirez sur 4 secondes',
                'Retenez sur 7 secondes',
                'Expirez sur 8 secondes',
                'Répétez 4 fois'
            ],
            source: 'Anxiety and Depression Association',
            intensity: 'low',
            duration: '5min',
            warning: null,
            conditions: {
                stress: { above: 3 }
            }
        }
        // ... autres suggestions pour le stress
    ],
    activity: [
        {
            id: 'activity_1',
            category: 'activity',
            title: 'Étirements matinaux',
            description: 'Réveillez votre corps en douceur',
            steps: [
                'Étirez les bras vers le ciel',
                'Faites des rotations des épaules',
                'Étirez doucement le dos',
                'Terminez par quelques respirations profondes'
            ],
            source: 'Physical Therapy Guidelines',
            intensity: 'low',
            duration: '5min',
            warning: null
        }
    ],
    social: [
        {
            id: 'social_1',
            category: 'social',
            title: 'Contact social positif',
            description: 'Prenez des nouvelles d\'un proche',
            steps: [
                'Choisissez une personne qui vous fait du bien',
                'Envoyez un message ou appelez',
                'Partagez un moment positif de votre journée',
                'Écoutez activement'
            ],
            source: 'Social Psychology Research',
            intensity: 'low',
            duration: '10min',
            warning: null
        }
    ]
}; 