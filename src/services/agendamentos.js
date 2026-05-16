import { supabase } from '../lib/supabase.js'

export const agendamentoService = {
  async getAgendamentosSemana() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('agendamentos')
      .select('*, pacientes(nome)')
      .eq('nutricionista_id', user.id)
      .gte('data_hora', startOfWeek.toISOString())
      .lte('data_hora', endOfWeek.toISOString())
      .order('data_hora', { ascending: true })

    if (error) throw error
    return data
  },

  async getAgendamentosByPaciente(pacienteId) {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('data_hora', { ascending: true })

    if (error) throw error
    return data
  },

  async createAgendamento(agendamentoData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('agendamentos')
      .insert([{ ...agendamentoData, nutricionista_id: user.id }])
      .select()

    if (error) throw error
    return data[0]
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('agendamentos')
      .update({ status })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0]
  },

  async deleteAgendamento(id) {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }
}
