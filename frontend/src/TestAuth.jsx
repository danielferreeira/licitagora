import React, { useState } from 'react';
import { supabase } from './config/supabase';

const TestAuth = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [franquiaId, setFranquiaId] = useState('');
  const [email, setEmail] = useState('teste@teste.com');
  const [password, setPassword] = useState('senha123');
  const [franquias, setFranquias] = useState([]);
  
  const criarUsuario = async () => {
    try {
      setStatus('Criando usuário...');
      setError(null);
      
      // Validar se o ID da franquia foi informado
      if (!franquiaId || franquiaId.trim() === '') {
        setError({
          message: "O ID da franquia é obrigatório",
          details: "Por favor, insira um ID de franquia válido ou clique em 'Buscar Franquias' para obter IDs disponíveis"
        });
        setStatus('Erro: ID da franquia é obrigatório');
        return;
      }
      
      // Validar formato de UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(franquiaId.trim())) {
        setError({
          message: "Formato de UUID inválido",
          details: "O ID da franquia deve estar no formato UUID (ex: 01d647f9-e3df-413d-8678-cdccd8b764c2)"
        });
        setStatus('Erro: Formato de UUID inválido');
        return;
      }
      
      console.log('Enviando ID da franquia:', franquiaId.trim());
      
      const { data, error } = await supabase.rpc(
        'criar_usuario_franquia_v2',
        {
          p_franquia_id: franquiaId.trim(),
          p_email: email,
          p_senha: password,
          p_nome: 'Usuário de Teste'
        }
      );
      
      if (error) {
        console.error('Erro ao criar usuário:', error);
        setError(error);
        setStatus('Erro ao criar usuário');
        return;
      }
      
      console.log('Resposta da criação do usuário:', data);
      setStatus(`Usuário criado com sucesso: ${JSON.stringify(data)}`);
    } catch (err) {
      console.error('Exceção ao criar usuário:', err);
      setError(err);
      setStatus('Exceção ao criar usuário');
    }
  };
  
  const testarLogin = async () => {
    try {
      setStatus('Tentando login...');
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Erro ao fazer login:', error);
        setError(error);
        setStatus('Erro ao fazer login');
        return;
      }
      
      console.log('Resposta do login:', data);
      setStatus(`Login bem-sucedido: ${JSON.stringify(data)}`);
    } catch (err) {
      console.error('Exceção ao fazer login:', err);
      setError(err);
      setStatus('Exceção ao fazer login');
    }
  };
  
  const buscarFranquias = async () => {
    try {
      setStatus('Buscando franquias...');
      setError(null);
      
      const { data, error } = await supabase
        .from('franquias')
        .select('id, nome, email, cnpj')
        .limit(10);
      
      if (error) {
        console.error('Erro ao buscar franquias:', error);
        setError(error);
        setStatus('Erro ao buscar franquias');
        return;
      }
      
      console.log('Franquias encontradas:', data);
      setFranquias(data || []);
      setStatus(`${data?.length || 0} franquias encontradas`);
    } catch (err) {
      console.error('Exceção ao buscar franquias:', err);
      setError(err);
      setStatus('Exceção ao buscar franquias');
    }
  };
  
  const selecionarFranquia = (id) => {
    setFranquiaId(id);
    setStatus(`Franquia ID ${id} selecionada`);
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Teste de Autenticação</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Buscar Franquias</h2>
        <button onClick={buscarFranquias} style={{ padding: '8px 16px', marginRight: '10px' }}>
          Buscar Franquias
        </button>
        
        {franquias.length > 0 && (
          <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            <h3>Franquias Disponíveis</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Nome</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>CNPJ</th>
                  <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {franquias.map(franquia => (
                  <tr key={franquia.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{franquia.nome}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{franquia.email}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{franquia.cnpj}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                      <button 
                        onClick={() => selecionarFranquia(franquia.id)}
                        style={{ padding: '4px 8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Criar Usuário</h2>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>ID da Franquia:</label>
          <input 
            type="text" 
            value={franquiaId} 
            onChange={(e) => setFranquiaId(e.target.value)} 
            style={{ padding: '8px', width: '100%' }}
            placeholder="ex: 01d647f9-e3df-413d-8678-cdccd8b764c2"
          />
          <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
            Selecione uma franquia da lista acima ou digite um ID válido
          </p>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ padding: '8px', width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Senha:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ padding: '8px', width: '100%' }}
          />
        </div>
        <button onClick={criarUsuario} style={{ padding: '8px 16px', marginRight: '10px' }}>
          Criar Usuário
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Testar Login</h2>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ padding: '8px', width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Senha:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ padding: '8px', width: '100%' }}
          />
        </div>
        <button onClick={testarLogin} style={{ padding: '8px 16px' }}>
          Fazer Login
        </button>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Status:</h3>
        <p>{status}</p>
        
        {error && (
          <div style={{ marginTop: '10px' }}>
            <h3>Erro:</h3>
            <pre style={{ backgroundColor: '#ffeeee', padding: '10px', overflowX: 'auto' }}>
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAuth; 