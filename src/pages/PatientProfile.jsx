import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pacienteService } from '../services/pacientes';
import { consultaService } from '../services/consultas';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, c] = await Promise.all([
          pacienteService.getPacienteById(id),
          consultaService.getConsultasByPaciente(id)
        ]);
        setPatient(p);
        setConsultations(c);
      } catch (err) {
        console.error(err);
        navigate('/pacientes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="loading-container">Carregando perfil...</div>;

  const chartData = {
    labels: [...consultations].reverse().map(c => new Date(c.data_consulta + 'T00:00:00').toLocaleDateString('pt-BR')),
    datasets: [{
      label: 'Peso (kg)',
      data: [...consultations].reverse().map(c => c.peso),
      borderColor: '#2ed573',
      backgroundColor: 'rgba(46, 213, 115, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      fill: true,
    }]
  };

  return (
    <>
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="btn-secondary" onClick={() => navigate('/pacientes')}>
            <ArrowLeft size={18} /> Voltar
          </button>
          <h1>{patient.nome}</h1>
        </div>
      </header>

      <div className="perfil-card">
        <h3>Dados do Paciente</h3>
        <p><strong>Email:</strong> {patient.email || 'Não informado'}</p>
        <p><strong>WhatsApp:</strong> {patient.whatsapp || 'Não informado'}</p>
        <p><strong>Objetivos:</strong> {patient.objetivos?.join(', ') || 'Não definidos'}</p>
      </div>

      <div className="perfil-card" style={{ marginTop: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>Evolução de Peso</h3>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} style={{ marginRight: '8px' }} /> Nova Consulta
          </button>
        </div>
        
        <div className="chart-container" style={{ height: '300px' }}>
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>

        <div className="timeline" style={{ marginTop: '30px' }}>
          {consultations.length > 0 ? (
            consultations.map(c => (
              <div key={c.id} className="timeline-item">
                <div className="timeline-date">{new Date(c.data_consulta + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                <div className="timeline-content">
                  <p><strong>Peso:</strong> {c.peso}kg | <strong>Gordura:</strong> {c.percentual_gordura}%</p>
                  <p><strong>Obs:</strong> {c.observacoes || '-'}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-msg">Nenhuma consulta registrada</p>
          )}
        </div>
      </div>
    </>
  );
};

export default PatientProfile;
