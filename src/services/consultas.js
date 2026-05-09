import { supabase } from '../lib/supabase.js'

export const consultaService = {
  async getConsultasByPaciente(pacienteId) {
    const { data, error } = await supabase
      .from('consultas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('data_consulta', { ascending: false })

    if (error) throw error
    return data
  },

  async createConsulta(consultaData) {
    const { data, error } = await supabase
      .from('consultas')
      .insert([consultaData])
      .select()

    if (error) throw error
    return data[0]
  }
}
