import { supabase } from '../lib/supabase.js'
import { agendamentoService } from './agendamentos.js'

export const dashboardService = {
  async getTotalPacientes() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { count, error } = await supabase
      .from('pacientes')
      .select('*', { count: 'exact', head: true })
      .eq('nutricionista_id', user.id)
    
    if (error) throw error
    return count || 0
  },

  async getConsultasSemana() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data: pacientes } = await supabase.from('pacientes').select('id').eq('nutricionista_id', user.id)
    if (!pacientes || pacientes.length === 0) return 0
    const pacienteIds = pacientes.map(p => p.id)

    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const { count, error } = await supabase
      .from('consultas')
      .select('*', { count: 'exact', head: true })
      .gte('data_consulta', startOfWeek.toISOString().split('T')[0])
      .lte('data_consulta', endOfWeek.toISOString().split('T')[0])
      .in('paciente_id', pacienteIds)

    if (error) throw error
    return count || 0
  },

  async getPacientesSemRetorno() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Pegar todos os pacientes da nutri
    const { data: pacientes, error } = await supabase
      .from('pacientes')
      .select('id, nome')
      .eq('nutricionista_id', user.id)

    if (error) throw error

    const semRetorno = []

    for (const paciente of pacientes) {
      // Buscar última consulta
      const { data: consultas, error: cError } = await supabase
        .from('consultas')
        .select('data_consulta, proximo_retorno')
        .eq('paciente_id', paciente.id)
        .order('data_consulta', { ascending: false })
        .limit(1)

      if (cError) throw cError

      if (consultas && consultas.length > 0) {
        const ultima = consultas[0]
        const temProximo = ultima.proximo_retorno && new Date(ultima.proximo_retorno) > new Date()
        const foiHaMaisDe30Dias = new Date(ultima.data_consulta) < thirtyDaysAgo

        if (foiHaMaisDe30Dias && !temProximo) {
          semRetorno.push(paciente)
        }
      }
    }

    return semRetorno
  },

  async getHorariosDisponiveis() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { quantidade: 0, detalhes: [] }

    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const agendamentos = await agendamentoService.getAgendamentosSemana()
    
    // Total de 40 slots (5 dias * 8 slots)
    const totalSlots = 40
    const ocupados = agendamentos.filter(a => a.status !== 'cancelado').length
    const disponiveis = totalSlots - ocupados

    // Organizar por dia
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    const detalhes = []

    // Mock das faixas de horários que a nutri atende (exemplo)
    const faixas = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

    for (let i = 1; i <= 5; i++) { // Segunda a Sexta
      const diaNome = dias[i]
      const diaData = new Date(startOfWeek)
      diaData.setDate(startOfWeek.getDate() + i)
      
      const ocupadosNoDia = agendamentos.filter(a => {
        const d = new Date(a.data_hora)
        return d.getDay() === i
      }).map(a => {
        const d = new Date(a.data_hora)
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      })

      detalhes.push({
        dia: diaNome,
        data: diaData.toISOString().split('T')[0],
        horários: faixas.filter(h => !ocupadosNoDia.includes(h)),
        ocupados: agendamentos.filter(a => new Date(a.data_hora).getDay() === i)
      })
    }

    return {
      quantidade: disponiveis > 0 ? disponiveis : 0,
      detalhes: detalhes
    }
  }
}
