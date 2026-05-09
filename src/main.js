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

function renderPacientesNovoContent() {
  return `
    <header class="header">
      <h1>Cadastrar Novo Paciente</h1>
      <button id="btn-voltar" class="btn-secondary">&larr; Voltar</button>
    </header>
    <div class="tabs">
      <div class="tab-item ${state.currentTab === 'pessoal' ? 'active' : ''}" data-tab="pessoal">Pessoal</div>
      <div class="tab-item ${state.currentTab === 'clinico' ? 'active' : ''}" data-tab="clinico">Clínico</div>
      <div class="tab-item ${state.currentTab === 'habitos' ? 'active' : ''}" data-tab="habitos">Hábitos</div>
    </div>
    <form id="paciente-form" class="form-container">
      <div id="section-pessoal" class="form-section ${state.currentTab === 'pessoal' ? 'active' : ''}">
        <div class="form-grid">
          <div class="form-group"><label>Nome Completo*</label><input type="text" name="nome" id="nome-paciente" /></div>
          <div class="form-group"><label>Nascimento</label><input type="date" name="data_nascimento" id="dob" /></div>
          <div class="form-group"><label>Sexo</label><select name="sexo"><option value="">Selecione...</option><option>Feminino</option><option>Masculino</option><option>Outro</option></select></div>
          <div class="form-group"><label>Telefone</label><input type="tel" name="telefone" /></div>
          <div class="form-group"><label>WhatsApp</label><input type="tel" name="whatsapp" /></div>
          <div class="form-group"><label>Email</label><input type="email" name="email" /></div>
        </div>
      </div>
      <div id="section-clinico" class="form-section ${state.currentTab === 'clinico' ? 'active' : ''}">
        <div class="form-grid">
          <div class="form-group input-suffix"><label>Peso</label><input type="number" step="0.1" name="peso_inicial" id="weight" /><span>kg</span></div>
          <div class="form-group input-suffix"><label>Altura</label><input type="number" name="altura" id="height" /><span>cm</span></div>
        </div>
        <div class="imc-display"><span>IMC:</span> <span class="imc-value" id="imc-val">---</span></div>
        <div class="form-group"><label>Objetivos</label><div class="checkbox-group">
          ${['Emagrecer', 'Ganhar massa', 'Saúde', 'Performance'].map(o => `<label class="checkbox-item"><input type="checkbox" name="objetivos" value="${o}"> ${o}</label>`).join('')}
        </div></div>
      </div>
      <div id="section-habitos" class="form-section ${state.currentTab === 'habitos' ? 'active' : ''}">
        <div class="form-grid">
          <div class="form-group"><label>Refeições/dia</label><input type="number" name="refeicoes_por_dia" /></div>
          <div class="form-group"><label>Água/dia</label><input type="number" step="0.1" name="litros_agua" /></div>
        </div>
      </div>
      <div class="actions-bar">
        <button type="button" id="btn-next" class="btn-primary">Próximo</button>
        <button type="submit" id="btn-save" class="btn-primary" style="display:none;">Salvar</button>
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
      <button id="btn-nova-consulta" class="btn-primary">+ Nova Consulta</button>
    </header>
    <div class="perfil-grid">
      <div class="perfil-card">
        <h3>Informações Pessoais</h3>
        <p><strong>Nascimento:</strong> ${p.data_nascimento || 'Não informado'}</p>
        <p><strong>Sexo:</strong> ${p.sexo || 'Não informado'}</p>
        <p><strong>Telefone:</strong> ${p.telefone || 'Não informado'}</p>
        <p><strong>WhatsApp:</strong> ${p.whatsapp || 'Não informado'}</p>
        <p><strong>Email:</strong> ${p.email || 'Não informado'}</p>
      </div>
      <div class="perfil-card">
        <h3>Dados Clínicos & Hábitos</h3>
        <p><strong>Peso Inicial:</strong> ${p.peso_inicial ? p.peso_inicial + ' kg' : 'Não informado'}</p>
        <p><strong>Altura:</strong> ${p.altura ? p.altura + ' cm' : 'Não informado'}</p>
        <p><strong>Objetivos:</strong> ${p.objetivos?.join(', ') || 'Nenhum'}</p>
        <p><strong>Refeições/dia:</strong> ${p.refeicoes_por_dia || 'Não informado'}</p>
        <p><strong>Água/dia:</strong> ${p.litros_agua ? p.litros_agua + ' L' : 'Não informado'}</p>
      </div>
    </div>
    <div class="perfil-card" style="margin-top: 25px;">
      <h3>Histórico de Consultas</h3>
      <table class="patients-table">
        <thead><tr><th>Data</th><th>Status</th><th>Observações</th></tr></thead>
        <tbody>
          ${state.consultasPaciente.length > 0
            ? state.consultasPaciente.map(c => {
              // Verifica se a data da consulta é no futuro/hoje (Agendada) ou no passado (Realizada)
              // Em JS o fuso pode afetar, mas para simplificar pegamos a data UTC local
              const hoje = new Date()
              hoje.setHours(0,0,0,0)
              const [ano, mes, dia] = c.data_consulta.split('-')
              const dataCons = new Date(ano, mes - 1, dia)
              const isAgendada = dataCons >= hoje
              const statusStr = isAgendada ? 'Agendada' : 'Realizada'
              
              return `
              <tr>
                <td><strong>${dataCons.toLocaleDateString('pt-BR')}</strong></td>
                <td><span class="status-badge ${isAgendada ? 'agendada' : 'realizada'}">${statusStr}</span></td>
                <td>${c.observacoes || '-'}</td>
              </tr>
            `}).join('')
            : '<tr><td colspan="3" style="text-align:center; padding:20px;">Nenhuma consulta registrada.</td></tr>'
          }
        </tbody>
      </table>
    </div>

    <!-- Modal Nova Consulta -->
    <div id="modal-consulta" class="modal">
      <div class="modal-content" style="max-width: 400px;">
        <span class="close-modal-consulta" style="position:absolute; right:15px; top:15px; cursor:pointer; font-size:1.5rem;">&times;</span>
        <h2>Agendar Consulta</h2>
        <form id="form-consulta">
          <div class="form-group"><label>Data</label><input type="date" name="data_consulta" required /></div>
          <div class="form-group">
            <label>Tipo</label>
            <select name="tipo">
              <option>Primeira Vez</option>
              <option>Retorno</option>
            </select>
          </div>
          <div class="form-group">
            <label>Observações</label>
            <textarea name="observacoes" rows="3"></textarea>
          </div>
          <button type="submit" class="btn-primary" style="width:100%; justify-content:center;">Salvar Consulta</button>
        </form>
      </div>
    </div>
  `
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
    if (search) search.oninput = (e) => { state.searchTerm = e.target.value; debounce(() => loadPacientes(state.searchTerm), 500)(); }
    
    document.querySelectorAll('.patient-row').forEach(row => {
      row.onclick = () => loadPacientePerfil(row.dataset.id)
    })
  }

  if (state.view === 'paciente-perfil') {
    document.getElementById('btn-voltar-perfil').onclick = () => navigate('pacientes-lista')
    document.getElementById('btn-nova-consulta').onclick = () => document.getElementById('modal-consulta').classList.add('active')
    document.querySelector('.close-modal-consulta').onclick = () => document.getElementById('modal-consulta').classList.remove('active')
    
    const formCons = document.getElementById('form-consulta')
    if (formCons) {
      formCons.onsubmit = async (e) => {
        e.preventDefault()
        const fd = new FormData(e.target)
        const formObj = Object.fromEntries(fd.entries())
        
        const data = {
          paciente_id: state.selectedPaciente.id,
          data_consulta: formObj.data_consulta,
          observacoes: formObj.observacoes ? `${formObj.tipo} - ${formObj.observacoes}` : formObj.tipo
        }
        
        try {
          await consultaService.createConsulta(data)
          document.getElementById('modal-consulta').classList.remove('active')
          await loadPacientePerfil(state.selectedPaciente.id)
          alert('Consulta agendada!')
        } catch (err) { alert(err.message) }
      }
    }
  }

  if (state.view === 'pacientes-novo') {
    document.getElementById('btn-voltar').onclick = () => navigate('pacientes-lista')
    const tabs = document.querySelectorAll('.tab-item')
    const sections = document.querySelectorAll('.form-section')
    const btnNext = document.getElementById('btn-next')
    const btnSave = document.getElementById('btn-save')

    const switchTab = (name) => {
      state.currentTab = name
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name))
      sections.forEach(s => s.classList.toggle('active', s.id === `section-${name}`))
      btnNext.style.display = name === 'habitos' ? 'none' : 'flex'
      btnSave.style.display = name === 'habitos' ? 'flex' : 'none'
    }

    tabs.forEach(t => t.onclick = () => switchTab(t.dataset.tab))
    if (btnNext) btnNext.onclick = () => { if (state.currentTab === 'pessoal') switchTab('clinico'); else if (state.currentTab === 'clinico') switchTab('habitos'); }
    
    const w = document.getElementById('weight'), h = document.getElementById('height')
    if (w && h) { const up = () => { document.getElementById('imc-val').innerText = calculateIMC(w.value, h.value) || '---' }; w.oninput = up; h.oninput = up; }
    
    const f = document.getElementById('paciente-form')
    if (f) f.onsubmit = handleSavePaciente
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

