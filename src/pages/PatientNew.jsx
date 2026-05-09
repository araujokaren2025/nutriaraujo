import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pacienteService } from '../services/pacientes';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, ChevronRight, ChevronLeft } from 'lucide-react';

const PatientNew = () => {
  const [currentTab, setCurrentTab] = useState('pessoal');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [],
    patologias_outro: '',
    restricoes_alimentares: [],
    restricoes_outro: '',
    alergias: [],
    alergias_outro: '',
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: '',
    litros_agua: '',
    horario_acorda: '',
    horario_dorme: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCheckboxGroup = (e, field) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const current = prev[field] || [];
      if (checked) return { ...prev, [field]: [...current, value] };
      return { ...prev, [field]: current.filter(item => item !== value) };
    });
  };

  const sanitizeData = (data) => {
    const clean = { ...data };
    
    // Process "Others"
    const processOutro = (mainField, outroField) => {
      if (clean[outroField] && clean[outroField].trim() !== '') {
        if (!clean[mainField]) clean[mainField] = [];
        clean[mainField] = [...clean[mainField], clean[outroField].trim()];
      }
      delete clean[outroField];
    };

    processOutro('objetivos', 'objetivo_texto');
    processOutro('patologias', 'patologias_outro');
    processOutro('restricoes_alimentares', 'restricoes_outro');
    processOutro('alergias', 'alergias_outro');

    // Numbers
    ['peso_inicial', 'altura', 'refeicoes_por_dia', 'litros_agua'].forEach(k => {
      if (clean[k] && clean[k].toString().trim() !== '') {
        let v = parseFloat(clean[k].toString().replace(',', '.'));
        if (k === 'altura' && v > 3) v = v / 100;
        clean[k] = isNaN(v) ? null : v;
      } else clean[k] = null;
    });

    // Empty strings to null
    Object.keys(clean).forEach(k => {
      if (clean[k] === '') clean[k] = null;
    });

    return clean;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome) return alert('Nome é obrigatório!');
    setLoading(true);

    try {
      const clean = sanitizeData(formData);
      clean.nutricionista_id = user.id;
      const result = await pacienteService.createPaciente(clean);
      alert('Paciente cadastrado com sucesso!');
      navigate(`/pacientes/${result.id}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const calculateIMC = () => {
    const p = parseFloat(formData.peso_inicial.toString().replace(',', '.'));
    let h = parseFloat(formData.altura.toString().replace(',', '.'));
    if (isNaN(p) || isNaN(h) || h === 0) return '---';
    if (h > 3) h = h / 100;
    return (p / (h * h)).toFixed(1).replace('.', ',');
  };

  return (
    <>
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="btn-secondary" onClick={() => navigate('/pacientes')}>
            <ArrowLeft size={18} />
            Voltar
          </button>
          <h1>Novo Paciente</h1>
        </div>
      </header>

      <div className="form-container">
        <div className="tabs">
          {['pessoal', 'clinico', 'habitos'].map(tab => (
            <div 
              key={tab}
              className={`tab-item ${currentTab === tab ? 'active' : ''}`}
              onClick={() => setCurrentTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {currentTab === 'pessoal' && (
            <div className="form-section active">
              <div className="form-grid">
                <div className="form-group"><label>Nome Completo*</label><input type="text" name="nome" value={formData.nome} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Nascimento</label><input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleInputChange} /></div>
                <div className="form-group"><label>Sexo</label>
                  <select name="sexo" value={formData.sexo} onChange={handleInputChange}>
                    <option value="">Selecione...</option>
                    <option>Feminino</option>
                    <option>Masculino</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div className="form-group"><label>Telefone</label><input type="tel" name="telefone" value={formData.telefone} onChange={handleInputChange} /></div>
                <div className="form-group"><label>WhatsApp</label><input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} /></div>
                <div className="form-group full-width"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} /></div>
              </div>
            </div>
          )}

          {currentTab === 'clinico' && (
            <div className="form-section active">
              <div className="form-grid">
                <div className="form-group input-suffix"><label>Peso atual</label><input type="text" name="peso_inicial" value={formData.peso_inicial} onChange={handleInputChange} placeholder="0,0" /><span>kg</span></div>
                <div className="form-group input-suffix"><label>Altura</label><input type="text" name="altura" value={formData.altura} onChange={handleInputChange} placeholder="0,00" /><span>m</span></div>
              </div>
              <div className="imc-display"><span>IMC:</span> <span className="imc-value">{calculateIMC()}</span></div>
              
              <div className="form-group"><label>Objetivo</label>
                <div className="checkbox-group">
                  {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral'].map(obj => (
                    <label key={obj} className="checkbox-item">
                      <input type="checkbox" checked={formData.objetivos.includes(obj)} onChange={(e) => handleCheckboxGroup(e, 'objetivos')} value={obj} /> {obj}
                    </label>
                  ))}
                </div>
                <input type="text" name="objetivo_texto" placeholder="Outro objetivo..." value={formData.objetivo_texto} onChange={handleInputChange} style={{ marginTop: '10px' }} />
              </div>

              <div className="form-group"><label>Nível de atividade</label>
                <select name="nivel_atividade" value={formData.nivel_atividade} onChange={handleInputChange}>
                  <option value="">Selecione...</option>
                  {['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo'].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
          )}

          {currentTab === 'habitos' && (
            <div className="form-section active">
              <div className="form-grid">
                <div className="form-group"><label>Refeições/dia</label><input type="text" name="refeicoes_por_dia" value={formData.refeicoes_por_dia} onChange={handleInputChange} /></div>
                <div className="form-group input-suffix"><label>Água/dia</label><input type="text" name="litros_agua" value={formData.litros_agua} onChange={handleInputChange} /><span>litros</span></div>
              </div>
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label><input type="checkbox" name="atividade_fisica" checked={formData.atividade_fisica} onChange={handleInputChange} /> Pratica atividade física?</label>
              </div>
              {formData.atividade_fisica && (
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea name="atividade_fisica_descricao" value={formData.atividade_fisica_descricao} onChange={handleInputChange} rows="2"></textarea>
                </div>
              )}
              <div className="form-group"><label>Observações</label><textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} rows="3"></textarea></div>
            </div >
          )}

          <div className="actions-bar">
            {currentTab !== 'pessoal' && (
              <button type="button" className="btn-secondary" onClick={() => setCurrentTab(currentTab === 'habitos' ? 'clinico' : 'pessoal')}>
                <ChevronLeft size={18} /> Anterior
              </button>
            )}
            {currentTab !== 'habitos' ? (
              <button type="button" className="btn-primary" onClick={() => setCurrentTab(currentTab === 'pessoal' ? 'clinico' : 'habitos')}>
                Próximo <ChevronRight size={18} />
              </button>
            ) : (
              <button type="submit" className="btn-primary" disabled={loading}>
                <Save size={18} style={{ marginRight: '8px' }} />
                {loading ? 'Salvando...' : 'Salvar Cadastro'}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default PatientNew;
