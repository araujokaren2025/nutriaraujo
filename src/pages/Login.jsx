import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isSignup) {
        const { error } = await signUp({ email, password });
        if (error) throw error;
        setMessage({ text: 'Cadastro realizado! Verifique seu email.', type: 'success' });
      } else {
        const { error } = await signIn({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="logo">Nutri<span>System</span></div>
      <h2>{isSignup ? 'Crie sua conta profissional' : 'Acesse sua conta'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>E-mail</label>
          <input 
            type="email" 
            placeholder="seu@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <div className="form-group">
          <label>Senha</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Carregando...' : (isSignup ? 'Criar conta' : 'Entrar')}
        </button>
      </form>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <div className="auth-footer">
        {isSignup ? 'Já tem conta?' : 'Não tem conta?'} 
        <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(!isSignup); }}>
          {isSignup ? ' Faça login' : ' Cadastre-se'}
        </a>
      </div>
    </div>
  );
};

export default Login;