async function handleSavePaciente(e) {
  e.preventDefault(); const fd = new FormData(e.target), d = Object.fromEntries(fd.entries())
  if (!d.nome) return alert('Nome obrigatório!')
  d.objetivos = Array.from(fd.getAll('objetivos'))
  try { 
    const result = await pacienteService.createPaciente(d); 
    console.log('[LOG] Paciente cadastrado com sucesso no banco de dados:', d);
    alert('Paciente cadastrado com sucesso!'); 
    navigate('pacientes-lista'); 
  } catch (err) { 
    console.error('[ERRO] Falha ao salvar paciente:', err);
    alert(err.message) 
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
function calculateIMC(w, h) { if (!w || !h) return null; return (w / ((h / 100) ** 2)).toFixed(1); }

let timeout = null
function debounce(f, w) { return function(...a) { clearTimeout(timeout); timeout = setTimeout(() => f.apply(this, a), w); } }

let isAuthInitialized = false;

authService.onAuthStateChange(async (ev, sess) => {
  try {
    if (sess) { 
      state.user = sess.user; 
      state.view = 'dashboard'; 
      await loadDashboardData(); 
      await loadPacientes(); 
    } 
    else { 
      state.user = null; 
      state.view = 'login'; 
    }
  } catch (err) {
    console.error('Erro na inicialização da sessão:', err);
    alert('Erro ao carregar dados do sistema. Verifique o console.');
  } finally {
    isAuthInitialized = true;
    render()
  }
})

render()

// Safety timeout for Supabase lock issues in Vite HMR
setTimeout(() => {
  if (!isAuthInitialized && state.view === 'loading') {
    app.innerHTML = '<div style="color: white; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif;"><p>Parece que o banco de dados travou (Lock roubado pelo recarregamento automático).</p><button style="padding: 10px 20px; border: none; border-radius: 8px; background: #ff6b81; color: white; cursor: pointer;" onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();">Forçar Recarregamento</button></div>'
  }
}, 3000);