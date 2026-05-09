import { supabase } from '../lib/supabase.js'

export const pacienteService = {
  async getPacientes(searchTerm = '') {
    let query = supabase
      .from('pacientes')
      .select('id, nome, objetivos, created_at')
      .order('nome')

    if (searchTerm) {
      query = query.ilike('nome', `%${searchTerm}%`)
    }

    const { data: pacientes, error } = await query
    if (error) throw error

    // Buscar última consulta para cada paciente
    const pacientesComUltimaConsulta = await Promise.all(
      pacientes.map(async (p) => {
        const { data: consultas } = await supabase
          .from('consultas')
          .select('data_consulta')
          .eq('paciente_id', p.id)
          .order('data_consulta', { ascending: false })
          .limit(1)
        
        return {
          ...p,
          ultima_consulta: consultas?.[0]?.data_consulta || 'Nenhuma'
        }
      })
    )

    return pacientesComUltimaConsulta
  },

  async createPaciente(pacienteData) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) throw new Error('Sessão expirada. Por favor, faça login novamente.')
    
    const { data, error } = await supabase
      .from('pacientes')
      .insert([
        { 
          ...pacienteData, 
          nutricionista_id: session.user.id 
        }
      ])
      .select()

    if (error) {
      console.error('Erro Supabase ao inserir paciente:', error)
      throw error
    }
    
    if (!data || data.length === 0) throw new Error('Falha ao criar paciente - nenhum dado retornado')
    return data[0]
  },

  async getPacienteById(id) {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async updatePaciente(id, pacienteData) {
    const { data, error } = await supabase
      .from('pacientes')
      .update(pacienteData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
