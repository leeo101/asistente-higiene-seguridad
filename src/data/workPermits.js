export const permitTypes = [
    {
        id: 'altura',
        label: 'Trabajo en Altura',
        questions: [
            '¿Se verificó el estado de arneses y líneas de vida?',
            '¿Los puntos de anclaje son seguros y estructurales?',
            '¿Se delimitó el área inferior de caída de objetos?',
            '¿El personal cuenta con capacitación para altura?',
            '¿Las condiciones climáticas son favorables?'
        ]
    },
    {
        id: 'caliente',
        label: 'Trabajo en Caliente',
        questions: [
            '¿Se retiraron materiales combustibles en un radio de 10m?',
            '¿Se dispone de extintor cargado en el lugar?',
            '¿Se verificó la ausencia de atmósferas inflamables?',
            '¿Se utilizan mantas ignífugas o pantallas?',
            '¿Se designó un vigía de incendios?'
        ]
    },
    {
        id: 'confinado',
        label: 'Espacio Confinado',
        questions: [
            '¿Se realizó la medición de atmósfera (O2, LEL, CO)?',
            '¿Se cuenta con ventilación forzada o natural?',
            '¿Existe un vigía permanente en el exterior?',
            '¿Se dispone de equipo de rescate y comunicación?',
            '¿Se bloqueó el ingreso de energías peligrosas?'
        ]
    },
    {
        id: 'electrico',
        label: 'Riesgo Eléctrico',
        questions: [
            '¿Se realizó el bloqueo y etiquetado (LOTO)?',
            '¿Se verificó la ausencia de tensión?',
            '¿Se utilizan herramientas aisladas y certificadas?',
            '¿El personal utiliza guantes dieléctricos adecuados?',
            '¿Se delimitó la zona de tableros o cables?'
        ]
    },
    {
        id: 'excavacion',
        label: 'Excavación y Zanjeo',
        questions: [
            '¿Se verificó la ausencia de interferencias (caños, cables)?',
            '¿Se realizó el apuntalamiento o talud necesario?',
            '¿Se encuentran las máquinas a distancia de seguridad?',
            '¿Existen medios de egreso seguros (escaleras)?',
            '¿Se señalizó y valló el perímetro?'
        ]
    }
];
