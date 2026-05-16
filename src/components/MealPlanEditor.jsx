import { useState } from 'react';
import { Save, ChevronDown, ChevronUp } from 'lucide-react';

const MealPlanEditor = ({ plano, onSave, onCancel, loading }) => {
  const [editedPlano, setEditedPlano] = useState(plano);
  const [expandedDay, setExpandedDay] = useState(0);

  const handleOptionChange = (dayIndex, mealKey, optionIndex, newValue) => {
    const newPlano = { ...editedPlano };
    newPlano.plano_semanal[dayIndex].refeicoes[mealKey][optionIndex] = newValue;
    setEditedPlano(newPlano);
  };

  const mealLabels = {
    cafe_da_manha: '☀️ Café da Manhã',
    lanche_manha: '🍎 Lanche da Manhã',
    almoco: '🍛 Almoço',
    lanche_tarde: '☕ Lanche da Tarde',
    jantar: '🥗 Jantar'
  };

  if (!editedPlano || !editedPlano.plano_semanal) return null;

  return (
    <div className="meal-plan-editor" style={{ marginTop: '30px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Plano Sugerido pela IA</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={onCancel} style={{ width: 'auto', padding: '10px 20px' }}>
            Descartar
          </button>
          <button className="btn-primary" onClick={() => onSave(editedPlano)} disabled={loading} style={{ width: 'auto', padding: '10px 25px' }}>
            <Save size={18} style={{ marginRight: '8px' }} />
            {loading ? 'Salvando...' : 'Salvar Plano'}
          </button>
        </div>
      </div>

      <div className="days-list">
        {editedPlano.plano_semanal.map((dia, dIdx) => (
          <div key={dIdx} className="day-card" style={{ marginBottom: '15px', border: '1px solid rgba(255, 107, 129, 0.2)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255, 107, 129, 0.05)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div 
              onClick={() => setExpandedDay(expandedDay === dIdx ? -1 : dIdx)}
              style={{ padding: '15px 25px', background: expandedDay === dIdx ? 'rgba(255, 107, 129, 0.15)' : 'rgba(255, 107, 129, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.3s' }}
            >
              <strong style={{ color: '#333', fontSize: '1.1rem' }}>{dia.dia}</strong>
              {expandedDay === dIdx ? <ChevronUp size={20} color="#FD99A2" /> : <ChevronDown size={20} color="#888" />}
            </div>

            {expandedDay === dIdx && (
              <div style={{ padding: '25px', background: 'transparent' }}>
                <div className="refeicoes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                  {Object.entries(dia.refeicoes).map(([key, options]) => (
                    <div key={key} className="meal-group">
                      <label style={{ fontWeight: '700', color: '#FD99A2', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.95rem' }}>
                        {mealLabels[key] || key}
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {options.map((opt, oIdx) => (
                          <input 
                            key={oIdx}
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(dIdx, key, oIdx, e.target.value)}
                            placeholder={`Opção ${oIdx + 1}`}
                            style={{ 
                              fontSize: '0.9rem', 
                              padding: '10px 14px',
                              background: '#fff',
                              border: '1px solid rgba(255, 107, 129, 0.3)',
                              borderRadius: '8px',
                              color: '#333',
                              fontWeight: '500'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealPlanEditor;
