import { useState, useEffect } from 'react';
import { Save, X, AlertTriangle, Salad } from 'lucide-react';
import { consultaService } from '../services/consultas';
import { pacienteService } from '../services/pacientes';

const ConsultationModal = ({ isOpen, onClose, patient, onSaveSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    alergias: '',
    restricoes_alimentares: '',
    observacoes: '',
    proximo_retorno: ''
  });

  useEffect(() => {
    if (isOpen && patient) {
      setFormData(prev => ({
        ...prev,
        peso: prev.peso || patient.peso_inicial || '',
        alergias: prev.alergias || (Array.isArray(patient.alergias) ? patient.alergias.join(', ') : patient.alergias || ''),
        restricoes_alimentares: prev.restricoes_alimentares || (Array.isArray(patient.restricoes_alimentares) ? patient.restricoes_alimentares.join(', ') : patient.restricoes_alimentares || '')
      }));
    }
  }, [isOpen, patient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Salvar o registro da consulta
      await consultaService.createConsulta({
        ...formData,
        paciente_id: patient.id,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        cintura: formData.cintura ? parseFloat(formData.cintura) : null,
        quadril: formData.quadril ? parseFloat(formData.quadril) : null,
        percentual_gordura: formData.percentual_gordura ? parseFloat(formData.percentual_gordura) : null,
        proximo_retorno: formData.proximo_retorno || null
      });

      // 2. Atualizar o cadastro do paciente para que a IA considere os novos dados
      await pacienteService.updatePaciente(patient.id, {
        alergias: formData.alergias.split(',').map(i => i.trim()).filter(i => i),
        restricoes_alimentares: formData.restricoes_alimentares.split(',').map(i => i.trim()).filter(i => i)
      });

      alert('Registro de consulta salvo e perfil do paciente atualizado!');
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar consulta: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Registrar Consulta: {patient?.nome}</h2>
          <span className="close-modal" onClick={onClose}><X size={24} /></span>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Data da Consulta</label>
              <input 
                type="date" 
                required 
                value={formData.data_consulta}
                onChange={(e) => setFormData({...formData, data_consulta: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Peso Atual (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                required
                value={formData.peso}
                onChange={(e) => setFormData({...formData, peso: e.target.value})}
                placeholder="Ex: 75.5"
              />
            </div>

            <div className="form-group">
              <label>% Gordura</label>
              <input 
                type="number" 
                step="0.1" 
                value={formData.percentual_gordura}
                onChange={(e) => setFormData({...formData, percentual_gordura: e.target.value})}
                placeholder="Ex: 18.5"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color="#ff4757" /> Alergias
              </label>
              <input 
                type="text" 
                value={formData.alergias}
                onChange={(e) => setFormData({...formData, alergias: e.target.value})}
                placeholder="Ex: Amendoim, Frutos do mar..."
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Salad size={16} color="#2ed573" /> Restrições Alimentares / Intolerâncias
              </label>
              <input 
                type="text" 
                value={formData.restricoes_alimentares}
                onChange={(e) => setFormData({...formData, restricoes_alimentares: e.target.value})}
                placeholder="Ex: Intolerância a lactose, Gluten-free, Vegano..."
              />
            </div>

            <div className="form-group">
              <label>Cintura (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                value={formData.cintura}
                onChange={(e) => setFormData({...formData, cintura: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Quadril (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                value={formData.quadril}
                onChange={(e) => setFormData({...formData, quadril: e.target.value})}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Próximo Retorno (opcional)</label>
              <input 
                type="date" 
                value={formData.proximo_retorno}
                onChange={(e) => setFormData({...formData, proximo_retorno: e.target.value})}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Observações Clínicas / Evolução</label>
              <textarea 
                rows="4"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Descreva a evolução do paciente nesta sessão..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2 }}>
              <Save size={18} style={{ marginRight: '8px' }} />
              {loading ? 'Salvando...' : 'Salvar Registro da Consulta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultationModal;
