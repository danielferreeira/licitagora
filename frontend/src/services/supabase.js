import { supabase } from '../config/supabase'

// Serviços para Clientes
export const clienteService = {
    // Criar tabela de clientes (se não existir)
    async criarTabelaClientes() {
        const { error } = await supabase.rpc('criar_tabela_clientes');
        if (error) throw error;
    },

    // Buscar todos os clientes
    async listarClientes() {
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('razao_social');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao listar clientes:', error);
            throw error;
        }
    },

    // Buscar cliente por ID
    async buscarClientePorId(id) {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Criar novo cliente
    async criarCliente(cliente) {
        try {
            // Remover formatação dos campos antes de enviar
            const dadosFormatados = {
                ...cliente,
                cnpj: cliente.cnpj?.replace(/\D/g, ''),
                telefone: cliente.telefone?.replace(/\D/g, ''),
                cep: cliente.cep?.replace(/\D/g, ''),
                razao_social: cliente.razao_social?.trim(),
                email: cliente.email?.trim(),
                endereco: cliente.endereco?.trim(),
                numero: cliente.numero?.trim(),
                bairro: cliente.bairro?.trim(),
                cidade: cliente.cidade?.trim(),
                estado: cliente.estado?.trim(),
                ramos_atividade: Array.isArray(cliente.ramos_atividade) ? cliente.ramos_atividade : []
            };

            // Verifica se já existe um cliente com o mesmo CNPJ
            const { data: existingClient } = await supabase
                .from('clientes')
                .select('id')
                .eq('cnpj', dadosFormatados.cnpj)
                .single();

            if (existingClient) {
                throw new Error('Já existe um cliente cadastrado com este CNPJ');
            }

            const { data, error } = await supabase
                .from('clientes')
                .insert([dadosFormatados])
                .select()
                .single();

            if (error) {
                console.error('Erro ao criar cliente:', error);
                throw new Error(error.message);
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            throw error.message ? error : new Error('Erro ao cadastrar cliente');
        }
    },

    // Atualizar cliente
    async atualizarCliente(id, cliente) {
        try {
            // Remover formatação dos campos antes de enviar
            const dadosFormatados = {
                ...cliente,
                cnpj: cliente.cnpj?.replace(/\D/g, ''),
                telefone: cliente.telefone?.replace(/\D/g, ''),
                cep: cliente.cep?.replace(/\D/g, ''),
                razao_social: cliente.razao_social?.trim(),
                email: cliente.email?.trim(),
                endereco: cliente.endereco?.trim(),
                numero: cliente.numero?.trim(),
                bairro: cliente.bairro?.trim(),
                cidade: cliente.cidade?.trim(),
                estado: cliente.estado?.trim(),
                ramos_atividade: Array.isArray(cliente.ramos_atividade) ? cliente.ramos_atividade : []
            };

            const { data, error } = await supabase
                .from('clientes')
                .update(dadosFormatados)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            throw error.message ? error : new Error('Erro ao atualizar cliente');
        }
    },

    // Excluir cliente
    async excluirCliente(id) {
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    },

    // Buscar clientes por ramo
    async buscarClientesPorRamo(ramo) {
        const { data, error } = await supabase
            .rpc('buscar_clientes_por_ramo', { p_ramo_atividade: ramo })
        
        if (error) throw error
        return data
    }
}

// Função auxiliar para formatar valores monetários
const formatarValorMonetario = (valor) => {
    if (valor === null || valor === undefined) return null;
    
    // Se já for um número, retorna ele mesmo
    if (typeof valor === 'number') return valor;
    
    // Se for string, limpa e converte
    const valorLimpo = String(valor)
        .replace(/[^\d.,]/g, '') // Remove tudo exceto números, ponto e vírgula
        .replace(/\./g, '')      // Remove todos os pontos
        .replace(',', '.');      // Substitui vírgula por ponto
    
    // Ajusta para o formato correto considerando centavos
    // Se não houver ponto decimal, assume que são centavos
    if (!valorLimpo.includes('.')) {
        return parseFloat(valorLimpo) / 100;
    }
    
    return parseFloat(valorLimpo);
};

// Serviços para Licitações
export const licitacaoService = {
    // Criar tabela de licitações (se não existir)
    async criarTabelaLicitacoes() {
        const { error } = await supabase.rpc('criar_tabela_licitacoes');
        if (error) throw error;
    },

    // Buscar todas as licitações
    async listarLicitacoes(filtros = {}) {
        try {
            // Construir a query base
            let query = supabase
                .from('licitacoes')
                .select(`
                    *,
                    cliente:clientes (
                        id,
                        razao_social,
                        cnpj,
                        email
                    )
                `);

            // Aplicar filtros
            if (filtros.cliente_id) {
                query = query.eq('cliente_id', filtros.cliente_id);
            }
            if (filtros.modalidade) {
                query = query.eq('modalidade', filtros.modalidade);
            }
            if (filtros.status) {
                query = query.eq('status', filtros.status);
            }
            if (filtros.data_inicio) {
                query = query.gte('data_abertura', filtros.data_inicio);
            }
            if (filtros.data_fim) {
                query = query.lte('data_fim', filtros.data_fim);
            }
            if (filtros.valor_min) {
                const valorMin = typeof filtros.valor_min === 'number' ? 
                    filtros.valor_min : 
                    parseFloat(filtros.valor_min.replace(/\./g, '').replace(',', '.'));
                if (!isNaN(valorMin)) {
                    query = query.gte('valor_estimado', valorMin);
                }
            }
            if (filtros.valor_max) {
                const valorMax = typeof filtros.valor_max === 'number' ? 
                    filtros.valor_max : 
                    parseFloat(filtros.valor_max.replace(/\./g, '').replace(',', '.'));
                if (!isNaN(valorMax)) {
                    query = query.lte('valor_estimado', valorMax);
                }
            }

            // Ordenar por data de abertura
            query = query.order('data_abertura', { ascending: false });

            // Executar a query
            const { data: licitacoes, error: licitacoesError } = await query;

            if (licitacoesError) throw licitacoesError;

            // Se não tem licitações, retorna array vazio
            if (!licitacoes || licitacoes.length === 0) {
                return [];
            }

            return licitacoes;
        } catch (error) {
            console.error('Erro ao listar licitações:', error);
            throw error;
        }
    },

    // Buscar licitação por ID
    async buscarLicitacaoPorId(id) {
        try {
            const { data: licitacao, error: licitacaoError } = await supabase
                .from('licitacoes')
                .select(`
                    *,
                    cliente:clientes (
                        id,
                        razao_social,
                        cnpj,
                        email
                    )
                `)
                .eq('id', id)
                .single();

            if (licitacaoError) throw licitacaoError;
            return licitacao;
        } catch (error) {
            console.error('Erro ao buscar licitação:', error);
            throw error;
        }
    },

    // Criar nova licitação
    async criarLicitacao(licitacao) {
        try {
            // Formatar os dados antes de enviar
            const dadosFormatados = {
                numero: licitacao.numero?.trim(),
                cliente_id: licitacao.cliente_id,
                orgao: licitacao.orgao?.trim(),
                objeto: licitacao.objeto?.trim(),
                modalidade: licitacao.modalidade?.trim(),
                valor_estimado: formatarValorMonetario(licitacao.valor_estimado),
                lucro_estimado: formatarValorMonetario(licitacao.lucro_estimado),
                data_abertura: licitacao.data_abertura?.toISOString(),
                data_fim: licitacao.data_fim?.toISOString(),
                ramos_atividade: Array.isArray(licitacao.ramos_atividade) ? 
                    licitacao.ramos_atividade : 
                    (licitacao.ramos_atividade ? [licitacao.ramos_atividade] : []),
                observacoes: licitacao.observacoes?.trim() || null,
                requisitos: licitacao.requisitos?.trim() || null,
                descricao: licitacao.descricao?.trim() || null,
                status: 'EM_ANDAMENTO'
            };

            // Remove campos undefined ou null
            Object.keys(dadosFormatados).forEach(key => {
                if (dadosFormatados[key] === undefined || dadosFormatados[key] === null) {
                    delete dadosFormatados[key];
                }
            });

            // Garante que o status seja um valor válido do enum
            const statusValidos = ['EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'SUSPENSA', 'FRACASSADA', 'DESERTA'];
            if (!statusValidos.includes(dadosFormatados.status)) {
                throw new Error('Status inválido');
            }

            const { data, error } = await supabase
                .from('licitacoes')
                .insert([dadosFormatados])
                .select()
                .single();

            if (error) {
                console.error('Erro ao criar licitação:', error);
                throw new Error(error.message);
            }

            return data;
        } catch (error) {
            console.error('Erro ao criar licitação:', error);
            throw error.message ? error : new Error('Erro ao cadastrar licitação');
        }
    },

    // Atualizar licitação
    async atualizarLicitacao(id, licitacao) {
        try {
            // Validar o status
            const statusValidos = ['EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'SUSPENSA', 'FRACASSADA', 'DESERTA'];
            if (licitacao.status && !statusValidos.includes(licitacao.status)) {
                throw new Error('Status inválido');
            }

            // Formatar os dados antes de enviar
            const dadosFormatados = {
                numero: licitacao.numero?.trim(),
                cliente_id: licitacao.cliente_id,
                orgao: licitacao.orgao?.trim(),
                objeto: licitacao.objeto?.trim(),
                modalidade: licitacao.modalidade?.trim(),
                valor_estimado: formatarValorMonetario(licitacao.valor_estimado),
                lucro_estimado: formatarValorMonetario(licitacao.lucro_estimado),
                data_abertura: licitacao.data_abertura ? 
                    (typeof licitacao.data_abertura === 'string' ? 
                        licitacao.data_abertura : 
                        licitacao.data_abertura.toISOString()) : null,
                data_fim: licitacao.data_fim ? 
                    (typeof licitacao.data_fim === 'string' ? 
                        licitacao.data_fim : 
                        licitacao.data_fim.toISOString()) : null,
                ramos_atividade: Array.isArray(licitacao.ramos_atividade) ? 
                    licitacao.ramos_atividade : [],
                descricao: licitacao.descricao?.trim() || null,
                requisitos: licitacao.requisitos?.trim() || null,
                observacoes: licitacao.observacoes?.trim() || null,
                status: licitacao.status || 'EM_ANDAMENTO'
            };

            // Remove campos undefined ou null
            Object.keys(dadosFormatados).forEach(key => {
                if (dadosFormatados[key] === undefined || dadosFormatados[key] === null) {
                    delete dadosFormatados[key];
                }
            });

            const { error } = await supabase
                .from('licitacoes')
                .update(dadosFormatados)
                .eq('id', id);

            if (error) {
                console.error('Erro ao atualizar licitação:', error);
                throw new Error(error.message);
            }

            return { id, ...dadosFormatados };
        } catch (error) {
            console.error('Erro ao atualizar licitação:', error);
            throw error.message ? error : new Error('Erro ao atualizar licitação');
        }
    },

    // Excluir licitação
    async excluirLicitacao(id) {
        const { error } = await supabase
            .from('licitacoes')
            .delete()
            .eq('id', id)
        
        if (error) throw error
    },

    // Buscar licitações por ramo
    async buscarLicitacoesPorRamo(ramo) {
        const { data, error } = await supabase
            .rpc('buscar_licitacoes_por_ramo', { p_ramo_atividade: ramo })
        
        if (error) throw error
        return data
    },

    // Buscar licitações por cliente
    async buscarLicitacoesPorCliente(clienteId) {
        const { data, error } = await supabase
            .rpc('buscar_licitacoes_por_cliente', { p_cliente_id: clienteId })
        
        if (error) throw error
        return data
    },

    // Buscar licitações por período
    async buscarLicitacoesPorPeriodo(dataInicio, dataFim) {
        const { data, error } = await supabase
            .rpc('buscar_licitacoes_por_periodo', {
                p_data_inicio: dataInicio,
                p_data_fim: dataFim
            })
        
        if (error) throw error
        return data
    }
}

// Serviços de Documentos
export const documentoService = {
  // Tipos de Documentos
  listarTiposDocumentos: async () => {
    const { data, error } = await supabase
      .from('tipos_documentos')
      .select('*')
      .order('nome');

    if (error) throw error;
    return data;
  },

  // Documentos de Cliente
  listarDocumentosCliente: async (clienteId) => {
    const { data, error } = await supabase
      .from('documentos_cliente')
      .select(`
        *,
        tipo_documento:tipos_documentos(*)
      `)
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  uploadDocumentoCliente: async (formData) => {
    const { arquivo, clienteId, tipoDocumentoId, dataValidade, observacoes, nome } = formData;

    // 1. Upload do arquivo
    const fileExt = arquivo.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `documentos/clientes/${clienteId}/${fileName}`;

    const { error: uploadError } = await supabase
      .storage
      .from('documentos')
      .upload(filePath, arquivo);

    if (uploadError) throw uploadError;

    // 2. Criar registro do documento
    const { data, error } = await supabase
      .from('documentos_cliente')
      .insert({
        cliente_id: clienteId,
        tipo_documento_id: tipoDocumentoId,
        data_validade: dataValidade,
        observacoes,
        nome,
        arquivo_url: filePath
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  excluirDocumentoCliente: async (id, arquivoUrl) => {
    // 1. Excluir arquivo do storage
    if (arquivoUrl) {
      const { error: storageError } = await supabase
        .storage
        .from('documentos')
        .remove([arquivoUrl]);

      if (storageError) throw storageError;
    }

    // 2. Excluir registro do documento
    const { error } = await supabase
      .from('documentos_cliente')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Documentos de Licitação
  listarDocumentosLicitacao: async (licitacaoId) => {
    const { data, error } = await supabase
      .from('documentos_licitacao')
      .select(`
        *,
        tipo_documento:tipos_documentos(*)
      `)
      .eq('licitacao_id', licitacaoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Extrair requisitos do edital
  extrairRequisitosEdital: async (arquivo, licitacaoId) => {
    try {
      console.log('Iniciando extração de requisitos do edital:', { licitacaoId });

      // 1. Upload do arquivo para o storage
      const fileExt = arquivo.name.split('.').pop();
      const fileName = `temp/${licitacaoId}/${Date.now()}.${fileExt}`;
      
      console.log('Fazendo upload do arquivo:', fileName);
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('documentos')
        .upload(fileName, arquivo, {
          contentType: 'application/pdf'
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      try {
        // 2. Obter URL pública do arquivo
        const { data: urlData } = await supabase
          .storage
          .from('documentos')
          .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          throw new Error('Não foi possível obter URL do arquivo');
        }

        // 3. Processar os requisitos usando a função SQL passando a URL
        console.log('Processando requisitos usando URL:', urlData.publicUrl);
        const { data, error: processError } = await supabase
          .rpc('processar_requisitos_edital', {
            p_texto: urlData.publicUrl,
            p_licitacao_id: licitacaoId
          });

        if (processError) {
          console.error('Erro ao processar requisitos:', processError);
          throw processError;
        }

        console.log('Requisitos processados com sucesso:', data);
        return data || [];

      } finally {
        // 4. Remover arquivo temporário
        console.log('Removendo arquivo temporário');
        await supabase
          .storage
          .from('documentos')
          .remove([fileName])
          .catch(err => console.error('Erro ao remover arquivo temporário:', err));
      }
    } catch (error) {
      console.error('Erro detalhado na extração de requisitos:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      throw error;
    }
  },

  uploadDocumentoLicitacao: async (formData) => {
    const { arquivo, licitacaoId, tipoDocumentoId, dataValidade, observacoes, nome } = formData;

    try {
      console.log('Iniciando upload do documento da licitação:', { nome, tipoDocumentoId });

      // 1. Upload do arquivo
      const fileExt = arquivo.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `documentos/licitacoes/${licitacaoId}/${fileName}`;

      console.log('Fazendo upload do arquivo:', filePath);
      const { error: uploadError } = await supabase
        .storage
        .from('documentos')
        .upload(filePath, arquivo);

      if (uploadError) {
        console.error('Erro no upload do arquivo:', uploadError);
        throw uploadError;
      }

      // 2. Criar registro do documento
      console.log('Criando registro do documento no banco');
      const { data: documento, error } = await supabase
        .from('documentos_licitacao')
        .insert({
          licitacao_id: licitacaoId,
          tipo_documento_id: tipoDocumentoId,
          data_validade: dataValidade,
          observacoes,
          nome,
          arquivo_url: filePath
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar registro do documento:', error);
        throw error;
      }

      // 3. Se for um edital, extrair e processar requisitos
      console.log('Verificando tipo do documento');
      const { data: tipoDocumento, error: tipoError } = await supabase
        .from('tipos_documentos')
        .select('nome')
        .eq('id', tipoDocumentoId)
        .single();

      if (tipoError) {
        console.error('Erro ao buscar tipo do documento:', tipoError);
        throw tipoError;
      }

      console.log('Tipo do documento:', tipoDocumento?.nome);
      if (tipoDocumento?.nome.toLowerCase().includes('edital')) {
        console.log('Documento é um edital, iniciando extração de requisitos');
        try {
          // Usar o método extrairRequisitosEdital em vez de tentar converter o arquivo diretamente
          const requisitos = await documentoService.extrairRequisitosEdital(arquivo, licitacaoId);
          console.log('Requisitos extraídos com sucesso:', requisitos);
        } catch (extractError) {
          console.error('Erro ao extrair requisitos do edital:', {
            message: extractError.message,
            details: extractError.details,
            hint: extractError.hint,
            stack: extractError.stack
          });
          // Não interromper o upload se a extração falhar
        }
      }

      return documento;
    } catch (error) {
      console.error('Erro detalhado ao fazer upload:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      throw error;
    }
  },

  excluirDocumentoLicitacao: async (id, arquivoUrl) => {
    // 1. Excluir arquivo do storage
    if (arquivoUrl) {
      const { error: storageError } = await supabase
        .storage
        .from('documentos')
        .remove([arquivoUrl]);

      if (storageError) throw storageError;
    }

    // 2. Excluir registro do documento
    const { error } = await supabase
      .from('documentos_licitacao')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Requisitos de Documentação
  listarRequisitosDocumentacao: async (licitacaoId) => {
    const { data, error } = await supabase
      .from('requisitos_documentacao')
      .select('*')
      .eq('licitacao_id', licitacaoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  criarRequisito: async (requisito) => {
    const { data, error } = await supabase
      .from('requisitos_documentacao')
      .insert(requisito)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  atualizarRequisito: async (id, requisito) => {
    const { data, error } = await supabase
      .from('requisitos_documentacao')
      .update(requisito)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  excluirRequisito: async (id) => {
    const { error } = await supabase
      .from('requisitos_documentacao')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Download de Documentos
  getUrlDownload: async (arquivoUrl) => {
    const { data, error } = await supabase
      .storage
      .from('documentos')
      .createSignedUrl(arquivoUrl, 60); // URL válida por 60 segundos

    if (error) throw error;
    return data.signedUrl;
  }
};

// Serviços para Prazos
export const prazoService = {
  // Listar todos os prazos
  async listarPrazos() {
    const { data, error } = await supabase
      .from('prazos')
      .select(`
        *,
        licitacao:licitacoes (
          id,
          numero,
          orgao,
          objeto,
          status,
          data_fim
        )
      `)
      .order('data_prazo', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Buscar prazo por ID
  async buscarPrazoPorId(id) {
    const { data, error } = await supabase
      .from('prazos')
      .select(`
        *,
        licitacao:licitacoes (
          id,
          numero,
          orgao,
          objeto,
          status,
          data_fim
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar novo prazo
  async criarPrazo(prazo) {
    const { data, error } = await supabase
      .from('prazos')
      .insert([prazo])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Atualizar prazo
  async atualizarPrazo(id, prazo) {
    const { data, error } = await supabase
      .from('prazos')
      .update(prazo)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Excluir prazo
  async excluirPrazo(id) {
    const { error } = await supabase
      .from('prazos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Importar prazos das licitações
  async importarPrazos() {
    const { data, error } = await supabase
      .rpc('importar_prazos_licitacoes');

    if (error) throw error;
    return data;
  }
}; 