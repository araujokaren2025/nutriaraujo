import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pacienteService } from '../services/pacientes';
import { consultaService } from '../services/consultas';
import { ArrowLeft, Plus, Save, Calendar } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import ScheduleModal from '../components/ScheduleModal';
import MealPlanEditor from '../components/MealPlanEditor';
import ConsultationModal from '../components/ConsultationModal';
import { agendamentoService } from '../services/agendamentos';
import { mealPlanService } from '../services/mealPlan';
import { Clock, Sparkles, History, ChevronRight } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('historico'); // historico, novo_plano
  const [mealPlans, setMealPlans] = useState([]);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, c, a, m] = await Promise.all([
          pacienteService.getPacienteById(id),
          consultaService.getConsultasByPaciente(id),
          agendamentoService.getAgendamentosByPaciente(id),
          mealPlanService.getHistoricoPlanos(id)
        ]);
        setPatient(p);
        setConsultations(c);
        setUpcomingAppointments(a.filter(item => item.status === 'pendente' || item.status === 'confirmado'));
        setMealPlans(m);
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

  const handleGenerateAIPlan = async () => {
    setLoadingAI(true);
    setGeneratedPlan(null);
    try {
      console.log('Iniciando geração de plano para:', patient.nome);
      const plano = await mealPlanService.gerarPlanoComIA(patient);
      console.log('Plano gerado com sucesso:', plano);
      setGeneratedPlan(plano);
      setActiveTab('novo_plano');
    } catch (err) {
      console.error('Erro detalhado:', err);
      alert('Erro ao gerar plano com IA: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSavePlan = async (planoConteudo) => {
    setLoadingAI(true);
    try {
      await mealPlanService.salvarPlano(id, planoConteudo);
      alert('Plano alimentar salvo com sucesso!');
      const m = await mealPlanService.getHistoricoPlanos(id);
      setMealPlans(m);
      setGeneratedPlan(null);
      setActiveTab('historico');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar plano: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

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
        <button className="btn-primary" onClick={() => setIsScheduleModalOpen(true)}>
          <Calendar size={18} style={{ marginRight: '8px' }} /> Agendar Consulta
        </button>
      </header>

      <div className="perfil-card">
        <h3>Dados do Paciente</h3>
        <p><strong>Email:</strong> {patient.email || 'Não informado'}</p>
        <p><strong>WhatsApp:</strong> {patient.whatsapp || 'Não informado'}</p>
        <p><strong>Objetivos:</strong> {patient.objetivos?.join(', ') || 'Não definidos'}</p>
      </div>

      {upcomingAppointments.length > 0 && (
        <div className="perfil-card" style={{ marginTop: '25px', background: 'rgba(46, 213, 115, 0.05)', border: '1px solid rgba(46, 213, 115, 0.2)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Clock size={20} /> Próximas Consultas</h3>
          {upcomingAppointments.map(a => (
            <div key={a.id} className="plan-item" style={{ background: 'white' }}>
              <div>
                <strong>{new Date(a.data_hora).toLocaleDateString('pt-BR')} às {new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Status: {a.status}</p>
              </div>
              {a.observacoes && <p style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>{a.observacoes}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="perfil-card" style={{ marginTop: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Plano Alimentar</h3>
          {!generatedPlan && (
            <button 
              className="btn-primary" 
              onClick={handleGenerateAIPlan} 
              disabled={loadingAI}
              style={{ background: '#6c5ce7' }}
            >
              <Sparkles size={18} style={{ marginRight: '8px' }} />
              {loadingAI ? 'Gerando Plano (isso leva ~30s)...' : 'Gerar Plano com IA'}
            </button>
          )}
        </div>

        {generatedPlan ? (
          <MealPlanEditor 
            plano={generatedPlan} 
            onSave={handleSavePlan}
            onCancel={() => {
              setGeneratedPlan(null);
              setActiveTab('historico');
            }}
            loading={loadingAI}
          />
        ) : (
          <div className="historico-planos">
            <div className="tabs" style={{ marginBottom: '20px' }}>
              <div 
                className={`tab-item ${activeTab === 'historico' ? 'active' : ''}`}
                onClick={() => setActiveTab('historico')}
              >
                Histórico
              </div>
            </div>

            {mealPlans.length > 0 ? (
              <div style={{ display: 'grid', gap: '10px' }}>
                {mealPlans.map(plan => (
                  <div 
                    key={plan.id} 
                    className="plan-item"
                    onClick={() => setSelectedPlan(plan === selectedPlan ? null : plan)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <History size={16} color="#888" />
                        <strong>Plano de {new Date(plan.created_at).toLocaleDateString('pt-BR')}</strong>
                      </div>
                      <ChevronRight size={18} style={{ transform: selectedPlan === plan ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                    
                    {selectedPlan === plan && (
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', width: '100%' }}>
                        <div style={{ display: 'grid', gap: '20px' }}>
                          {plan.conteudo.plano_semanal.slice(0, 1).map((dia, idx) => (
                            <div key={idx}>
                              <p style={{ fontWeight: '700', marginBottom: '10px' }}>Amostra (Segunda-feira):</p>
                              {Object.entries(dia.refeicoes).map(([meal, options]) => (
                                <p key={meal} style={{ fontSize: '0.9rem', marginBottom: '5px' }}>
                                  <strong>{meal.replace(/_/g, ' ')}:</strong> {options[0]}
                                </p>
                              ))}
                              <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px' }}>* Clique para ver o plano completo (em desenvolvimento)</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-msg">Nenhum plano alimentar gerado ainda.</p>
            )}
          </div>
        )}
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

      <ScheduleModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)}
        initialPatient={patient}
        onScheduleSuccess={async () => {
          const a = await agendamentoService.getAgendamentosByPaciente(id);
          setUpcomingAppointments(a.filter(item => item.status === 'pendente' || item.status === 'confirmado'));
        }}
      />

      <ConsultationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patient={patient}
        onSaveSuccess={async () => {
          // Recarregar as consultas para atualizar o gráfico/timeline
          const c = await consultaService.getConsultasByPaciente(id);
          setConsultations(c);
          
          // Recarregar os dados do paciente (pode ter atualizado alergias/restrições)
          const p = await pacienteService.getPacienteById(id);
          setPatient(p);
        }}
      />
    </>
  );
};

export default PatientProfile;
