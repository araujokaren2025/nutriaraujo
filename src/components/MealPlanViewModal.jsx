import { useState } from 'react';
import { X, Copy, Edit, Trash2, Check } from 'lucide-react';

const MealPlanViewModal = ({ isOpen, onClose, plan, patientName, onEdit, onDelete }) => {
  const [activeDay, setActiveDay] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !plan || !plan.conteudo || !plan.conteudo.plano_semanal) return null;

  const weeklyPlan = plan.conteudo.plano_semanal;

  const mealLabels = {
    cafe_da_manha: '☀️ Café da Manhã',
    lanche_manha: '🍎 Lanche da Manhã',
    almoco: '🍛 Almoço',
    lanche_tarde: '☕ Lanche da Tarde',
    jantar: '🥗 Jantar'
  };

  const handleCopyText = () => {
    try {
      let text = `📋 PLANO ALIMENTAR SEMANAL\n👤 Paciente: ${patientName}\n📅 Gerado em: ${new Date(plan.created_at).toLocaleDateString('pt-BR')}\n\n`;

      weeklyPlan.forEach((dia) => {
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n📅 ${dia.dia.toUpperCase()}\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        Object.entries(dia.refeicoes).forEach(([mealKey, options]) => {
          const mealName = mealLabels[mealKey] || mealKey.replace(/_/g, ' ');
          text += `\n${mealName}:\n`;
          options.forEach((opt, oIdx) => {
            if (opt && opt.trim() !== '') {
              text += `  • Opção ${oIdx + 1}: ${opt}\n`;
            }
          });
        });
        text += `\n`;
      });

      text += `\n_Gerado por NutriSystem_`;

      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar texto:', err);
      alert('Não foi possível copiar o texto automaticamente.');
    }
  };

  const currentDayData = weeklyPlan[activeDay] || weeklyPlan[0];

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Plano Alimentar Completo</h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              Paciente: <strong>{patientName}</strong> | Criado em: {new Date(plan.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <span className="close-modal" onClick={onClose} style={{ top: '20px' }}><X size={24} /></span>
        </header>

        {/* Abas dos Dias da Semana */}
        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {weeklyPlan.map((dia, idx) => (
            <button
              key={idx}
              onClick={() => setActiveDay(idx)}
              style={{
                width: 'auto',
                padding: '8px 16px',
                fontSize: '0.85rem',
                borderRadius: '8px',
                background: activeDay === idx ? 'rgba(253, 153, 162, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: activeDay === idx ? '#FD99A2' : 'rgba(255, 255, 255, 0.8)',
                border: activeDay === idx ? '1px solid rgba(253, 153, 162, 0.4)' : '1px solid transparent',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                margin: 0,
                boxShadow: 'none'
              }}
            >
              {dia.dia}
            </button>
          ))}
        </div>

        {/* Conteúdo do Dia Selecionado */}
        <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '5px', marginBottom: '20px' }}>
          {currentDayData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {Object.entries(currentDayData.refeicoes).map(([mealKey, options]) => (
                <div 
                  key={mealKey} 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)', 
                    borderRadius: '12px', 
                    padding: '20px' 
                  }}
                >
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FD99A2', fontSize: '1rem', marginBottom: '15px', borderBottom: '1px solid rgba(253, 153, 162, 0.1)', paddingBottom: '8px' }}>
                    {mealLabels[mealKey] || mealKey.replace(/_/g, ' ')}
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {options.map((opt, oIdx) => (
                      opt && opt.trim() !== '' && (
                        <div 
                          key={oIdx} 
                          style={{ 
                            fontSize: '0.9rem', 
                            padding: '10px 12px', 
                            background: 'rgba(255,255,255,0.05)', 
                            borderRadius: '8px', 
                            color: 'rgba(255,255,255,0.9)',
                            borderLeft: '3px solid #FD99A2'
                          }}
                        >
                          <strong>Opção {oIdx + 1}:</strong> {opt}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <footer style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleCopyText} 
              className="btn-primary" 
              style={{ width: 'auto', background: copied ? '#2ed573' : '#6c5ce7', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copiado!' : 'Copiar p/ WhatsApp'}
            </button>
            <button 
              onClick={() => onEdit(plan)} 
              className="btn-primary" 
              style={{ width: 'auto', background: '#ffa502', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}
            >
              <Edit size={18} /> Editar
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => onDelete(plan.id)} 
              className="btn-primary" 
              style={{ width: 'auto', background: '#ff4757', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}
            >
              <Trash2 size={18} /> Excluir
            </button>
            <button 
              onClick={onClose} 
              className="btn-secondary" 
              style={{ width: 'auto', margin: 0, padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}
            >
              Fechar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MealPlanViewModal;
