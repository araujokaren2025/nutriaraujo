import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboard';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [data, setData] = useState({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
    agenda: { quantidade: 0, detalhes: [] }
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        <div className="card">
          <div className="card-header">
            <Users className="card-icon" />
            <h3>Total de pacientes ativos</h3>
          </div>
          <div className="value">{data.totalPacientes}</div>
        </div>

        <div className="card">
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

        <div className="card">
          <div className="card-header">
            <Calendar className="card-icon" />
            <h3>Horários disponíveis</h3>
          </div>
          <div className="value">{data.agenda.quantidade}</div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ marginTop: '15px' }}>
            Ver Agenda
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal active" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close-modal" onClick={() => setIsModalOpen(false)}>&times;</span>
            <h2>Agenda Semanal</h2>
            {data.agenda.detalhes.map((d, idx) => (
              <div key={idx} className="agenda-day">
                <strong>{d.dia}</strong>
                <div className="agenda-times">
                  {d.horários.map((h, hIdx) => (
                    <span key={hIdx} className="time-slot">{h}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
