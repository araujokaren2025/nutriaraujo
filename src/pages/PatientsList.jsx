import { useState, useEffect } from 'react';
import { pacienteService } from '../services/pacientes';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';

const PatientsList = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await pacienteService.getPacientes(searchTerm);
        setPatients(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchPatients, searchTerm ? 500 : 0);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <>
      <header className="header">
        <h1>Pacientes</h1>
        <button className="btn-primary" onClick={() => navigate('/pacientes/novo')}>
          <UserPlus size={18} style={{ marginRight: '8px' }} />
          Novo Paciente
        </button>
      </header>

      <div className="search-bar">
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder="Buscar por nome..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Objetivo</th>
              <th>Última Consulta</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>Carregando...</td></tr>
            ) : patients.length > 0 ? (
              patients.map(p => (
                <tr key={p.id} className="patient-row" onClick={() => navigate(`/pacientes/${p.id}`)}>
                  <td><strong>{p.nome}</strong></td>
                  <td>{p.objetivos?.join(', ') || 'Nenhum'}</td>
                  <td>{p.ultima_consulta}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>Nenhum paciente encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PatientsList;
