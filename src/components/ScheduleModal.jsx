import { useState, useEffect } from 'react';
import { pacienteService } from '../services/pacientes';
import { agendamentoService } from '../services/agendamentos';
import { X, Calendar, Clock, User } from 'lucide-react';

const ScheduleModal = ({ isOpen, onClose, onScheduleSuccess, initialPatient = null, initialSlot = null }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: initialPatient?.id || '',
    data: initialSlot?.data || '',
    horario: initialSlot?.horario || '',
    observacoes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (!initialPatient) {
        pacienteService.getPacientes().then(setPatients).catch(console.error);
      }
      setFormData({
        paciente_id: initialPatient?.id || '',
        data: initialSlot?.data || '',
        horario: initialSlot?.horario || '',
        observacoes: ''
      });
    }
  }, [isOpen, initialPatient, initialSlot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.paciente_id || !formData.data || !formData.horario) {
      return alert('Preencha todos os campos obrigatórios!');
    }

    setLoading(true);
    try {
      // Combinar data e hora
      const [year, month, day] = formData.data.split('-');
      const [hour, minute] = formData.horario.split(':');
      const dataHora = new Date(year, month - 1, day, hour, minute);

      await agendamentoService.createAgendamento({
        paciente_id: formData.paciente_id,
        data_hora: dataHora.toISOString(),
        observacoes: formData.observacoes,
        status: 'pendente'
      });

      alert('Consulta agendada com sucesso!');
      onScheduleSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao agendar: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Agendar Consulta</h2>
          <span className="close-modal" onClick={onClose}><X size={24} /></span>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><User size={16} style={{ marginRight: '5px' }} /> Paciente*</label>
            {initialPatient ? (
              <input type="text" value={initialPatient.nome} disabled />
            ) : (
              <select 
                value={formData.paciente_id} 
                onChange={e => setFormData({ ...formData, paciente_id: e.target.value })}
                required
              >
                <option value="">Selecione um paciente...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            )}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label><Calendar size={16} style={{ marginRight: '5px' }} /> Data*</label>
              <input 
                type="date" 
                value={formData.data} 
                onChange={e => setFormData({ ...formData, data: e.target.value })}
                required 
              />
            </div>
            <div className="form-group">
              <label><Clock size={16} style={{ marginRight: '5px' }} /> Horário*</label>
              <input 
                type="time" 
                value={formData.horario} 
                onChange={e => setFormData({ ...formData, horario: e.target.value })}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Observações</label>
            <textarea 
              rows="3" 
              value={formData.observacoes} 
              onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Ex: Primeira consulta, retorno, etc."
            ></textarea>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '20px' }}>
            {loading ? 'Agendando...' : 'Confirmar Agendamento'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;
