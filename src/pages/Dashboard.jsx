import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboard';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScheduleModal from '../components/ScheduleModal';
import { agendamentoService } from '../services/agendamentos';

const Dashboard = () => {
  const [data, setData] = useState({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
    agenda: { quantidade: 0, detalhes: [] }
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConsultasSemanaOpen, setIsConsultasSemanaOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [t, c, s, a] = await Promise.all([
          dashboardService.getTotalPacientes(),
          dashboardService.getConsultasSemana(),
          dashboardService.getPacientesSemRetorno(),
          dashboardService.getHorariosDisponiveis()
        ]);
        setData({ totalPacientes: t, consultasSemana: c, pacientesSemRetorno: s, agenda: a });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await agendamentoService.updateStatus(id, newStatus);
      // Recarregar dados
      const a = await dashboardService.getHorariosDisponiveis();
      setData(prev => ({ ...prev, agenda: a }));
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status');
    }
  };

  if (loading) return <div className="loading-container">Carregando Dashboard...</div>;

  return (
    <>
      <header className="header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>Olá, <strong>{user?.email}</strong></span>
        </div>
      </header>

      <div className="cards-grid">
        <div className="card" onClick={() => navigate('/pacientes')}>
          <div className="card-header">
            <Users className="card-icon" />
            <h3>Total de pacientes ativos</h3>
          </div>
          <div className="value">{data.totalPacientes}</div>
        </div>

        <div className="card" onClick={() => setIsConsultasSemanaOpen(true)}>
          <div className="card-header">
            <Calendar className="card-icon" />
            <h3>Consultas da semana</h3>
          </div>
          <div className="value">{data.consultasSemana}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <Clock className="card-icon" />
            <h3>Pacientes sem retorno</h3>
          </div>
          <div className="list">
            {data.pacientesSemRetorno.length > 0 ? (
              data.pacientesSemRetorno.map(p => (
                <div key={p.id} className="list-item" onClick={() => navigate(`/pacientes/${p.id}`)}>
                  {p.nome}
                  <ArrowRight size={14} />
                </div>
              ))
            ) : (
              <p className="empty-msg">Nenhum paciente pendente</p>
            )}
          </div>
        </div>

        <div className="card" onClick={() => setIsModalOpen(true)}>
          <div className="card-header">
            <Calendar className="card-icon" />
            <h3>Horários disponíveis</h3>
          </div>
          <div className="value">{data.agenda.quantidade}</div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsModalOpen(true)} className="btn-secondary">
              Ver Agenda
            </button>
            <button onClick={() => setIsScheduleModalOpen(true)} className="btn-primary">
              Agendar
            </button>
          </div>
        </div>
      </div>

      <ScheduleModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSelectedSlot(null);
        }}
        initialSlot={selectedSlot}
        onScheduleSuccess={async () => {
          const a = await dashboardService.getHorariosDisponiveis();
          setData(prev => ({ ...prev, agenda: a }));
        }}
      />

      {isModalOpen && (
        <div className="modal active" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close-modal" onClick={() => setIsModalOpen(false)}>&times;</span>
            <h2>Agenda Semanal</h2>
            {data.agenda.detalhes.map((d, idx) => (
              <div key={idx} className="agenda-day">
                <strong>{d.dia} ({new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR')})</strong>
                <div className="agenda-times">
                  {d.horários.map((h, hIdx) => (
                    <span 
                      key={hIdx} 
                      className="time-slot" 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => {
                        setSelectedSlot({ data: d.data, horario: h });
                        setIsScheduleModalOpen(true);
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {d.ocupados?.length > 0 && (
                  <div className="agenda-booked" style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Ocupados:</p>
                    {d.ocupados.map(o => (
                      <div key={o.id} className="plan-item" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                        <span>{new Date(o.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {o.pacientes?.nome}</span>
                        <select 
                          value={o.status} 
                          onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                          style={{ width: 'auto', padding: '2px 5px', fontSize: '0.75rem' }}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="realizado">Realizado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {isConsultasSemanaOpen && (
        <div className="modal active" onClick={() => setIsConsultasSemanaOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close-modal" onClick={() => setIsConsultasSemanaOpen(false)}>&times;</span>
            <h2>Consultas da Semana</h2>
            <div className="consultas-lista" style={{ marginTop: '20px' }}>
              {data.agenda.detalhes.some(d => d.ocupados?.length > 0) ? (
                data.agenda.detalhes.flatMap(d => d.ocupados || []).map((o, idx) => (
                  <div key={idx} className="plan-item" style={{ marginBottom: '12px', padding: '15px', background: 'rgba(255, 255, 255, 0.9)' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '1.1rem', color: '#FD99A2' }}>{o.pacientes?.nome}</strong>
                      <span style={{ fontSize: '0.9rem', color: '#555', fontWeight: '500' }}>
                        {new Date(o.data_hora).toLocaleDateString('pt-BR')} às {new Date(o.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className={`status-badge ${o.status}`} style={{ fontSize: '0.8rem' }}>
                      {o.status === 'pendente' ? 'Pendente' : 
                       o.status === 'confirmado' ? 'Confirmado' : 
                       o.status === 'realizado' ? 'Realizado' : 'Cancelado'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="empty-msg">Nenhuma consulta agendada para esta semana.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
