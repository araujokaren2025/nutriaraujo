import { useState } from 'react';
import { Save } from 'lucide-react';

const MealPlanEditor = ({ plano, onSave, onCancel, loading }) => {
  const [editedPlano, setEditedPlano] = useState(plano);
  const [activeTab, setActiveTab] = useState(0); // Índice do dia ativo (0 a 6)

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

  const diaAtivo = editedPlano.plano_semanal[activeTab];

  return (
    <div className="meal-plan-editor" style={{ marginTop: '30px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)', margin: 0 }}>Plano Sugerido pela IA</h2>
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

      {/* Abas dos Dias da Semana */}
      <div className="meal-plan-tabs">
        {editedPlano.plano_semanal.map((dia, idx) => (
          <button
            key={idx}
            className={`meal-plan-tab-btn ${activeTab === idx ? 'active' : ''}`}
            onClick={() => setActiveTab(idx)}
          >
            {dia.dia}
          </button>
        ))}
      </div>

      {/* Grid de Refeições do Dia Ativo */}
      {diaAtivo && (
        <div className="meals-grid" style={{ animation: 'fadeIn 0.3s ease-in' }}>
          {Object.entries(diaAtivo.refeicoes).map(([key, options]) => (
            <div key={key} className="meal-card">
              <div className="meal-title">
                {mealLabels[key] || key.replace(/_/g, ' ')}
              </div>
              <div className="meal-inputs-list">
                {options.map((opt, oIdx) => (
                  <input
                    key={oIdx}
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(activeTab, key, oIdx, e.target.value)}
                    placeholder={`Opção ${oIdx + 1}`}
                    className="meal-input"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MealPlanEditor;
