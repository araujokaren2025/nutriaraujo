import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pacienteService } from '../services/pacientes';
import { consultaService } from '../services/consultas';
import { ArrowLeft, Plus, Save, Calendar } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import ScheduleModal from '../components/ScheduleModal';
import MealPlanEditor from '../components/MealPlanEditor';
import MealPlanViewModal from '../components/MealPlanViewModal';
import ConsultationModal from '../components/ConsultationModal';
import { agendamentoService } from '../services/agendamentos';
import { mealPlanService } from '../services/mealPlan';
import { Clock, Sparkles, History, ChevronRight } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const LOADING_MESSAGES = [
  "Buscando metas, restrições e histórico do paciente...",
  "Conectando à IA Nutricionista (Gemini 2.5)...",
  "Analisando objetivos e calculando nutrientes...",
  "Montando sugestões de cardápios brasileiros...",
  "Refinando opções e evitando repetições diárias...",
  "Quase pronto! Estruturando plano alimentar semanal..."
];

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
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);

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
    setLoadingMessage(LOADING_MESSAGES[0]);

    // Intervalo para atualizar as mensagens de loading a cada 4 segundos
    let currentMsgIndex = 0;
    const msgInterval = setInterval(() => {
      currentMsgIndex = (currentMsgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[currentMsgIndex]);
    }, 4000);

    try {
      console.log('Iniciando geração de plano para:', patient.nome);
      const resData = await mealPlanService.gerarPlanoComIA(patient);
      console.log('Dados recebidos da IA:', resData);

      // Tratamento resiliente caso a resposta precise ser parseada
      let plano;
      if (typeof resData === 'string') {
        try {
          plano = JSON.parse(resData);
        } catch (jsonErr) {
          console.error('Erro ao dar JSON.parse na resposta string:', jsonErr);
          throw new Error('A resposta da inteligência artificial não está em um formato JSON válido.');
        }
      } else {
        plano = resData;
      }

      if (!plano || !plano.plano_semanal) {
        throw new Error('A estrutura do plano gerado pela IA é inválida (campo plano_semanal ausente).');
      }

      setGeneratedPlan(plano);
      setActiveTab('novo_plano');
    } catch (err) {
      console.error('Erro detalhado:', err);
      alert('Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?\n\n(Detalhe do erro: ' + (err.message || 'Erro de conexão') + ')');
    } finally {
      clearInterval(msgInterval);
      setLoadingAI(false);
      setLoadingMessage('');
    }
  };

  const handleSavePlan = async (planoConteudo) => {
    setLoadingAI(true);
    try {
      if (editingPlanId) {
        await mealPlanService.updatePlano(editingPlanId, planoConteudo);
        alert('Plano alimentar atualizado com sucesso!');
      } else {
        await mealPlanService.salvarPlano(id, planoConteudo);
        alert('Plano alimentar salvo com sucesso!');
      }
      const m = await mealPlanService.getHistoricoPlanos(id);
      setMealPlans(m);
      setGeneratedPlan(null);
      setEditingPlanId(null);
      setActiveTab('historico');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar plano: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setGeneratedPlan(plan.conteudo);
    setViewingPlan(null);
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Tem certeza de que deseja excluir este plano alimentar definitivamente?')) return;
    try {
      setLoadingAI(true);
      await mealPlanService.deletePlano(planId);
      alert('Plano alimentar excluído com sucesso!');
      const m = await mealPlanService.getHistoricoPlanos(id);
      setMealPlans(m);
      setViewingPlan(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir plano: ' + err.message);
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
            <div key={a.id} className="plan-item">
              <div>
                <strong>{new Date(a.data_hora).toLocaleDateString('pt-BR')} às {new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>Status: {a.status}</p>
              </div>
              {a.observacoes && <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>{a.observacoes}</p>}
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

        {loadingAI ? (
          <div className="loading-ai-container" style={{ textAlign: 'center', padding: '40px 20px', animation: 'fadeIn 0.3s ease-out' }}>
            <div className="spinner" style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid rgba(253, 153, 162, 0.1)', 
              borderTopColor: '#FD99A2', 
              borderRadius: '50%', 
              margin: '0 auto 20px', 
              animation: 'spin 1s linear infinite' 
            }}></div>
            <p style={{ fontSize: '1.1rem', color: '#fff', fontWeight: '500', marginBottom: '10px' }}>{loadingMessage}</p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Por favor, aguarde cerca de 30 segundos.</p>
          </div>
        ) : generatedPlan ? (
          <MealPlanEditor 
            plano={generatedPlan} 
            onSave={handleSavePlan}
            onCancel={() => {
              setGeneratedPlan(null);
              setEditingPlanId(null);
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
                            <div key={idx} onClick={(e) => e.stopPropagation()}>
                              <p style={{ fontWeight: '700', marginBottom: '10px' }}>Amostra (Segunda-feira):</p>
                              {Object.entries(dia.refeicoes).map(([meal, options]) => (
                                <p key={meal} style={{ fontSize: '0.9rem', marginBottom: '5px' }}>
                                  <strong>{meal.replace(/_/g, ' ')}:</strong> {options[0]}
                                </p>
                              ))}
                              <button
                                className="btn-primary"
                                style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem', marginTop: '15px', background: '#6c5ce7' }}
                                onClick={() => setViewingPlan(plan)}
                              >
                                Visualizar Plano Completo
                              </button>
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

      <MealPlanViewModal
        isOpen={viewingPlan !== null}
        onClose={() => setViewingPlan(null)}
        plan={viewingPlan}
        patientName={patient?.nome}
        onEdit={handleEditPlan}
        onDelete={handleDeletePlan}
      />
    </>
  );
};

export default PatientProfile;
