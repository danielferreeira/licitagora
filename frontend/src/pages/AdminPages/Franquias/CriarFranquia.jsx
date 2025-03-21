const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  
  try {
    console.log('Iniciando criação de franquia com senha:', senhaUsuario ? '******' : 'nenhuma');
    
    // Validar formulário
    if (!validate()) {
      setLoading(false);
      return;
    }
    
    const { data, error } = await criarFranquia(franquia, senhaUsuario);
    
    if (error) {
      console.error('Erro ao criar franquia:', error);
      setError(error.message || 'Ocorreu um erro ao criar a franquia');
      setLoading(false);
      return;
    }
    
    console.log('Resposta da criação de franquia:', {
      franquia: data?.franquia,
      usuario: data?.usuario
    });
    
    toast.success('Franquia criada com sucesso!');
    
    if (data?.usuario?.sucesso === false) {
      console.warn('Alerta: Usuário não foi criado:', data?.usuario?.mensagem);
      toast.warning('Franquia criada, mas o usuário não pôde ser criado: ' + data?.usuario?.mensagem);
    } else if (data?.usuario) {
      console.log('Usuário criado com sucesso:', data?.usuario);
      toast.success('Usuário da franquia criado com sucesso');
    }
    
    resetForm();
    navigate('/franquias');
  } catch (err) {
    console.error('Exceção ao criar franquia:', err);
    setError('Ocorreu um erro ao processar sua solicitação');
  } finally {
    setLoading(false);
  }
}; 