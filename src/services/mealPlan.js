import { supabase } from '../lib/supabase.js'

export const mealPlanService = {
  async gerarPlanoComIA(patientData) {
    const { data: { session } } = await supabase.auth.getSession()
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-plano`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'x-gemini-key': import.meta.env.VITE_GEMINI_API_KEY
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
  }
}
