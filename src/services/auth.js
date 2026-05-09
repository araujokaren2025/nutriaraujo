import { supabase } from '../lib/supabase.js'

export const authService = {
  async signUp(email, password, nome) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      // Salvar na tabela nutricionistas
      const { error: dbError } = await supabase
        .from('nutricionistas')
        .insert([
          { id: data.user.id, nome, email }
        ])
      
      if (dbError) throw dbError
    }

    return data
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
