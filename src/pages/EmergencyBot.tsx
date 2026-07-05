import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertTriangle, Phone, Shield, Heart, Flame, Zap, MessageCircle, Loader2, Info, X } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';

// Emergencias predefinidas
const EMERGENCY_TYPES = [
{ id: 'incendio', label: '🔥 Incendio', icon: <Flame size={20} />, color: '#ef4444' },
{ id: 'accidente', label: '🚑 Accidente', icon: <Heart size={20} />, color: '#dc2626' },
{ id: 'electrico', label: '⚡ Riesgo Eléctrico', icon: <Zap size={20} />, color: '#fbbf24' },
{ id: 'quimico', label: '☣️ Derrame Químico', icon: <AlertTriangle size={20} />, color: '#a855f7' },
{ id: 'evacuacion', label: '🚪 Evacuación', icon: <Shield size={20} />, color: '#3b82f6' }];


// Respuestas rápidas de emergencia
const QUICK_RESPONSES = {
  incendio: {
    title: '🔥 EMERGENCIA POR INCENDIO',
    steps: [
    '✅ MANTENER LA CALMA - No correr, no gritar',
    '🔔 ACTIVAR la alarma de incendio más cercana',
    '📞 LLAMAR al 911 o bomberos (100)',
    '🧯 Si es pequeño y tenés extintor: intentar apagar',
    '🚪 Si es grande: EVACUAR inmediatamente',
    '🚫 NO usar ascensores',
    '👥 Reunirse en el punto de encuentro'],

    tips: 'Usar extintor ABC para fuegos comunes. Apuntar a la base del fuego.'
  },
  accidente: {
    title: '🚑 EMERGENCIA MÉDICA',
    steps: [
    '✅ EVALUAR la escena - ¿Es seguro acercarse?',
    '📞 LLAMAR al 911 o SAME (107)',
    '🩸 Controlar hemorragias con presión directa',
    '💀 NO mover al herido (salvo peligro inminente)',
    '🌡️ Mantener abrigado y consciente',
    '📍 Indicar ubicación exacta al 911'],

    tips: 'Si no respira: iniciar RCP. 30 compresiones + 2 ventilaciones.'
  },
  electrico: {
    title: '⚡ EMERGENCIA ELÉCTRICA',
    steps: [
    '🚫 NO tocar a la persona electrocutada directamente',
    '⚡ CORTAR la energía desde el tablero',
    '📞 LLAMAR a emergencias (911)',
    '🪜 Usar elementos NO conductores (madera, plástico)',
    '🩺 Una vez seguro: evaluar víctima',
    '🏥 Trasladar al hospital aunque parezca bien'],

    tips: 'El cuerpo humano conduce electricidad. Usar guantes de goma o elementos secos.'
  },
  quimico: {
    title: '☣️ DERRAME QUÍMICO',
    steps: [
    '🚨 EVACUAR el área inmediatamente',
    '💨 VENTILAR si es posible',
    '📞 LLAMAR a emergencias',
    '🧴 Si tenés EPP: contener con absorbente',
    '🚫 NO mezclar productos químicos',
    '👕 Quitarse ropa contaminada',
    '🚿 Lavarse con abundante agua'],

    tips: 'Consultar Hoja de Seguridad (SDS) del producto específico.'
  },
  evacuacion: {
    title: '🚪 PROCEDIMIENTO DE EVACUACIÓN',
    steps: [
    '🔔 Escuchar la alarma de evacuación',
    '🚶 Caminar rápido, NO correr',
    '🚫 NO llevar objetos personales',
    '🚪 Seguir las señales de salida',
    '🚫 NO usar ascensores',
    '👥 Reunirse en el punto de encuentro',
    '✅ Reportarse al jefe de evacuación'],

    tips: 'Conocer de antemano las rutas de evacuación y puntos de encuentro.'
  }
};

