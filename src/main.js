import { authService } from './services/auth.js'
import { dashboardService } from './services/dashboard.js'
import { pacienteService } from './services/pacientes.js'
import { consultaService } from './services/consultas.js'

const app = document.getElementById('app')

const state = {
  view: 'loading',
  user: null,
  message: { text: '', type: '' },
  dashboardData: {
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
    agenda: { quantidade: 0, detalhes: [] }
  },
  pacientes: [],
  selectedPaciente: null,
  consultasPaciente: [],
  currentTab: 'pessoal',
  searchTerm: ''
}

function render() {
  try {
    if (state.view === 'loading') {
      app.innerHTML = '<div style="color: white; height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; font-family: sans-serif;">Iniciando NutriSystem...</div>'
      return
    }

    if (state.view === 'login') {
      renderLogin()
    } else if (state.view === 'signup') {
      renderSignup()
    } else {
      app.innerHTML = `
        <div class="dashboard-layout">
          ${renderSidebar(state.view)}
          <main class="main-content">
            ${renderCurrentView()}
          </main>
        </div>
      `
      attachSystemListeners()
    }
  } catch (err) {
    app.innerHTML = `<div style="color: red; padding: 20px; background: white; z-index: 9999; position: fixed; top: 0; left: 0; width: 100%; height: 100vh; overflow: auto;">
      <h1>Erro Crítico de Renderização</h1>
      <pre>${err.stack}</pre>
      <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();">Recarregar App</button>
    </div>`
  }
}

function renderSidebar(activeView) {
  return `
    <aside class="sidebar">
      <div class="logo">Nutri<span>System</span></div>
      <ul class="nav-menu">
        <li class="nav-item ${activeView === 'dashboard' ? 'active' : ''}" data-view="dashboard">Dashboard</li>
        <li class="nav-item ${activeView.startsWith('pacientes') ? 'active' : ''}" data-view="pacientes-lista">Pacientes</li>
      </ul>
      <div style="margin-top: auto;">
        <button id="btn-logout" class="btn-logout-sidebar">Sair</button>
      </div>
    </aside>
  `
}

function renderCurrentView() {
  if (state.view === 'dashboard') return renderDashboardContent()
  if (state.view === 'pacientes-lista') return renderPacientesListaContent()
  if (state.view === 'pacientes-novo') return renderPacientesNovoContent()
  if (state.view === 'paciente-perfil') return renderPacientePerfilContent()
  return ''
}

function renderLogin() {
  app.innerHTML = `
    <div class="auth-container">
      <div class="logo">Nutri<span>System</span></div>
      <h2>Acesse sua conta</h2>
      <form id="login-form">
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" id="email" placeholder="seu@email.com" required />
        </div>
        <div class="form-group">
          <label>Senha</label>
          <input type="password" id="password" placeholder="••••••••" required />
        </div>
        <button type="submit" id="btn-entrar">Entrar</button>
      </form>
      <div class="message ${state.message.type}">${state.message.text}</div>
      <div class="auth-footer">Não tem conta? <a href="#" id="link-signup">Cadastre-se</a></div>
    </div>
  `
  document.getElementById('login-form').onsubmit = handleLogin
  document.getElementById('link-signup').onclick = (e) => { e.preventDefault(); navigate('signup'); }
}

function renderSignup() {
  app.innerHTML = `
    <div class="auth-container">
      <div class="logo">Nutri<span>System</span></div>
      <h2>Crie sua conta profissional</h2>
      <form id="signup-form">
        <div class="form-group">
          <label>Nome Completo</label>
          <input type="text" id="nome-signup" placeholder="Seu nome" required />
        </div>
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" id="email-signup" placeholder="seu@email.com" required />
        </div>
        <div class="form-group">
          <label>Senha (mín. 6 caracteres)</label>
          <input type="password" id="password-signup" placeholder="••••••••" minlength="6" required />
        </div>
        <div class="form-group">
          <label>Confirmar Senha</label>
          <input type="password" id="confirm-password" placeholder="••••••••" required />
        </div>
        <button type="submit" id="btn-signup">Criar conta</button>
      </form>
      <div class="message ${state.message.type}">${state.message.text}</div>
      <div class="auth-footer">Já tem conta? <a href="#" id="link-login">Faça login</a></div>
    </div>
  `
  document.getElementById('signup-form').onsubmit = handleSignup
  document.getElementById('link-login').onclick = (e) => { e.preventDefault(); navigate('login'); }
}

