import { supabase } from '../lib/supabase.js'

export const mealPlanService = {
  async gerarPlanoComIA(patientData) {
    const response = await fetch('/api/gerar-plano', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dados_do_paciente: patientData })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao gerar plano');
    }

    return await response.json();
  },

  async salvarPlano(pacienteId, conteudo) {
    const { data, error } = await supabase
      .from('planos_alimentares')
      .insert([
        { 
          paciente_id: pacienteId,
          conteudo: conteudo
        }
      ])
      .select()

    if (error) throw error
    return data[0]
  },

  async getHistoricoPlanos(pacienteId) {
    const { data, error } = await supabase
      .from('planos_alimentares')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async updatePlano(id, conteudo) {
    const { data, error } = await supabase
      .from('planos_alimentares')
      .update({ conteudo })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0]
  },

  async deletePlano(id) {
    const { error } = await supabase
      .from('planos_alimentares')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }
}