export default function EmergencyBot(): React.ReactElement | null {
  const navigate = useNavigate();
  useDocumentTitle('Chatbot de Emergencias');
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
  {
    id: 1,
    type: 'bot',
    content: '🚨 **BOT DE EMERGENCIAS - ASISTENTE H&S**\n\nSeleccioná el tipo de emergencia o escribí tu consulta. Estoy aquí para ayudarte paso a paso.',
    timestamp: new Date()
  }]
  );
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = (content) => {
    setMessages((prev) => [...prev, {
      id: Date.now(),
      type: 'bot',
      content,
      timestamp: new Date()
    }]);
  };

  const addUserMessage = (content) => {
    setMessages((prev) => [...prev, {
      id: Date.now(),
      type: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  const handleEmergencySelect = (emergencyId) => {
    const emergency = EMERGENCY_TYPES.find((e) => e.id === emergencyId);
    setSelectedEmergency(emergencyId);

    addUserMessage(`Seleccioné: ${emergency.label}`);
    setIsTyping(true);

    setTimeout(() => {
      const response = QUICK_RESPONSES[emergencyId];
      let message = `**${response.title}**\n\n`;
      message += '**Pasos a seguir:**\n';
      response.steps.forEach((step, i) => {
        message += `${i + 1}. ${step}\n`;
      });
      message += `\n💡 **Consejo:** ${response.tips}`;
      message += `\n\n⚠️ **¿Necesitás ayuda adicional?** Escribí tu consulta.`;

      addBotMessage(message);
      setIsTyping(false);
    }, 800);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    addUserMessage(userMessage);
    setInputValue('');
    setIsTyping(true);
    
    // Construir el contexto de la empresa a partir del localStorage
    let companyContext = '';
    try {
      const ext = localStorage.getItem('extinguisher_history');
      if (ext) {
        const extData = JSON.parse(ext);
        companyContext += `\nExtintores registrados: ${extData.length}. ` + 
          (extData.length > 0 ? `Ejemplo: ${extData[0].type || 'Matafuego'} en sector ${extData[0].sector || 'general'}.` : '');
      }
      const acc = localStorage.getItem('accident_history');
      if (acc) {
        const accData = JSON.parse(acc);
        companyContext += `\nAccidentes históricos registrados: ${accData.length}.`;
      }
      const epp = localStorage.getItem('ppe_history');
      if (epp) {
        const eppData = JSON.parse(epp);
        companyContext += `\nEntregas de EPP registradas: ${eppData.length}.`;
      }
    } catch (e) {
      console.warn("Error leyendo contexto de la empresa", e);
    }

    try {
      // Intentar obtener respuesta de la IA
      const response = await fetch(`${API_BASE_URL}/api/emergency-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: selectedEmergency || 'general',
          companyContext: companyContext
        })
      });

      if (response.ok) {
        const data = await response.json();
        addBotMessage(data.response || 'No pude procesar tu consulta. Por favor, llamá al 911 si es una emergencia real.');
      } else {
        // Fallback a respuestas predefinidas
        const fallbackResponse = getFallbackResponse(userMessage);
        addBotMessage(fallbackResponse);
      }
    } catch (error) {
      console.error('Emergency chat error:', error);
      const fallbackResponse = getFallbackResponse(userMessage);
      addBotMessage(fallbackResponse);
    } finally {
      setIsTyping(false);
    }
  };

  const getFallbackResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('fuego') || lowerMessage.includes('incendio') || lowerMessage.includes('quemar')) {
      return QUICK_RESPONSES.incendio.title + '\n\n' + QUICK_RESPONSES.incendio.steps.join('\n');
    }
    if (lowerMessage.includes('herido') || lowerMessage.includes('accidente') || lowerMessage.includes('dolor')) {
      return QUICK_RESPONSES.accidente.title + '\n\n' + QUICK_RESPONSES.accidente.steps.join('\n');
    }
    if (lowerMessage.includes('eléctric') || lowerMessage.includes('electric') || lowerMessage.includes('shock')) {
      return QUICK_RESPONSES.electrico.title + '\n\n' + QUICK_RESPONSES.electrico.steps.join('\n');
    }
    if (lowerMessage.includes('químico') || lowerMessage.includes('quimico') || lowerMessage.includes('derrame')) {
      return QUICK_RESPONSES.quimico.title + '\n\n' + QUICK_RESPONSES.quimico.steps.join('\n');
    }
    if (lowerMessage.includes('evacuar') || lowerMessage.includes('salir') || lowerMessage.includes('alarma')) {
      return QUICK_RESPONSES.evacuacion.title + '\n\n' + QUICK_RESPONSES.evacuacion.steps.join('\n');
    }
    if (lowerMessage.includes('911') || lowerMessage.includes('emergencia') || lowerMessage.includes('ayuda')) {
      return '🚨 **NÚMEROS DE EMERGENCIA (Argentina):**\n\n📞 911 - Emergencias generales\n🚑 107 - SAME (ambulancia)\n👮 101 - Policía\n🔥 100 - Bomberos\n\n⚠️ Mantené la calma y decí:\n1. Qué pasó\n2. Dónde estás\n3. Cuántos afectados hay';
    }

    return `🤖 Entendí tu consulta: "${message}"\n\n⚠️ **Si es una emergencia REAL, llamá inmediatamente al 911.**\n\nPara emergencias específicas, seleccioná una de las opciones de arriba. ¿En qué más puedo ayudarte?`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="container max-w-[800px] pb-[0]">
            {/* Header */}
            <div className="flex items-center gap-[1rem] mb-[1.5rem] p-[1rem] bg-[linear-gradient(135deg,_#ef4444_0%,_#dc2626_100%)] rounded-[12px] text-[#ffffff]">








        
                <></>
                <div className="flex-[1]">
                    <h1 className="m-0 text-xl font-black">
                        🚨 Chatbot de Emergencias
                    </h1>
                    <p className="m-[4px_0_0_0] text-[0.85rem] opacity-[0.9]">
                        Asistencia inmediata paso a paso
                    </p>
                </div>
                <div className="p-[0.5rem_1rem] bg-[rgba(255,255,255,0.2)] rounded-[8px] text-[0.75rem] font-[700]">





          
                    24/7
                </div>
            </div>

            {/* Emergency Quick Buttons */}
            <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(140px,_1fr))] gap-[0.8rem] mb-[1.5rem]">




        
                {EMERGENCY_TYPES.map((emergency) =>
        <button
          key={emergency.id}
          onClick={() => handleEmergencySelect(emergency.id)}
          style={{

            background: selectedEmergency === emergency.id ?
            `${emergency.color}20` : 'var(--color-surface)',
            border: `2px solid ${emergency.color}`,







            color: emergency.color


          }} className="p-[1rem] rounded-[12px] cursor-pointer flex flex-col items-center gap-[0.5rem] transition-[all_0.2s] font-[700] text-[0.85rem]">
          
                        {emergency.icon}
                        <span className="text-center">{emergency.label}</span>
                    </button>
        )}
            </div>

            {/* Chat Messages */}
            <div className="bg-[var(--color-surface)] rounded-[12px] border-[1px_solid_var(--color-border)] mb-[1rem] flex flex-col h-[calc(100vh_-_400px)] min-h-[400px]">








        
                {/* Messages Area */}
                <div className="flex-[1] overflow-y-[auto] p-[1rem] flex flex-col gap-[1rem]">






          
                    {messages.map((msg) =>
          <div
            key={msg.id}
            style={{

              justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'

            }} className="flex max-w-[85%]">
            
                            <div
              style={{

                background: msg.type === 'user' ?
                'linear-gradient(135deg, #3b82f6, #2563eb)' :
                'var(--color-background)',
                color: msg.type === 'user' ? '#ffffff' : 'var(--color-text)',
                borderRadius: msg.type === 'user' ?
                '12px 12px 4px 12px' :
                '12px 12px 12px 4px'



              }} className="p-[0.8rem_1rem] text-[0.9rem] line-height-[1.5] white-space-[pre-wrap]">
              
                                {msg.content}
                                <div className="text-[0.7rem] opacity-[0.7] mt-[4px] text-right">




                
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
          )}
                    
                    {isTyping &&
          <div className="flex gap-[0.5rem] items-center text-[var(--color-text-muted)]">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-[0.85rem]">Escribiendo...</span>
                        </div>
          }
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-[1rem] border-top-[1px_solid_var(--color-border)] flex gap-[0.5rem] items-end">





          
                    <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribí tu consulta de emergencia..."
            rows={1} className="flex-[1] p-[0.8rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[8px] resize-[none] text-[0.9rem] outline-[none] font-family-[inherit]" />











          
                    <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            style={{

              background: inputValue.trim() && !isTyping ?
              'linear-gradient(135deg, #3b82f6, #2563eb)' :
              'var(--color-border)',



              cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed'






            }} className="p-[0.8rem_1.2rem] text-[#ffffff] border-none rounded-[8px] flex items-center gap-[0.5rem] font-[700] text-[0.85rem] transition-[all_0.2s]">
            
                        {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        <span className="hidden sm:inline">Enviar</span>
                    </button>
                </div>
            </div>

            {/* Emergency Info */}
            <div className="p-[1rem] bg-[rgba(239,_68,_68,_0.1)] border-[1px_solid_rgba(239,_68,_68,_0.2)] rounded-[12px] flex items-start gap-[0.8rem] mb-[1rem]">








        
                <AlertTriangle size={20} color="#ef4444" className="flex-shrink-[0]" />
                <div>
                    <p className="m-[0] text-[0.85rem] font-[700] text-[#ef4444]">
                        ⚠️ IMPORTANTE
                    </p>
                    <p className="m-[4px_0_0_0] text-[0.8rem] text-[var(--color-text-muted)]">
                        Este chatbot es una guía. **En una emergencia real, llamá inmediatamente al 911.** 
                        No reemplaza la atención médica profesional.
                    </p>
                </div>
            </div>
        </div>);

}