function renderDashboardContent() {
  const { totalPacientes, consultasSemana, pacientesSemRetorno, agenda } = state.dashboardData
  return `
    <header class="header">
      <h1>Dashboard</h1>
      <div class="user-info">
        <span>Olá, <strong>${state.user?.email || 'Nutricionista'}</strong></span>
      </div>
    </header>
    <div class="cards-grid">
      <div class="card">
        <h3>Total de pacientes ativos</h3>
        <div class="value">${totalPacientes}</div>
      </div>
      <div class="card">
        <h3>Consultas da semana</h3>
        <div class="value">${consultasSemana}</div>
      </div>
      <div class="card">
        <h3>Pacientes sem retorno</h3>
        <div class="list">
          ${pacientesSemRetorno.length > 0 
            ? pacientesSemRetorno.map(p => `<a href="#" class="list-item" data-id="${p.id}">${p.nome}</a>`).join('')
            : '<p class="empty-msg">Nenhum paciente sem retorno no momento</p>'
          }
        </div>
      </div>
      <div class="card">
        <h3>Horários disponíveis na semana</h3>
        <div class="value">${agenda.quantidade}</div>
        <button id="btn-ver-agenda" class="btn-primary" style="margin-top: 15px;">Ver Agenda</button>
      </div>
    </div>
    <div id="modal-agenda" class="modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Agenda Semanal</h2>
        ${agenda.detalhes.map(d => `
          <div class="agenda-day">
            <strong>${d.dia}</strong>
            <div class="agenda-times">${d.horários.map(h => `<span class="time-slot">${h}</span>`).join('')}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function renderPacientesListaContent() {
  return `
    <header class="header">
      <h1>Pacientes</h1>
      <button id="btn-novo-paciente" class="btn-primary">+ Novo Paciente</button>
    </header>
    <div class="search-bar">
      <input type="text" id="search-input" placeholder="Buscar por nome..." value="${state.searchTerm}" />
    </div>
    <table class="patients-table">
      <thead><tr><th>Nome</th><th>Objetivo</th><th>Última Consulta</th></tr></thead>
      <tbody>
        ${state.pacientes.length > 0 
          ? state.pacientes.map(p => `
            <tr class="patient-row" data-id="${p.id}">
              <td><strong>${p.nome}</strong></td>
              <td>${p.objetivos?.join(', ') || 'Nenhum'}</td>
              <td>${p.ultima_consulta}</td>
            </tr>
          `).join('')
          : '<tr><td colspan="3" style="text-align:center; padding:40px;">Nenhum paciente cadastrado.</td></tr>'
        }
      </tbody>
    </table>
  `
}

// Utilities
function formatTime(val) {
  if (!val) return '';
  const numStr = val.replace(/\D/g, '');
  if (!numStr) return '';
  if (numStr.length <= 2) {
    let hours = parseInt(numStr);
    if (hours > 23) hours = 23;
    return `${hours.toString().padStart(2, '0')}:00`;
  }
  let hours = numStr.substring(0, numStr.length - 2);
  let mins = numStr.substring(numStr.length - 2);
  hours = parseInt(hours);
  mins = parseInt(mins);
  if (hours > 23) hours = 23;
  if (mins > 59) mins = 59;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function calculateIdade(dob) {
  if (!dob) return '---';
  const diff = Date.now() - new Date(dob).getTime();
  const age = new Date(diff); 
  return Math.abs(age.getUTCFullYear() - 1970) + ' anos';
}

function calculateIMC(peso, altura) {
  if (!peso || !altura) return '---';
  
  // Converte virgula para ponto para garantir o parse correto
  const p = parseFloat(peso.toString().replace(',', '.'));
  let h = parseFloat(altura.toString().replace(',', '.'));
  
  if (isNaN(p) || isNaN(h)) return '---';
  
  // Lógica inteligente: se altura > 3, assume que está em cm e converte para metros
  // Se for <= 3 (ex: 1,75), já assume que está em metros
  if (h > 3) {
    h = h / 100;
  }
  
  const imc = p / (h * h);
  return imc.toFixed(1).replace('.', ',');
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function renderPacienteForm(p = {}, isEdit = false) {
  const isChecked = (arr, val) => (arr && arr.includes(val)) ? 'checked' : '';
  const hasOutro = (arr, predefined) => arr && arr.some(v => !predefined.includes(v)) ? 'checked' : '';
  const getOutroVal = (arr, predefined) => arr ? arr.find(v => !predefined.includes(v)) || '' : '';
  
  const objList = ['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'];
  const atvList = ['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo', 'Extremamente ativo'];
  const patList = ['Nenhum', 'Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'];
  const restList = ['Nenhum', 'Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'];
  const alergList = ['Nenhum', 'Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];

  return `
    <div class="tabs">
      <div class="tab-item ${state.currentTab === 'pessoal' ? 'active' : ''}" data-tab="pessoal">Pessoal</div>
      <div class="tab-item ${state.currentTab === 'clinico' ? 'active' : ''}" data-tab="clinico">Clínico</div>
      <div class="tab-item ${state.currentTab === 'habitos' ? 'active' : ''}" data-tab="habitos">Hábitos</div>
    </div>
    
    <div id="section-pessoal" class="form-section ${state.currentTab === 'pessoal' ? 'active' : ''}">
      <div class="form-grid">
        <div class="form-group"><label>Nome Completo*</label><input type="text" name="nome" value="${p.nome||''}" /></div>
        <div class="form-group"><label>Nascimento</label><input type="date" name="data_nascimento" id="dob_${isEdit?'edit':'new'}" value="${p.data_nascimento||''}" /></div>
        <div class="form-group"><label>Idade</label><input type="text" id="idade_${isEdit?'edit':'new'}" readonly disabled value="${calculateIdade(p.data_nascimento)}"/></div>
        <div class="form-group"><label>Sexo</label><select name="sexo">
          <option value="">Selecione...</option>
          <option ${p.sexo==='Feminino'?'selected':''}>Feminino</option>
          <option ${p.sexo==='Masculino'?'selected':''}>Masculino</option>
          <option ${p.sexo==='Outro'?'selected':''}>Outro</option>
        </select></div>
        <div class="form-group"><label>Telefone</label><input type="tel" name="telefone" value="${p.telefone||''}" /></div>
        <div class="form-group"><label>WhatsApp</label><input type="tel" name="whatsapp" value="${p.whatsapp||''}" /></div>
        <div class="form-group full-width"><label>Email</label><input type="email" name="email" value="${p.email||''}" /></div>
      </div>
    </div>
    
    <div id="section-clinico" class="form-section ${state.currentTab === 'clinico' ? 'active' : ''}">
      <div class="form-grid">
        <div class="form-group input-suffix"><label>Peso atual</label><input type="text" name="peso_inicial" id="weight_${isEdit?'edit':'new'}" placeholder="0,0" value="${(p.peso_inicial || '').toString().replace('.', ',')}"/><span>kg</span></div>
        <div class="form-group input-suffix"><label>Altura</label><input type="text" name="altura" id="height_${isEdit?'edit':'new'}" placeholder="0,00" value="${(p.altura || '').toString().replace('.', ',')}"/><span>m</span></div>
      </div>
      <div class="imc-display"><span>IMC:</span> <span class="imc-value" id="imc-val_${isEdit?'edit':'new'}">---</span></div>
      
      <div class="form-group"><label>Objetivo</label><div class="checkbox-group">
        ${objList.map(o => `<label class="checkbox-item"><input type="checkbox" name="objetivos" value="${o}" ${isChecked(p.objetivos, o)}> ${o}</label>`).join('')}
      </div><input type="text" name="objetivo_texto" placeholder="Outro objetivo..." value="${p.objetivo_texto||''}" style="margin-top:10px;"/></div>
      
      <div class="form-group"><label>Nível de atividade física</label><select name="nivel_atividade">
        <option value="">Selecione...</option>
        ${atvList.map(a => `<option ${p.nivel_atividade===a?'selected':''}>${a}</option>`).join('')}
      </select></div>

      <div class="form-group"><label>Patologias ou condições</label><div class="checkbox-group">
        ${patList.map(o => `<label class="checkbox-item"><input type="checkbox" name="patologias" value="${o}" ${isChecked(p.patologias, o)}> ${o}</label>`).join('')}
      </div><input type="text" name="patologias_outro" placeholder="Outras patologias..." value="${getOutroVal(p.patologias, patList)}" style="margin-top:10px;"/></div>

      <div class="form-group"><label>Restrições alimentares</label><div class="checkbox-group">
        ${restList.map(o => `<label class="checkbox-item"><input type="checkbox" name="restricoes_alimentares" value="${o}" ${isChecked(p.restricoes_alimentares, o)}> ${o}</label>`).join('')}
      </div><input type="text" name="restricoes_outro" placeholder="Outras restrições..." value="${getOutroVal(p.restricoes_alimentares, restList)}" style="margin-top:10px;"/></div>

      <div class="form-group"><label>Alergias alimentares</label><div class="checkbox-group">
        ${alergList.map(o => `<label class="checkbox-item"><input type="checkbox" name="alergias" value="${o}" ${isChecked(p.alergias, o)}> ${o}</label>`).join('')}
      </div><input type="text" name="alergias_outro" placeholder="Outras alergias..." value="${getOutroVal(p.alergias, alergList)}" style="margin-top:10px;"/></div>

      <div class="form-grid">
        <div class="form-group"><label>Medicamentos contínuos</label><textarea name="medicamentos" rows="2">${p.medicamentos||''}</textarea></div>
        <div class="form-group"><label>Suplementos em uso</label><textarea name="suplementos" rows="2">${p.suplementos||''}</textarea></div>
      </div>
    </div>
    
    <div id="section-habitos" class="form-section ${state.currentTab === 'habitos' ? 'active' : ''}">
      <div class="form-grid">
        <div class="form-group"><label>Refeições/dia</label><input type="text" name="refeicoes_por_dia" placeholder="0" value="${p.refeicoes_por_dia||''}"/></div>
        <div class="form-group input-suffix"><label>Quantidade de água/dia</label><input type="text" name="litros_agua" placeholder="0,0" value="${(p.litros_agua||'').toString().replace('.', ',')}"/><span>litros</span></div>
        <div class="form-group"><label>Horário que acorda</label><input type="text" name="horario_acorda" class="time-input" placeholder="ex: 06:00" value="${p.horario_acorda||''}"/></div>
        <div class="form-group"><label>Horário que dorme</label><input type="text" name="horario_dorme" class="time-input" placeholder="ex: 23:00" value="${p.horario_dorme||''}"/></div>
      </div>
      
      <div class="form-group" style="margin-top:15px;">
        <label><input type="checkbox" name="atividade_fisica" id="atv_fisica_${isEdit?'edit':'new'}" ${p.atividade_fisica?'checked':''}> Pratica atividade física?</label>
      </div>
      <div class="form-group" id="atv_fisica_desc_container_${isEdit?'edit':'new'}" style="display: ${p.atividade_fisica?'block':'none'}">
        <label>Qual atividade e frequência semanal?</label>
        <textarea name="atividade_fisica_descricao" rows="2">${p.atividade_fisica_descricao||''}</textarea>
      </div>
      
      <div class="form-group"><label>Observações gerais</label><textarea name="observacoes" rows="3">${p.observacoes||''}</textarea></div>
    </div>
  `
}

function renderPacientesNovoContent() {
  return `
    <header class="header">
      <h1>Cadastrar Novo Paciente</h1>
      <button id="btn-voltar" class="btn-secondary">&larr; Voltar</button>
    </header>
    <form id="paciente-form" class="form-container">
      ${renderPacienteForm()}
      <div class="actions-bar">
        <button type="button" id="btn-next" class="btn-primary">Próximo</button>
        <button type="button" id="btn-save-new" class="btn-primary" style="display:none;">Salvar Cadastro</button>
      </div>
    </form>
  `
}

function renderPacientePerfilContent() {
  const p = state.selectedPaciente
  if (!p) return '<p>Paciente não encontrado.</p>'
  
  return `
    <header class="header">
      <div style="display:flex; align-items:center; gap: 15px;">
        <button id="btn-voltar-perfil" class="btn-secondary" style="padding:8px 15px; border-radius:8px; border:1px solid #ddd; background:white; cursor:pointer;">&larr; Voltar</button>
        <h1>${p.nome}</h1>
      </div>
    </header>
    
    <!-- DADOS DO PACIENTE -->
    <div class="perfil-card">
      <h3 style="margin-bottom:20px;">Dados do Paciente</h3>
      <form id="paciente-edit-form">
        ${renderPacienteForm(p, true)}
        <div class="actions-bar">
          <button type="button" id="btn-next-edit" class="btn-primary">Próximo</button>
          <button type="button" id="btn-save-edit" class="btn-primary" style="display:none;">Salvar Alterações</button>
        </div>
      </form>
    </div>

    <!-- CONSULTAS -->
    <div class="perfil-card" style="margin-top: 25px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h3>Consultas</h3>
        <button id="btn-nova-consulta" class="btn-primary" style="width:auto; padding:8px 15px;">+ Nova Consulta</button>
      </div>
      
      <div class="chart-container">
        <canvas id="weightChart"></canvas>
      </div>

      <div class="timeline">
        ${state.consultasPaciente.length > 0
          ? state.consultasPaciente.map(c => {
            const dataCons = new Date(c.data_consulta + 'T00:00:00')
            return `
            <div class="timeline-item">
              <div class="timeline-date">${dataCons.toLocaleDateString('pt-BR')}</div>
              <div class="timeline-content">
                <p><strong>Peso:</strong> ${c.peso ? c.peso + ' kg' : '-'}</p>
                <p><strong>Cintura:</strong> ${c.cintura ? c.cintura + ' cm' : '-'}</p>
                <p><strong>Quadril:</strong> ${c.quadril ? c.quadril + ' cm' : '-'}</p>
                <p><strong>Gordura:</strong> ${c.percentual_gordura ? c.percentual_gordura + '%' : '-'}</p>
                <p><strong>Retorno:</strong> ${c.proximo_retorno ? new Date(c.proximo_retorno + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                <p style="grid-column: 1 / -1;"><strong>Obs:</strong> ${c.observacoes || '-'}</p>
              </div>
            </div>
          `}).join('')
          : '<p style="text-align:center; padding:20px; color:#888;">Nenhuma consulta registrada ainda.</p>'
        }
      </div>
    </div>

    <!-- PLANOS ALIMENTARES -->
    <div class="perfil-card" style="margin-top: 25px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h3>Planos Alimentares</h3>
        <button id="btn-gerar-plano" class="btn-primary" style="width:auto; padding:8px 15px;">Gerar Plano Alimentar</button>
      </div>
      <div class="plan-history">
        <p style="text-align:center; padding:20px; color:#888;">Nenhum plano alimentar gerado ainda.</p>
      </div>
    </div>

    <!-- Modal Nova Consulta -->
    <div id="modal-consulta" class="modal">
      <div class="modal-content" style="max-width: 500px;">
        <span class="close-modal-consulta" style="position:absolute; right:15px; top:15px; cursor:pointer; font-size:1.5rem;">&times;</span>
        <h2 style="margin-bottom:20px; color:#333;">Registrar Consulta</h2>
        <form id="form-consulta">
          <div class="form-grid">
            <div class="form-group"><label>Data da Consulta</label><input type="date" name="data_consulta" required value="${new Date().toISOString().split('T')[0]}" /></div>
            <div class="form-group input-suffix"><label>Peso atual</label><input type="text" name="peso" required placeholder="0,0" /><span>kg</span></div>
            <div class="form-group input-suffix"><label>Cintura (opcional)</label><input type="text" name="cintura" placeholder="0,0" /><span>cm</span></div>
            <div class="form-group input-suffix"><label>Quadril (opcional)</label><input type="text" name="quadril" placeholder="0,0" /><span>cm</span></div>
            <div class="form-group input-suffix"><label>% Gordura (opcional)</label><input type="text" name="percentual_gordura" placeholder="0,0" /><span>%</span></div>
            <div class="form-group"><label>Próximo Retorno</label><input type="date" name="proximo_retorno" /></div>
          </div>
          <div class="form-group"><label>Observações</label><textarea name="observacoes" rows="3"></textarea></div>
          <button type="submit" class="btn-primary" style="width:100%;">Salvar consulta</button>
        </form>
      </div>
    </div>
  `
}

let weightChartInstance = null;
function initWeightChart() {
  const canvas = document.getElementById('weightChart');
  if (!canvas) return;
  if (weightChartInstance) {
    weightChartInstance.destroy();
  }

  const consultas = [...state.consultasPaciente].reverse(); // cronológica
  if (consultas.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.font = '14px Inter';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhuma consulta registrada ainda', canvas.width/2, canvas.height/2);
    return;
  }

  const labels = consultas.map(c => {
    const [y,m,d] = c.data_consulta.split('-');
    return `${d}/${m}/${y}`;
  });
  const data = consultas.map(c => c.peso);

  weightChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Evolução de Peso (kg)',
        data,
        borderColor: '#2ed573',
        backgroundColor: 'rgba(46, 213, 115, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#2bad5d'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

function attachSystemListeners() {
  document.querySelectorAll('.nav-item').forEach(i => i.onclick = () => navigate(i.dataset.view))
  const logout = document.getElementById('btn-logout')
  if (logout) logout.onclick = handleLogout

  if (state.view === 'dashboard') {
    document.getElementById('btn-ver-agenda').onclick = () => document.getElementById('modal-agenda').classList.add('active')
    document.querySelector('.close-modal').onclick = () => document.getElementById('modal-agenda').classList.remove('active')
    document.querySelectorAll('.list-item').forEach(el => {
      el.onclick = (e) => {
        e.preventDefault();
        loadPacientePerfil(e.target.dataset.id);
      }
    })
  }

  if (state.view === 'pacientes-lista') {
    document.getElementById('btn-novo-paciente').onclick = () => navigate('pacientes-novo')
    const search = document.getElementById('search-input')
    if (search) {
      const debouncedLoad = debounce(() => loadPacientes(state.searchTerm), 500);
      search.oninput = (e) => { state.searchTerm = e.target.value; debouncedLoad(); }
    }
    
    document.querySelectorAll('.patient-row').forEach(row => {
      row.onclick = () => loadPacientePerfil(row.dataset.id)
    })
  }

  // Comum para formulários (Abas, Cálculos, Formatações)
  const setupFormEvents = (mode) => {
    const tabs = document.querySelectorAll('.tab-item')
    const sections = document.querySelectorAll('.form-section')
    const btnNext = document.getElementById(mode === 'new' ? 'btn-next' : 'btn-next-edit')
    const btnSave = document.getElementById(mode === 'new' ? 'btn-save-new' : 'btn-save-edit')
    
    const switchTab = (name) => {
      state.currentTab = name
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name))
      sections.forEach(s => s.classList.toggle('active', s.id === `section-${name}`))
      if (btnNext && btnSave) {
        btnNext.style.display = name === 'habitos' ? 'none' : 'flex'
        btnSave.style.display = name === 'habitos' ? 'flex' : 'none'
      }
    }
    tabs.forEach(t => t.onclick = () => switchTab(t.dataset.tab))
    if (btnNext) {
      btnNext.onclick = () => {
        if (state.currentTab === 'pessoal') switchTab('clinico')
        else if (state.currentTab === 'clinico') switchTab('habitos')
      }
    }

    // IMC
    const w = document.getElementById(`weight_${mode}`), h = document.getElementById(`height_${mode}`), imcVal = document.getElementById(`imc-val_${mode}`);
    if (w && h && imcVal) { const up = () => { imcVal.innerText = calculateIMC(w.value, h.value) || '---' }; w.oninput = up; h.oninput = up; up(); }

    // Idade
    const dob = document.getElementById(`dob_${mode}`), idadeVal = document.getElementById(`idade_${mode}`);
    if (dob && idadeVal) { dob.oninput = () => { idadeVal.value = calculateIdade(dob.value); } }

    // Horários
    document.querySelectorAll('.time-input').forEach(el => {
      el.oninput = (e) => { e.target.value = formatTime(e.target.value) }
    })

    // Atividade Física
    const atvCheck = document.getElementById(`atv_fisica_${mode}`)
    const atvDesc = document.getElementById(`atv_fisica_desc_container_${mode}`)
    if (atvCheck && atvDesc) {
      atvCheck.onchange = (e) => { atvDesc.style.display = e.target.checked ? 'block' : 'none' }
    }
  }

  if (state.view === 'paciente-perfil') {
    document.getElementById('btn-voltar-perfil').onclick = () => navigate('pacientes-lista')
    document.getElementById('btn-nova-consulta').onclick = () => document.getElementById('modal-consulta').classList.add('active')
    document.querySelector('.close-modal-consulta').onclick = () => document.getElementById('modal-consulta').classList.remove('active')
    
    setupFormEvents('edit')
    
    // Gráfico
    initWeightChart();

    const formEdit = document.getElementById('paciente-edit-form')
    const btnSaveEdit = document.getElementById('btn-save-edit')
    if (formEdit && btnSaveEdit) {
      btnSaveEdit.onclick = () => handleUpdatePaciente(formEdit, state.selectedPaciente.id)
    }

    const formCons = document.getElementById('form-consulta')
    if (formCons) {
      formCons.onsubmit = async (e) => {
        e.preventDefault()
        const fd = new FormData(e.target)
        const formObj = Object.fromEntries(fd.entries())
        
        // Sanitize numbers (Suporte a vírgula)
        const numFields = ['peso', 'cintura', 'quadril', 'percentual_gordura']
        numFields.forEach(k => { 
          if(formObj[k] && formObj[k] !== '') {
            formObj[k] = parseFloat(formObj[k].replace(',', '.'))
          } else {
            formObj[k] = null
          }
        })
        if(formObj.proximo_retorno === '') formObj.proximo_retorno = null
        
        const data = {
          paciente_id: state.selectedPaciente.id,
          data_consulta: formObj.data_consulta,
          peso: formObj.peso,
          cintura: formObj.cintura,
          quadril: formObj.quadril,
          percentual_gordura: formObj.percentual_gordura,
          proximo_retorno: formObj.proximo_retorno,
          observacoes: formObj.observacoes
        }
        
        try {
          await consultaService.createConsulta(data)
          document.getElementById('modal-consulta').classList.remove('active')
          await loadPacientePerfil(state.selectedPaciente.id)
          alert('Consulta salva!')
        } catch (err) { alert(err.message) }
      }
    }
    
    document.getElementById('btn-gerar-plano').onclick = () => alert("Em breve! Esta funcionalidade será implementada no próximo passo.");
  }

  if (state.view === 'pacientes-novo') {
    document.getElementById('btn-voltar').onclick = () => navigate('pacientes-lista')
    setupFormEvents('new')
    
    const f = document.getElementById('paciente-form')
    const btnSaveNew = document.getElementById('btn-save-new')
    if (f && btnSaveNew) {
      btnSaveNew.onclick = () => handleSavePaciente(f)
    }
  }
}

async function handleLogin(e) {
  e.preventDefault(); const email = document.getElementById('email').value, pass = document.getElementById('password').value
  try { await authService.signIn(email, pass) } catch (err) { setMessage(err.message, 'error') }
}

async function handleSignup(e) {
  e.preventDefault(); const n = document.getElementById('nome-signup').value, em = document.getElementById('email-signup').value, p = document.getElementById('password-signup').value
  try { await authService.signUp(em, p, n); setMessage('Sucesso!', 'success') } catch (err) { setMessage(err.message, 'error') }
}

async function handleLogout() { await authService.signOut(); navigate('login'); }

function sanitizePacienteData(d) {
  const clean = { ...d };
  
  if (clean.objetivo_texto !== undefined) {
    if (!clean.objetivos) clean.objetivos = [];
    if (clean.objetivo_texto.trim() !== '') clean.objetivos.push(clean.objetivo_texto);
    delete clean.objetivo_texto;
  }
  if (clean.patologias_outro !== undefined) {
    if (!clean.patologias) clean.patologias = [];
    if (clean.patologias_outro.trim() !== '') clean.patologias.push(clean.patologias_outro);
    delete clean.patologias_outro;
  }
  if (clean.restricoes_outro !== undefined) {
    if (!clean.restricoes_alimentares) clean.restricoes_alimentares = [];
    if (clean.restricoes_outro.trim() !== '') clean.restricoes_alimentares.push(clean.restricoes_outro);
    delete clean.restricoes_outro;
  }
  if (clean.alergias_outro !== undefined) {
    if (!clean.alergias) clean.alergias = [];
    if (clean.alergias_outro.trim() !== '') clean.alergias.push(clean.alergias_outro);
    delete clean.alergias_outro;
  }
  
  if (!clean.atividade_fisica) clean.atividade_fisica_descricao = null
  
  const nums = ['peso_inicial', 'altura', 'refeicoes_por_dia', 'litros_agua']
  nums.forEach(k => { 
    if (clean[k] !== undefined && clean[k] !== null && clean[k].toString().trim() !== '') {
      let val = parseFloat(clean[k].toString().replace(',', '.'));
      if (k === 'altura' && val > 3) val = val / 100;
      clean[k] = isNaN(val) ? null : val;
    } else {
      clean[k] = null;
    }
  })
  
  const textFields = ['data_nascimento', 'sexo', 'telefone', 'whatsapp', 'email', 'nivel_atividade', 'medicamentos', 'suplementos', 'horario_acorda', 'horario_dorme', 'observacoes']
  textFields.forEach(k => { if(clean[k] === '') clean[k] = null })
  
  return clean;
}

async function handleSavePaciente(form) {
  if (!form) return;
  console.log('[DEBUG] Iniciando salvamento manual...');
  
  const rawData = {};
  form.querySelectorAll('input, select, textarea').forEach(el => {
    if (!el.name || el.disabled) return;
    if (el.type === 'checkbox') {
      if (el.name === 'atividade_fisica') { rawData[el.name] = el.checked; }
      else {
        if (!rawData[el.name]) rawData[el.name] = [];
        if (el.checked) rawData[el.name].push(el.value);
      }
    } else { rawData[el.name] = el.value; }
  });

  const d = sanitizePacienteData(rawData);
  console.log('[DEBUG] Dados coletados:', d);
  if (!d.nome) return alert('Nome é obrigatório!');
  
  try { 
    d.nutricionista_id = state.user.id;
    const result = await pacienteService.createPaciente(d); 
    alert('Paciente cadastrado com sucesso!'); 
    await loadPacientePerfil(result.id);
  } catch (err) { 
    console.error(err);
    alert('Erro ao salvar: ' + (err.message || err)); 
  }
}

async function handleUpdatePaciente(form, id) {
  if (!form) return;
  console.log('[DEBUG] Iniciando atualização manual...');
  const d = {};
  form.querySelectorAll('input, select, textarea').forEach(el => {
    if (!el.name || el.disabled) return;
    if (el.type === 'checkbox') {
      if (el.name === 'atividade_fisica') d[el.name] = el.checked;
      else {
        if (!d[el.name]) d[el.name] = [];
        if (el.checked) d[el.name].push(el.value);
      }
    } else { d[el.name] = el.value; }
  });

  const cleanData = sanitizePacienteData(d);
  try {
    await pacienteService.updatePaciente(id, cleanData);
    alert('Alterações salvas!');
    await loadPacientePerfil(id);
  } catch (err) { 
    console.error(err);
    alert(err.message); 
  }
}

async function loadDashboardData() {
  try {
    const [t, c, s, a] = await Promise.all([dashboardService.getTotalPacientes(), dashboardService.getConsultasSemana(), dashboardService.getPacientesSemRetorno(), dashboardService.getHorariosDisponiveis()])
    state.dashboardData = { totalPacientes: t, consultasSemana: c, pacientesSemRetorno: s, agenda: a }; render()
  } catch (e) { console.error(e) }
}

async function loadPacientes(s = '') { 
  try {
    state.pacientes = await pacienteService.getPacientes(s); 
    render(); 
  } catch (err) {
    console.error('Erro ao carregar pacientes:', err);
    state.pacientes = [];
    render();
  }
}

async function loadPacientePerfil(id) {
  state.view = 'loading'
  render()
  try {
    state.selectedPaciente = await pacienteService.getPacienteById(id)
    state.consultasPaciente = await consultaService.getConsultasByPaciente(id)
    state.view = 'paciente-perfil'
    render()
  } catch (err) {
    console.error(err)
    alert('Erro ao carregar paciente')
    navigate('pacientes-lista')
  }
}

function navigate(v) { state.view = v; state.message = { text: '', type: '' }; state.currentTab = 'pessoal'; render(); }
function setMessage(t, ty) { state.message = { text: t, type: ty }; render(); }


let isAuthInitialized = false;

authService.onAuthStateChange(async (ev, sess) => {
  try {
    if (sess) { 
      state.user = sess.user; 
      state.view = 'dashboard'; 
      render(); // Renderiza o layout do dashboard imediatamente enquanto carrega os dados
      await loadDashboardData(); 
      await loadPacientes(); 
    } 
    else { 
      state.user = null; 
      state.view = 'login'; 
      render();
    }
  } catch (err) {
    console.error('Erro na inicialização da sessão:', err);
  } finally {
    isAuthInitialized = true;
    render()
  }
})

render()

// Safety timeout: Se após 5 segundos ainda estiver na tela de loading, algo deu errado
setTimeout(() => {
  const isLoadingVisible = document.body.innerText.includes('Iniciando NutriSystem...');
  if (isLoadingVisible && !isAuthInitialized) {
    app.innerHTML = `
      <div style="color: white; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; text-align: center; padding: 20px;">
        <p style="font-size: 1.2rem; margin-bottom: 20px;">O sistema está demorando mais que o esperado para iniciar.</p>
        <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 30px;">Isso pode ser um problema de conexão com o banco de dados.</p>
        <button style="padding: 12px 24px; border: none; border-radius: 8px; background: #ff6b81; color: white; font-weight: bold; cursor: pointer;" onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();">
          Forçar Recarregamento
        </button>
      </div>
    `;
  }
}, 5000);