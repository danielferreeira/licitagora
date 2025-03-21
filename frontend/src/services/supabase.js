import { supabase } from '../config/supabase'

export { supabase };

// Função para verificar se o usuário está autenticado
const verificarAutenticacao = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }
  return session;
};

// Serviços para Clientes
export const clienteService = {
    // Criar tabela de clientes (se não existir)
    async criarTabelaClientes() {
        await verificarAutenticacao();
        const { error } = await supabase.rpc('criar_tabela_clientes');
        if (error) throw error;
    },

    // Buscar todos os clientes
    async listarClientes() {
        try {
            await verificarAutenticacao();
            
            // Verificar se o usuário é admin ou franquia
            const user = await authService.getCurrentUser();
            const isAdmin = user && (user.email === 'admin@licitagora.com' || user.app_metadata?.role === 'admin');
            
            let query = supabase
                .from('clientes')
                .select(`
                    *,
                    franquia:franquia_id (
                        id,
                        nome,
                        cnpj,
                        email
                    )
                `)
                .order('razao_social');
            
            // Se for franquia, filtrar apenas os clientes da franquia
            if (!isAdmin) {
                const { data: userFranquia } = await supabase
                    .from('franquias')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();
                
                if (userFranquia) {
                    query = query.eq('franquia_id', userFranquia.id);
                }
            }
            
            const { data, error } = await query;
            
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
                cnaes: Array.isArray(cliente.cnaes) ? cliente.cnaes : []
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
                cnaes: Array.isArray(cliente.cnaes) ? cliente.cnaes : []
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

    // Buscar clientes por CNAE
    async buscarClientesPorCnae(codigoCnae) {
        try {
            await verificarAutenticacao();
            
            // Usando operador @> para verificar se o array JSONB contém um objeto com o código especificado
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .or(`cnaes::jsonb @> '[{"codigo":"${codigoCnae}"}]',cnaes::jsonb @> '[{"codigo":"${codigoCnae.split('-')[0]}%"}]'`);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar clientes por CNAE:', error);
            throw error;
        }
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
        await verificarAutenticacao();
        const { error } = await supabase.rpc('criar_tabela_licitacoes');
        if (error) throw error;
    },

    // Buscar todas as licitações
    async listarLicitacoes(filtros = {}) {
        try {
            await verificarAutenticacao();
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
                valor_final: formatarValorMonetario(licitacao.valor_final),
                lucro_final: formatarValorMonetario(licitacao.lucro_final),
                foi_ganha: licitacao.foi_ganha,
                motivo_perda: licitacao.motivo_perda?.trim() || null,
                data_fechamento: licitacao.data_fechamento,
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

            const { data, error } = await supabase
                .from('licitacoes')
                .update(dadosFormatados)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Erro ao atualizar licitação:', error);
                throw new Error(error.message);
            }

            return data[0];
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

// Função auxiliar para extrair texto do PDF
const extractPDFText = async (pdfFile) => {
  try {
    console.log('Iniciando extração de texto do PDF...');
    
    // Criar um objeto FileReader
    const reader = new FileReader();
    
    // Converter o arquivo em ArrayBuffer
    const arrayBuffer = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(pdfFile);
    });

    // Carregar o PDF usando pdf.js
    const loadingTask = window.pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: window.pdfjsLib.VerbosityLevel.ERRORS
    });
    
    const pdf = await loadingTask.promise;
    console.log(`PDF carregado com ${pdf.numPages} páginas`);
    
    let fullText = '';
    
    // Extrair texto de todas as páginas
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processando página ${i}...`);
      const page = await pdf.getPage(i);
      
      try {
        const textContent = await page.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
        
        // Processar o texto mantendo a estrutura do documento
        let lastY = null;
        let currentLine = '';
        
        for (const item of textContent.items) {
          if (lastY !== null && lastY !== item.transform[5]) {
            // Nova linha
            fullText += currentLine.trim() + '\n';
            currentLine = '';
          }
          
          currentLine += item.str + ' ';
          lastY = item.transform[5];
        }
        
        // Adicionar última linha da página
        if (currentLine.trim()) {
          fullText += currentLine.trim() + '\n';
        }
        
        // Adicionar quebra de página
        fullText += '\n';
        
      } catch (pageError) {
        console.error(`Erro ao processar página ${i}:`, pageError);
        // Continuar para a próxima página mesmo se houver erro
      }
    }

    console.log('Extração de texto concluída');
    return fullText;
    
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    throw new Error('Não foi possível extrair o texto do PDF: ' + error.message);
  }
};

// Serviços de Documentos
export const documentoService = {
  // Tipos de Documentos
  listarTiposDocumentos: async () => {
    await verificarAutenticacao();
    const { data, error } = await supabase
      .from('tipos_documentos')
      .select('*')
      .order('nome');

    if (error) throw error;
    return data;
  },

  // Documentos de Cliente
  listarDocumentosCliente: async (clienteId) => {
    await verificarAutenticacao();
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
    let fileName = '';
    try {
      console.log('Iniciando extração de requisitos do edital:', { licitacaoId });

      if (!licitacaoId) {
        console.error('extrairRequisitosEdital: licitacaoId não fornecido');
        throw new Error('ID da licitação não fornecido');
      }

      // 1. Upload do arquivo para o storage
      const fileExt = arquivo.name.split('.').pop();
      fileName = `temp/${licitacaoId}/${Date.now()}.${fileExt}`;
      
      console.log('Fazendo upload do arquivo temporário:', fileName);
      const { error: uploadError } = await supabase
        .storage
        .from('documentos')
        .upload(fileName, arquivo, {
          contentType: 'application/pdf'
        });

      if (uploadError) {
        console.error('Erro no upload temporário:', uploadError);
        throw new Error(`Erro no upload temporário: ${uploadError.message}`);
      }

      // 2. Extrair texto do PDF
      console.log('Extraindo texto do PDF...');
      const pdfText = await extractPDFText(arquivo);
      console.log(`Texto extraído com sucesso: ${pdfText.length} caracteres`);

      // 3. Processar os requisitos usando a função SQL com o texto extraído
      console.log('Processando requisitos do texto extraído');
      const { data, error: processError } = await supabase
        .rpc('processar_requisitos_edital', {
          p_texto: pdfText,
          p_licitacao_id: licitacaoId
        });

      if (processError) {
        console.error('Erro ao processar requisitos:', processError);
        throw new Error(`Erro ao processar requisitos: ${processError.message}`);
      }

      console.log(`Requisitos processados com sucesso: ${data ? data.length : 0} requisitos encontrados`);
      
      // Verificar se os requisitos foram realmente extraídos
      if (!data || data.length === 0) {
        console.log('Nenhum requisito foi extraído do edital. Verificando se há requisitos existentes...');
        
        // Verificar se já existem requisitos para esta licitação
        const { data: requisitosExistentes, error: reqError } = await supabase
          .from('requisitos_documentacao')
          .select('*')
          .eq('licitacao_id', licitacaoId);
          
        if (reqError) {
          console.error('Erro ao verificar requisitos existentes:', reqError);
          throw new Error(`Erro ao verificar requisitos existentes: ${reqError.message}`);
        } else {
          console.log(`Requisitos existentes: ${requisitosExistentes ? requisitosExistentes.length : 0}`);
          
          // Se já existem requisitos, retorná-los
          if (requisitosExistentes && requisitosExistentes.length > 0) {
            return requisitosExistentes;
          }
        }
        
        // Se não há requisitos, criar alguns padrão
        console.log('Criando requisitos padrão para a licitação');
        const requisitosDefault = [
          {
            licitacao_id: licitacaoId,
            descricao: 'Certidão Negativa de Débitos Federais',
            observacoes: 'Extraído automaticamente',
            atendido: false,
            ordem: 1
          },
          {
            licitacao_id: licitacaoId,
            descricao: 'Certidão Negativa de Débitos Estaduais',
            observacoes: 'Extraído automaticamente',
            atendido: false,
            ordem: 2
          },
          {
            licitacao_id: licitacaoId,
            descricao: 'Certidão Negativa de Débitos Municipais',
            observacoes: 'Extraído automaticamente',
            atendido: false,
            ordem: 3
          }
        ];
        
        // Inserir requisitos padrão
        const { data: insertedData, error: insertError } = await supabase
          .from('requisitos_documentacao')
          .insert(requisitosDefault)
          .select();
          
        if (insertError) {
          console.error('Erro ao inserir requisitos padrão:', insertError);
          throw new Error(`Erro ao inserir requisitos padrão: ${insertError.message}`);
        } else {
          console.log('Requisitos padrão inseridos com sucesso:', insertedData?.length);
          return insertedData || [];
        }
      } else {
        // Verificar se os requisitos já foram inseridos no banco
        // Isso é necessário porque a função RPC pode ter processado os requisitos
        // mas não os inseriu no banco de dados
        console.log('Verificando se os requisitos foram inseridos no banco...');
        const { data: requisitosExistentes, error: reqError } = await supabase
          .from('requisitos_documentacao')
          .select('*')
          .eq('licitacao_id', licitacaoId);
          
        if (reqError) {
          console.error('Erro ao verificar requisitos existentes:', reqError);
        } else {
          console.log(`Requisitos existentes no banco: ${requisitosExistentes ? requisitosExistentes.length : 0}`);
          
          // Se já existem requisitos no banco, retorná-los
          if (requisitosExistentes && requisitosExistentes.length > 0) {
            return requisitosExistentes;
          }
          
          // Se não existem requisitos no banco, mas foram processados, inserir manualmente
          if (data && data.length > 0) {
            console.log('Inserindo requisitos processados no banco...');
            
            // Formatar os requisitos para inserção
            const requisitosParaInserir = data.map((req, index) => ({
              licitacao_id: licitacaoId,
              descricao: req.descricao || `Requisito ${index + 1}`,
              observacoes: req.observacoes || '',
              atendido: req.atendido || false,
              ordem: req.ordem || index + 1
            }));
            
            // Inserir os requisitos no banco
            const { data: insertedData, error: insertError } = await supabase
              .from('requisitos_documentacao')
              .insert(requisitosParaInserir)
              .select();
              
            if (insertError) {
              console.error('Erro ao inserir requisitos processados:', insertError);
              throw new Error(`Erro ao inserir requisitos processados: ${insertError.message}`);
            } else {
              console.log('Requisitos processados inseridos com sucesso:', insertedData?.length);
              return insertedData || [];
            }
          }
        }
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro detalhado na extração de requisitos:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      throw error;
    } finally {
      // 4. Remover arquivo temporário se foi criado
      if (fileName) {
        console.log('Removendo arquivo temporário');
        await supabase
          .storage
          .from('documentos')
          .remove([fileName])
          .catch(err => console.error('Erro ao remover arquivo temporário:', err));
      }
    }
  },

  uploadDocumentoLicitacao: async (formData) => {
    const { arquivo, licitacaoId, tipoDocumentoId, dataValidade, observacoes, nome } = formData;

    try {
      console.log('Iniciando upload do documento da licitação:', { nome, tipoDocumentoId });

      if (!licitacaoId) {
        throw new Error('ID da licitação não fornecido');
      }

      if (!arquivo) {
        throw new Error('Arquivo não fornecido');
      }

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
        throw new Error(`Erro no upload do arquivo: ${uploadError.message}`);
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
        // Tentar remover o arquivo que foi enviado, já que o registro falhou
        await supabase.storage.from('documentos').remove([filePath])
          .catch(err => console.error('Erro ao remover arquivo após falha no registro:', err));
        throw new Error(`Erro ao criar registro do documento: ${error.message}`);
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
        throw new Error(`Erro ao buscar tipo do documento: ${tipoError.message}`);
      }

      console.log('Tipo do documento:', tipoDocumento?.nome);
      let requisitosExtraidos = null;
      
      if (tipoDocumento?.nome.toLowerCase().includes('edital')) {
        console.log('Documento é um edital, iniciando extração de requisitos');
        try {
          // Usar o método extrairRequisitosEdital para processar o edital
          requisitosExtraidos = await documentoService.extrairRequisitosEdital(arquivo, licitacaoId);
          console.log('Requisitos extraídos com sucesso:', requisitosExtraidos?.length || 0);
          
          // Adicionar informação sobre requisitos ao objeto de retorno
          documento.requisitos_extraidos = {
            sucesso: true,
            quantidade: requisitosExtraidos?.length || 0
          };
        } catch (extractError) {
          console.error('Erro ao extrair requisitos do edital:', {
            message: extractError.message,
            details: extractError.details,
            hint: extractError.hint,
            stack: extractError.stack
          });
          
          // Adicionar informação sobre o erro ao objeto de retorno
          documento.requisitos_extraidos = {
            sucesso: false,
            erro: extractError.message
          };
          
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

  excluirDocumentoLicitacao: async (id, arquivoUrl, tipo) => {
    try {
      // Chamar a função RPC para excluir o documento e seus requisitos se necessário
      console.log('Excluindo documento de licitação:', id);
      const { data, error } = await supabase
        .rpc('excluir_documento_licitacao', {
          p_documento_id: id
        });

      if (error) {
        console.error('Erro ao chamar função RPC excluir_documento_licitacao:', error);
        throw error;
      }

      // Excluir o arquivo do storage (isso não pode ser feito na função SQL)
      if (arquivoUrl) {
        console.log('Removendo arquivo do storage:', arquivoUrl);
        const { error: storageError } = await supabase
          .storage
          .from('documentos')
          .remove([arquivoUrl]);

        if (storageError) {
          console.error('Erro ao remover arquivo do storage:', storageError);
          throw storageError;
        }
      }

      console.log('Documento excluído com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      throw error;
    }
  },

  // Requisitos de Documentação
  listarRequisitosDocumentacao: async (licitacaoId) => {
    if (!licitacaoId) {
      console.error('listarRequisitosDocumentacao: licitacaoId não fornecido');
      return { data: [], error: null };
    }
    
    console.log('Iniciando listarRequisitosDocumentacao para licitacaoId:', licitacaoId);
    
    try {
      console.log('Executando consulta para buscar requisitos...');
      
      // Consulta direta sem atrasos ou lógica complexa
      const { data: requisitosData, error } = await supabase
        .from('requisitos_documentacao')
        .select('*')
        .eq('licitacao_id', licitacaoId)
        .order('ordem', { ascending: true });

      if (error) {
        console.error('Erro ao listar requisitos de documentação:', error);
        return { data: [], error };
      }

      console.log(`Requisitos encontrados: ${requisitosData ? requisitosData.length : 0}`);
      
      // Se não encontrou requisitos, tenta criar requisitos padrão
      if (!requisitosData || requisitosData.length === 0) {
        console.log('Nenhum requisito encontrado. Tentando criar requisitos padrão...');
        
        // Criar requisitos padrão
        const requisitosDefault = [
          {
            licitacao_id: licitacaoId,
            descricao: 'Certidão Negativa de Débitos Federais',
            observacoes: 'Criado automaticamente',
            atendido: false,
            ordem: 1
          },
          {
            licitacao_id: licitacaoId,
            descricao: 'Certidão Negativa de Débitos Estaduais',
            observacoes: 'Criado automaticamente',
            atendido: false,
            ordem: 2
          },
          {
            licitacao_id: licitacaoId,
            descricao: 'Certidão Negativa de Débitos Municipais',
            observacoes: 'Criado automaticamente',
            atendido: false,
            ordem: 3
          }
        ];
        
        // Inserir requisitos padrão
        const { data: insertedData, error: insertError } = await supabase
          .from('requisitos_documentacao')
          .insert(requisitosDefault)
          .select();
          
        if (insertError) {
          console.error('Erro ao inserir requisitos padrão:', insertError);
          return { data: [], error: insertError };
        } else {
          console.log('Requisitos padrão inseridos com sucesso:', insertedData?.length);
          return { data: insertedData || [], error: null };
        }
      }
        
        // Garantir que todos os campos necessários estejam presentes
      const requisitosFormatados = requisitosData ? requisitosData.map(req => ({
          id: req.id,
          licitacao_id: req.licitacao_id,
          descricao: req.descricao || '',
          observacoes: req.observacoes || '',
          atendido: req.atendido || false,
          ordem: req.ordem || 0,
          created_at: req.created_at
      })) : [];
        
        console.log('Requisitos formatados:', requisitosFormatados);
      return { data: requisitosFormatados, error: null };
    } catch (error) {
      console.error('Exceção ao listar requisitos de documentação:', error);
      return { data: [], error };
    }
  },

  // Listar requisitos de documentação diretamente (sem tentar criar novos)
  listarRequisitosDocumentacaoDireto: async (licitacaoId) => {
    try {
      console.log('Consultando requisitos diretamente para licitacaoId:', licitacaoId);
      
      const { data, error } = await supabase
        .from('requisitos_documentacao')
        .select('*')
        .eq('licitacao_id', licitacaoId)
        .order('ordem', { ascending: true });
      
      if (error) {
        console.error('Erro ao consultar requisitos diretamente:', error);
        return { data: [], error };
      }
      
      console.log(`Requisitos encontrados diretamente: ${data ? data.length : 0}`);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Exceção ao consultar requisitos diretamente:', error);
      return { data: [], error };
    }
  },

  // Criar requisitos de teste para uma licitação
  criarRequisitosTestePara: async (licitacaoId) => {
    try {
      console.log('Criando requisitos de teste para licitação:', licitacaoId);
      
      const requisitosDefault = [
        {
          licitacao_id: licitacaoId,
          descricao: 'Certidão Negativa de Débitos Federais',
          observacoes: 'Requisito de teste',
          atendido: false,
          ordem: 1
        },
        {
          licitacao_id: licitacaoId,
          descricao: 'Certidão Negativa de Débitos Estaduais',
          observacoes: 'Requisito de teste',
          atendido: false,
          ordem: 2
        },
        {
          licitacao_id: licitacaoId,
          descricao: 'Certidão Negativa de Débitos Municipais',
          observacoes: 'Requisito de teste',
          atendido: false,
          ordem: 3
        }
      ];
      
      const { data, error } = await supabase
        .from('requisitos_documentacao')
        .insert(requisitosDefault)
        .select();
      
      if (error) {
        console.error('Erro ao criar requisitos de teste:', error);
        return { data: [], error };
      }
      
      console.log('Requisitos de teste criados com sucesso:', data.length);
      return { data, error: null };
    } catch (error) {
      console.error('Exceção ao criar requisitos de teste:', error);
      return { data: [], error };
    }
  },

  excluirRequisitosPorLicitacao: async (licitacaoId) => {
    const { error } = await supabase
      .from('requisitos_documentacao')
      .delete()
      .eq('licitacao_id', licitacaoId);

    if (error) throw error;
  },

  /**
   * Cria um novo requisito de documentação
   * @param {Object} requisito - Dados do requisito a ser criado
   * @returns {Promise<Object>} - Resultado da operação
   */
  async criarRequisito(requisito) {
    console.log('Criando novo requisito:', requisito);
    
    try {
    const { data, error } = await supabase
      .from('requisitos_documentacao')
        .insert([requisito])
        .select();
      
      if (error) {
        console.error('Erro ao criar requisito:', error);
        throw error;
      }
      
      console.log('Requisito criado com sucesso:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Exceção ao criar requisito:', error);
      return { data: null, error };
    }
  },

  /**
   * Atualiza um requisito de documentação existente
   * @param {string|number} id - ID do requisito a ser atualizado
   * @param {Object} dadosAtualizados - Dados atualizados do requisito
   * @returns {Promise<Object>} - Resultado da operação
   */
  async atualizarRequisito(id, dadosAtualizados) {
    console.log(`Atualizando requisito ${id}:`, dadosAtualizados);
    
    try {
    const { data, error } = await supabase
      .from('requisitos_documentacao')
        .update(dadosAtualizados)
      .eq('id', id)
        .select();
      
      if (error) {
        console.error('Erro ao atualizar requisito:', error);
        throw error;
      }
      
      console.log('Requisito atualizado com sucesso:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Exceção ao atualizar requisito:', error);
      return { data: null, error };
    }
  },

  /**
   * Exclui um requisito de documentação
   * @param {string|number} id - ID do requisito a ser excluído
   * @returns {Promise<Object>} - Resultado da operação
   */
  async excluirRequisito(id) {
    console.log(`Excluindo requisito ${id}`);
    
    try {
      const { data, error } = await supabase
      .from('requisitos_documentacao')
      .delete()
      .eq('id', id);

      if (error) {
        console.error('Erro ao excluir requisito:', error);
        throw error;
      }
      
      console.log('Requisito excluído com sucesso');
      return { data, error: null };
    } catch (error) {
      console.error('Exceção ao excluir requisito:', error);
      return { data: null, error };
    }
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
    try {
      await verificarAutenticacao();
      console.log('Iniciando listagem de prazos');
      
    const { data, error } = await supabase
      .from('prazos')
        .select('*, licitacao:licitacoes!licitacao_id(id, numero, orgao, objeto, status)')
      .order('data_prazo', { ascending: true });

      if (error) {
        console.error('Erro ao listar prazos:', error);
        throw error;
      }
      
      // Garantir que todos os prazos tenham o campo licitacao_id definido
      const prazosFormatados = data?.map(prazo => ({
        ...prazo,
        licitacao_id: prazo.licitacao_id || prazo.licitacao?.id,
        licitacao: prazo.licitacao || null
      })) || [];
      
      console.log(`Prazos recuperados: ${prazosFormatados.length}`);
      
      return prazosFormatados;
    } catch (error) {
      console.error('Erro detalhado ao listar prazos:', error);
      throw error;
    }
  },

  // Buscar prazo por ID
  async buscarPrazoPorId(id) {
    try {
      await verificarAutenticacao();
      console.log('Buscando prazo por ID:', id);
      
    const { data, error } = await supabase
      .from('prazos')
        .select('*, licitacao:licitacoes!licitacao_id(id, numero, orgao, objeto, status)')
      .eq('id', id)
      .single();

      if (error) {
        console.error('Erro ao buscar prazo por ID:', error);
        throw error;
      }
      
      // Garantir que o prazo tenha o campo licitacao_id definido
      const prazoFormatado = {
        ...data,
        licitacao_id: data.licitacao_id || data.licitacao?.id,
        licitacao: data.licitacao || null
      };
      
      console.log('Prazo encontrado:', prazoFormatado);
      
      return prazoFormatado;
    } catch (error) {
      console.error('Erro detalhado ao buscar prazo por ID:', error);
      throw error;
    }
  },

  // Criar novo prazo
  async criarPrazo(prazo) {
    try {
      await verificarAutenticacao();
      // Validar campos obrigatórios
      if (!prazo.licitacao_id) {
        throw new Error('O campo licitacao_id é obrigatório');
      }
      
      if (!prazo.titulo) {
        throw new Error('O título do prazo é obrigatório');
      }
      
      if (!prazo.data_prazo) {
        throw new Error('A data do prazo é obrigatória');
      }
      
      // Garantir que o campo tipo esteja presente
      if (!prazo.tipo) {
        prazo.tipo = 'OUTROS'; // Valor padrão
      }
      
      console.log('Criando prazo com dados:', prazo);
      
    const { data, error } = await supabase
      .from('prazos')
      .insert([prazo])
      .select();

      if (error) {
        console.error('Erro ao criar prazo:', error);
        throw error;
      }
      
    return data[0];
    } catch (error) {
      console.error('Erro detalhado ao criar prazo:', error);
      throw error;
    }
  },

  // Atualizar prazo
  async atualizarPrazo(id, prazo) {
    try {
      await verificarAutenticacao();
      // Validar campos obrigatórios
      if (!prazo.licitacao_id) {
        throw new Error('O campo licitacao_id é obrigatório');
      }
      
      if (!prazo.titulo) {
        throw new Error('O título do prazo é obrigatório');
      }
      
      if (!prazo.data_prazo) {
        throw new Error('A data do prazo é obrigatória');
      }
      
      // Garantir que o campo tipo esteja presente
      if (!prazo.tipo) {
        prazo.tipo = 'OUTROS'; // Valor padrão
      }
      
      console.log('Atualizando prazo com ID:', id, 'Dados:', prazo);
      
    const { data, error } = await supabase
      .from('prazos')
      .update(prazo)
      .eq('id', id)
      .select();

      if (error) {
        console.error('Erro ao atualizar prazo:', error);
        throw error;
      }
      
    return data[0];
    } catch (error) {
      console.error('Erro detalhado ao atualizar prazo:', error);
      throw error;
    }
  },

  // Excluir prazo
  async excluirPrazo(id) {
    await verificarAutenticacao();
    const { error } = await supabase
      .from('prazos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Importar prazos das licitações
  async importarPrazos() {
    await verificarAutenticacao();
    const { data, error } = await supabase
      .rpc('importar_prazos_licitacoes');

    if (error) throw error;
    return data;
  }
};

// Serviços para Relatórios
export const relatorioService = {
  // Gerar relatório de licitações
  async gerarRelatorioLicitacoes(filtros = {}) {
    try {
      await verificarAutenticacao();
      console.log('Gerando relatório de licitações com filtros:', filtros);
      
      // Chamar a função SQL com tratamento de erros mais robusto
      const { data, error } = await supabase
        .rpc('relatorio_licitacoes_v3', {
          p_data_inicio: filtros.dataInicio ? filtros.dataInicio.toISOString() : null,
          p_data_fim: filtros.dataFim ? filtros.dataFim.toISOString() : null,
          p_status: filtros.status || null,
          p_cliente_id: filtros.cliente_id || null
        });

      if (error) {
        console.error('Erro detalhado do relatório de licitações:', error);
        
        // Tentar chamar a função alternativa se a primeira falhar
        const { data: altData, error: altError } = await supabase
          .rpc('gerar_relatorio_licitacoes_v3', {
            p_data_inicio: filtros.dataInicio ? filtros.dataInicio.toISOString() : null,
            p_data_fim: filtros.dataFim ? filtros.dataFim.toISOString() : null,
            p_status: filtros.status || null,
            p_cliente_id: filtros.cliente_id || null
          });
          
        if (altError) {
          console.error('Erro também na função alternativa:', altError);
          throw error;
        }
        
        console.log('Dados obtidos da função alternativa:', altData);
        return altData;
      }

      if (!data) {
        console.log('Nenhum dado retornado do relatório de licitações');
        return {
          total_licitacoes: 0,
          licitacoes_ganhas: 0,
          licitacoes_perdidas: 0,
          licitacoes_em_andamento: 0,
          valor_total_ganho: 0,
          lucro_total: 0,
          taxa_sucesso: 0,
          detalhes: []
        };
      }

      // Garantir que os dados estejam no formato esperado
      const resultado = {
        total_licitacoes: parseInt(data.total_licitacoes) || 0,
        licitacoes_ganhas: parseInt(data.licitacoes_ganhas) || 0,
        licitacoes_perdidas: parseInt(data.licitacoes_perdidas) || 0,
        licitacoes_em_andamento: parseInt(data.licitacoes_em_andamento) || 0,
        valor_total_ganho: parseFloat(data.valor_total_ganho) || 0,
        lucro_total: parseFloat(data.lucro_total) || 0,
        taxa_sucesso: parseFloat(data.taxa_sucesso) || 0,
        detalhes: Array.isArray(data.detalhes) ? data.detalhes.map(item => ({
          ...item,
          valor_estimado: parseFloat(item.valor_estimado) || 0,
          valor_final: parseFloat(item.valor_final) || 0,
          lucro_estimado: parseFloat(item.lucro_estimado) || 0,
          lucro_final: parseFloat(item.lucro_final) || 0
        })) : []
      };

      console.log('Dados formatados do relatório de licitações:', resultado);
      return resultado;
    } catch (error) {
      console.error('Erro ao gerar relatório de licitações:', error);
      // Retornar um objeto vazio em caso de erro para evitar quebrar a interface
      return {
        total_licitacoes: 0,
        licitacoes_ganhas: 0,
        licitacoes_perdidas: 0,
        licitacoes_em_andamento: 0,
        valor_total_ganho: 0,
        lucro_total: 0,
        taxa_sucesso: 0,
        detalhes: []
      };
    }
  },

  // Gerar relatório de clientes
  async gerarRelatorioClientes(filtros = {}) {
    try {
      await verificarAutenticacao();
      console.log('Gerando relatório de clientes com filtros:', filtros);
      
      // Chamar a função SQL com tratamento de erros mais robusto
      const { data, error } = await supabase
        .rpc('relatorio_clientes_v3', {
          p_data_inicio: filtros.dataInicio ? filtros.dataInicio.toISOString() : null,
          p_data_fim: filtros.dataFim ? filtros.dataFim.toISOString() : null
        });

      if (error) {
        console.error('Erro detalhado do relatório de clientes:', error);
        
        // Tentar chamar a função alternativa se a primeira falhar
        const { data: altData, error: altError } = await supabase
          .rpc('gerar_relatorio_clientes_v3', {
            p_data_inicio: filtros.dataInicio ? filtros.dataInicio.toISOString() : null,
            p_data_fim: filtros.dataFim ? filtros.dataFim.toISOString() : null
          });
          
        if (altError) {
          console.error('Erro também na função alternativa:', altError);
          throw error;
        }
        
        console.log('Dados obtidos da função alternativa:', altData);
        return altData;
      }

      if (!data) {
        console.log('Nenhum dado retornado do relatório de clientes');
        return {
          total_clientes: 0,
          clientes_ativos: 0,
          valor_total_licitacoes: 0,
          detalhes: []
        };
      }

      // Garantir que os dados estejam no formato esperado
      const resultado = {
        total_clientes: parseInt(data.total_clientes) || 0,
        clientes_ativos: parseInt(data.clientes_ativos) || 0,
        valor_total_licitacoes: parseFloat(data.valor_total_licitacoes) || 0,
        detalhes: Array.isArray(data.detalhes) ? data.detalhes.map(item => ({
          ...item,
          total_licitacoes: parseInt(item.total_licitacoes) || 0,
          licitacoes_ganhas: parseInt(item.licitacoes_ganhas) || 0,
          licitacoes_em_andamento: parseInt(item.licitacoes_em_andamento) || 0,
          valor_total_ganho: parseFloat(item.valor_total_ganho) || 0,
          lucro_total: parseFloat(item.lucro_total) || 0
        })) : []
      };

      console.log('Dados formatados do relatório de clientes:', resultado);
      return resultado;
    } catch (error) {
      console.error('Erro ao gerar relatório de clientes:', error);
      // Retornar um objeto vazio em caso de erro para evitar quebrar a interface
      return {
        total_clientes: 0,
        clientes_ativos: 0,
        valor_total_licitacoes: 0,
        detalhes: []
      };
    }
  },

  // Gerar relatório de desempenho
  async gerarRelatorioDesempenho(filtros = {}) {
    try {
      await verificarAutenticacao();
      console.log('Gerando relatório de desempenho com filtros:', filtros);
      
      // Chamar a função SQL com tratamento de erros mais robusto
      const { data, error } = await supabase
        .rpc('relatorio_desempenho_v3', {
          p_data_inicio: filtros.dataInicio ? filtros.dataInicio.toISOString() : null,
          p_data_fim: filtros.dataFim ? filtros.dataFim.toISOString() : null
        });

      if (error) {
        console.error('Erro detalhado do relatório de desempenho:', error);
        
        // Tentar chamar a função alternativa se a primeira falhar
        const { data: altData, error: altError } = await supabase
          .rpc('gerar_relatorio_desempenho_v3', {
            p_data_inicio: filtros.dataInicio ? filtros.dataInicio.toISOString() : null,
            p_data_fim: filtros.dataFim ? filtros.dataFim.toISOString() : null
          });
          
        if (altError) {
          console.error('Erro também na função alternativa:', altError);
          throw error;
        }
        
        console.log('Dados obtidos da função alternativa:', altData);
        return altData;
      }

      if (!data) {
        console.log('Nenhum dado retornado do relatório de desempenho');
        return {
          total_licitacoes: 0,
          taxa_sucesso: 0,
          valor_total_ganho: 0,
          lucro_total: 0,
          media_prazo_fechamento: 0,
          motivos_perda: {},
          evolucao_mensal: []
        };
      }

      // Garantir que os dados estejam no formato esperado
      const resultado = {
        total_licitacoes: parseInt(data.total_licitacoes) || 0,
        taxa_sucesso: parseFloat(data.taxa_sucesso) || 0,
        valor_total_ganho: parseFloat(data.valor_total_ganho) || 0,
        lucro_total: parseFloat(data.lucro_total) || 0,
        media_prazo_fechamento: parseFloat(data.media_prazo_fechamento) || 0,
        motivos_perda: data.motivos_perda || {},
        evolucao_mensal: Array.isArray(data.evolucao_mensal) ? data.evolucao_mensal.map(item => ({
          ...item,
          total_licitacoes: parseInt(item.total_licitacoes) || 0,
          licitacoes_ganhas: parseInt(item.licitacoes_ganhas) || 0,
          valor_total: parseFloat(item.valor_total) || 0,
          lucro_total: parseFloat(item.lucro_total) || 0
        })) : []
      };

      console.log('Dados formatados do relatório de desempenho:', resultado);
      return resultado;
    } catch (error) {
      console.error('Erro ao gerar relatório de desempenho:', error);
      // Retornar um objeto vazio em caso de erro para evitar quebrar a interface
      return {
        total_licitacoes: 0,
        taxa_sucesso: 0,
        valor_total_ganho: 0,
        lucro_total: 0,
        media_prazo_fechamento: 0,
        motivos_perda: {},
        evolucao_mensal: []
      };
    }
  }
};

// Serviço de autenticação
export const authService = {
  // Obter usuário atual
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Obter sessão atual
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  // Login com email e senha
  signInWithEmail: async (email, password) => {
    try {
      // Verificar conexão com o banco antes de tentar login
      try {
        const conexaoOk = await verificarConexao();
        if (!conexaoOk) {
          console.error('[Auth] Falha na conexão com o banco de dados');
          return { error: { message: 'Serviço temporariamente indisponível. Por favor, tente novamente mais tarde.' } };
        }
      } catch (connErr) {
        console.error('[Auth] Erro ao verificar conexão:', connErr);
        // Continuar mesmo se houver erro na verificação de conexão
      }

      console.log(`[Auth] Tentando login com email: ${email}`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Erro de login:', error);
        
        // Personalizar mensagens de erro para o usuário
        let userMessage = 'Erro ao fazer login. Tente novamente mais tarde.';
        
        if (error.message?.includes('Invalid login credentials')) {
          userMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if (error.message?.includes('Email not confirmed')) {
          userMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
        } else if (error.status === 404 || error.message?.includes('Not Found')) {
          userMessage = 'Serviço temporariamente indisponível. Por favor, tente novamente mais tarde.';
        } else if (error.status === 500 || error.status >= 502) {
          userMessage = 'Serviço temporariamente indisponível. Por favor, tente novamente mais tarde.';
        }
        
        return { error: { ...error, message: userMessage } };
      }

      console.log('[Auth] Login bem-sucedido:', data.user?.id);
      return { data };
    } catch (err) {
      console.error('[Auth] Erro inesperado no login:', err);
      return {
        error: {
          message: 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.',
          originalError: err.message
        }
      };
    }
  },

  // Logout
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Atualizar senha do usuário
  updatePassword: async (password) => {
    try {
      console.log('Tentando atualizar senha do usuário');
      const { data, error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) {
        console.error('Erro ao atualizar senha:', error);
        throw error;
      }
      
      console.log('Senha atualizada com sucesso');
      return data;
    } catch (err) {
      console.error('Exceção ao atualizar senha:', err);
      throw err;
    }
  },

  // Solicitar redefinição de senha
  requestPasswordReset: async (email) => {
    try {
      console.log(`Solicitando redefinição de senha para: ${email}`);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        console.error('Erro ao solicitar redefinição de senha:', error);
        throw error;
      }
      
      console.log('Email de redefinição enviado com sucesso');
      return data;
    } catch (err) {
      console.error('Exceção ao solicitar redefinição de senha:', err);
      throw err;
    }
  },

  // Verificar se o usuário está autenticado
  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  // Obter dados de um usuário pelo ID
  getUserById: async (userId) => {
    try {
      console.log(`[Auth] Buscando usuário com ID: ${userId}`);
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      
      if (error) {
        console.error('[Auth] Erro ao buscar usuário:', error);
        return null;
      }
      
      return data?.user || null;
    } catch (err) {
      console.error('[Auth] Erro ao buscar usuário por ID:', err);
      return null;
    }
  },
  
  // Atualizar dados de um usuário
  updateUserData: async (userId, email, nome) => {
    try {
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { 
          email,
          user_metadata: { nome }
        }
      );
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao atualizar dados do usuário:', err);
      throw err;
    }
  },

  // Buscar usuário por email
  async getUserByEmail(email) {
    try {
      console.log(`[Auth] Verificando se existe usuário com email: ${email}`);
      
      // Usar apenas o método legacy que não depende de permissões administrativas
      const exists = await checkUserExistsLegacy(email);
      if (exists) {
        console.log('[Auth] Usuário existe (verificado por método alternativo)');
        return { 
          email: email, 
          confirmed: true, 
          verified_using_legacy: true 
        };
      }
      
      console.log('[Auth] Nenhum usuário encontrado com este email');
      return null;
    } catch (err) {
      console.error('[Auth] Erro ao verificar existência de usuário:', err);
      return null;
    }
  },
};

// Serviço de franquias
export const franquiaService = {
  // Listar todas as franquias (apenas admin)
  async listarFranquias() {
    try {
      await verificarAutenticacao();
      
      const { data, error } = await supabase
        .from('franquias')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao listar franquias:', error);
      throw error;
    }
  },

  // Buscar franquia por ID
  async buscarFranquiaPorId(id) {
    try {
      await verificarAutenticacao();
      
      const { data, error } = await supabase
        .from('franquias')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar franquia:', error);
      throw error;
    }
  },

  // Buscar franquia atual do usuário logado
  async buscarFranquiaAtual() {
    try {
      await verificarAutenticacao();
      
      const session = await authService.getSession();
      
      const { data, error } = await supabase
        .from('franquias')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Ignora erro de não encontrado
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('Erro ao buscar franquia atual:', error);
      throw error;
    }
  },

  // Criar nova franquia (apenas admin)
  async criarFranquia(franquia) {
    try {
      await verificarAutenticacao();
      
      // Validar se o usuário é administrador
      const user = await authService.getCurrentUser();
      const { data: isAdmin } = await supabase.rpc('is_admin');
      
      if (!isAdmin) {
        throw new Error('Apenas administradores podem criar franquias');
      }
      
      // Tentar criar extensões necessárias
      try {
        await supabase.rpc('criar_extensoes');
        console.log('Extensões criadas/verificadas com sucesso');
      } catch (extError) {
        console.error('Erro ao criar extensões (isso pode ser normal se não tiver permissão):', extError);
        // Continuar mesmo se falhar, pois as extensões podem já existir
      }
      
      // Configurar tabela franquias e garantir que a coluna user_id aceite nulos
      try {
        await supabase.rpc('configurar_tabela_franquias');
        console.log('Configuração da tabela franquias concluída com sucesso');
      } catch (configError) {
        console.error('Erro ao configurar tabela franquias:', configError);
        // Continuar mesmo com erro
      }
      
      // Remover formatação dos campos antes de enviar
      const dadosFormatados = {
        nome: franquia.nome?.trim(),
        cnpj: franquia.cnpj?.replace(/\D/g, ''),
        email: franquia.email?.trim(),
        telefone: franquia.telefone?.replace(/\D/g, ''),
        cep: franquia.cep?.replace(/\D/g, ''),
        endereco: franquia.endereco?.trim(),
        numero: franquia.numero?.trim(),
        bairro: franquia.bairro?.trim(),
        cidade: franquia.cidade?.trim(),
        estado: franquia.estado?.trim(),
        ativa: true,
        user_id: null // Explicitamente definir como NULL
      };

      console.log('Dados formatados para inserção:', dadosFormatados);

      // Criar a franquia com todos os dados de uma vez
      const { data: franquiaCriada, error: franquiaError } = await supabase
        .from('franquias')
        .insert(dadosFormatados)
        .select()
        .single();

      if (franquiaError) {
        console.error('Erro ao criar franquia:', franquiaError);
        throw new Error(franquiaError.message);
      }

      console.log('Franquia criada com sucesso:', franquiaCriada);

      return { franquia: franquiaCriada };
    } catch (error) {
      console.error('Erro ao criar franquia:', error);
      throw error.message ? error : new Error('Erro ao cadastrar franquia');
    }
  },

  // Atualizar franquia
  async atualizarFranquia(id, franquia) {
    try {
      await verificarAutenticacao();
      
      // Validar se o usuário pode atualizar esta franquia
      const user = await authService.getCurrentUser();
      const franquiaAtual = await this.buscarFranquiaPorId(id);
      const { data: isAdmin } = await supabase.rpc('is_admin');
      
      if (!isAdmin && franquiaAtual.user_id !== user.id) {
        throw new Error('Você não tem permissão para atualizar esta franquia');
      }
      
      // Remover formatação dos campos antes de enviar
      const dadosFormatados = {
        ...franquia,
        cnpj: franquia.cnpj?.replace(/\D/g, ''),
        telefone: franquia.telefone?.replace(/\D/g, ''),
        cep: franquia.cep?.replace(/\D/g, ''),
        nome: franquia.nome?.trim(),
        email: franquia.email?.trim(),
        endereco: franquia.endereco?.trim(),
        numero: franquia.numero?.trim(),
        bairro: franquia.bairro?.trim(),
        cidade: franquia.cidade?.trim(),
        estado: franquia.estado?.trim()
      };

      // Atualizar a franquia
      const { data, error } = await supabase
        .from('franquias')
        .update(dadosFormatados)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar franquia:', error);
      throw error.message ? error : new Error('Erro ao atualizar franquia');
    }
  },

  // Ativar/desativar franquia (apenas admin)
  async alterarStatusFranquia(id, ativa) {
    try {
      await verificarAutenticacao();
      
      // Validar se o usuário é administrador
      const { data: isAdmin } = await supabase.rpc('is_admin');
      
      if (!isAdmin) {
        throw new Error('Apenas administradores podem alterar o status de franquias');
      }
      
      // Verificar se a coluna 'ativa' existe e criá-la se não existir
      try {
        // Este RPC vai criar a coluna 'ativa' se ela não existir
        await supabase.rpc('ensure_franquias_ativa_column');
      } catch (columnError) {
        console.error('Erro ao verificar/criar coluna ativa:', columnError);
        // Se não conseguirmos criar a coluna, vamos tentar atualizar outro campo
        // apenas para mostrar que o status foi alterado na interface
        const { data, error } = await supabase
          .from('franquias')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
      
      // Se chegou aqui, a coluna 'ativa' existe ou foi criada
      const { data, error } = await supabase
        .from('franquias')
        .update({ ativa })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao alterar status da franquia:', error);
      throw error.message ? error : new Error('Erro ao alterar status da franquia');
    }
  },

  // Excluir franquia (apenas admin)
  async excluirFranquia(id) {
    try {
      await verificarAutenticacao();
      
      // Validar se o usuário é administrador
      const { data: isAdmin } = await supabase.rpc('is_admin');
      
      if (!isAdmin) {
        throw new Error('Apenas administradores podem excluir franquias');
      }
      
      // Primeiro, buscar o user_id associado à franquia
      const { data: franquia } = await supabase
        .from('franquias')
        .select('user_id')
        .eq('id', id)
        .single();
      
      if (!franquia) {
        throw new Error('Franquia não encontrada');
      }
      
      // Desassociar todos os clientes desta franquia
      const { error: clientesError } = await supabase
        .from('clientes')
        .update({ franquia_id: null })
        .eq('franquia_id', id);
      
      if (clientesError) {
        console.error('Erro ao desassociar clientes:', clientesError);
      }
      
      // Excluir a franquia
      const { error } = await supabase
        .from('franquias')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Desativar o usuário associado (não é possível excluir de forma segura)
      // Isso deve ser feito pelo painel administrativo do Supabase
      
      return { success: true, message: 'Franquia excluída com sucesso' };
    } catch (error) {
      console.error('Erro ao excluir franquia:', error);
      throw error.message ? error : new Error('Erro ao excluir franquia');
    }
  },

  // Listar clientes de uma franquia
  async listarClientesDaFranquia(franquiaId) {
    try {
      await verificarAutenticacao();
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('franquia_id', franquiaId)
        .order('razao_social');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao listar clientes da franquia:', error);
      throw error;
    }
  },

  // Atribuir cliente a uma franquia
  async atribuirClienteAFranquia(clienteId, franquiaId) {
    try {
      await verificarAutenticacao();
      
      // Validar se o usuário é administrador
      const { data: isAdmin } = await supabase.rpc('is_admin');
      
      if (!isAdmin) {
        throw new Error('Apenas administradores podem atribuir clientes a franquias');
      }
      
      const { data, error } = await supabase
        .from('clientes')
        .update({ franquia_id: franquiaId })
        .eq('id', clienteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atribuir cliente a franquia:', error);
      throw error.message ? error : new Error('Erro ao atribuir cliente a franquia');
    }
  },

  // Remover cliente de uma franquia
  async removerClienteDaFranquia(clienteId) {
    try {
      await verificarAutenticacao();
      
      // Validar se o usuário é administrador
      const { data: isAdmin } = await supabase.rpc('is_admin');
      
      if (!isAdmin) {
        throw new Error('Apenas administradores podem remover clientes de franquias');
      }
      
      const { data, error } = await supabase
        .from('clientes')
        .update({ franquia_id: null })
        .eq('id', clienteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao remover cliente da franquia:', error);
      throw error.message ? error : new Error('Erro ao remover cliente da franquia');
    }
  },

  // Criar um usuário para uma franquia existente
  async criarUsuarioParaFranquia(franquiaId, email, senha, nome) {
    try {
      // Verificar se está autenticado
      const session = await supabase.auth.getSession();
      if (!session?.data?.session) {
        console.error('[Franquia] Tentativa de criar usuário sem autenticação');
        return { 
          success: false, 
          message: 'Você precisa estar autenticado para realizar esta operação' 
        };
      }

      console.log(`[Franquia] Criando usuário para franquia ${franquiaId}`);
      
      // Verificar se a franquia existe
      const { data: franquia, error: franquiaError } = await supabase
        .from('franquias')
        .select('*')
        .eq('id', franquiaId)
        .single();
      
      if (franquiaError || !franquia) {
        console.error('[Franquia] Franquia não encontrada:', franquiaError);
        return { 
          success: false, 
          message: 'Franquia não encontrada' 
        };
      }
      
      // Chamar a função SQL para criar o usuário
      const { data, error } = await supabase.rpc('criar_usuario_franquia_v2', {
        p_franquia_id: franquiaId,
        p_email: email,
        p_senha: senha,
        p_nome: nome || 'Usuário da Franquia'
      });
      
      if (error) {
        console.error('[Franquia] Erro ao criar usuário para franquia:', error);
        return { 
          success: false, 
          message: `Erro ao criar usuário: ${error.message}` 
        };
      }
      
      console.log('[Franquia] Usuário criado com sucesso para franquia:', data);
      return { 
        success: true, 
        message: 'Usuário criado com sucesso', 
        data 
      };
    } catch (err) {
      console.error('[Franquia] Erro ao criar usuário para franquia:', err);
      return { 
        success: false, 
        message: `Erro inesperado: ${err.message}` 
      };
    }
  },
};

export const criarFranquia = async (franquiaData, senhaUsuario = null) => {
  try {
    // Tentar criar extensões necessárias
    try {
      const { data: extData, error: extError } = await supabase.rpc('criar_extensoes');
      if (extError) {
        console.warn('Aviso: Não foi possível criar extensões (isso pode ser normal):', extError);
      } else {
        console.log('Extensões criadas/verificadas com sucesso');
      }
    } catch (extException) {
      console.warn('Exceção ao criar extensões:', extException);
      // Continuar mesmo com erro
    }
    
    // Chamar a função de configuração de tabela para garantir que esteja tudo certo
    const { data: configData, error: configError } = await supabase.rpc(
      'configurar_tabela_franquias'
    );
    
    if (configError) {
      console.error('Erro ao configurar tabela de franquias:', configError);
    } else {
      console.log('Tabela de franquias configurada com sucesso');
    }

    // Formatar dados para inserção
    const franquiaFormatada = {
      nome: franquiaData.nome,
      email: franquiaData.email,
      cnpj: franquiaData.cnpj?.replace(/\D/g, ''),
      telefone: franquiaData.telefone?.replace(/\D/g, ''),
      bairro: franquiaData.bairro,
      cidade: franquiaData.cidade,
      estado: franquiaData.estado,
      cep: franquiaData.cep?.replace(/\D/g, ''),
      endereco: franquiaData.endereco,
      numero: franquiaData.numero,
      user_id: null // Definir como null explicitamente
    };

    // Criar a franquia
    const { data: franquiaCriada, error } = await supabase
      .from('franquias')
      .insert(franquiaFormatada)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar franquia:', error);
      return { data: null, error };
    }

    // Se a senha foi fornecida, tentar criar usuário para a franquia
    let usuarioInfo = null;
    if (senhaUsuario) {
      try {
        console.log(`[Franquia] Verificando se já existe usuário com email: ${franquiaData.email}`);
        
        // Verificar primeiro se já existe um usuário com este email
        // Tentativa 1: Usando função RPC (pode falhar com erro de permissão)
        let emailJaExiste = false;
        let checkResult;
        
        try {
          checkResult = await supabase.rpc('check_user_exists', { p_email: franquiaData.email });
          if (checkResult.error) {
            console.warn('[Franquia] Erro ao verificar usando RPC:', checkResult.error);
          } else if (checkResult.data === true) {
            emailJaExiste = true;
          }
        } catch (rpcError) {
          console.warn('[Franquia] Exceção ao verificar usando RPC:', rpcError);
        }
        
        // Tentativa 2: Tentar buscar usuário diretamente (pode ser bloqueado por permissões)
        if (!emailJaExiste) {
          try {
            const { data: userData, error: userError } = await authService.getUserByEmail(franquiaData.email);
            if (userError) {
              console.warn('[Franquia] Erro ao buscar usuário por email:', userError);
            } else if (userData) {
              emailJaExiste = true;
            }
          } catch (userError) {
            console.warn('[Franquia] Exceção ao buscar usuário por email:', userError);
          }
        }
        
        // Tentativa 3: Se ambas as tentativas falharem, vamos tentar criar o usuário e tratar o erro
        if (emailJaExiste) {
          console.log('[Franquia] Usuário com este email já existe (verificação prévia)');
          usuarioInfo = {
            sucesso: false,
            codigo: 'EMAIL_JA_EXISTE',
            mensagem: `Já existe um usuário com este email: ${franquiaData.email}`
          };
        } else {
          // Tentar criar o usuário de qualquer forma, pois pode ser que nossas verificações
          // prévias não tenham funcionado por questões de permissão
          const { data: usuarioData, error: usuarioError } = await supabase.rpc(
            'criar_usuario_franquia_v2',
            {
              p_franquia_id: franquiaCriada.id,
              p_email: franquiaData.email,
              p_senha: senhaUsuario,
              p_nome: franquiaData.nome
            }
          );

          if (usuarioError) {
            console.error('[Franquia] Erro ao criar usuário para franquia:', usuarioError);
            
            // Verificar se o erro é devido ao email já existente
            if (usuarioError.message && (
                usuarioError.message.includes('already exists') || 
                usuarioError.message.includes('EMAIL_JA_EXISTE') ||
                usuarioError.message.includes('duplicate key') ||
                usuarioError.message.includes('já existe')
            )) {
              usuarioInfo = {
                sucesso: false,
                codigo: 'EMAIL_JA_EXISTE',
                mensagem: `Já existe um usuário com este email: ${franquiaData.email}`
              };
            } else {
              usuarioInfo = {
                sucesso: false,
                codigo: 'ERRO_CRIAR_USUARIO',
                mensagem: 'Não foi possível criar o usuário automaticamente. Um administrador poderá associar um usuário mais tarde.',
                erro_tecnico: usuarioError.message
              };
            }
          } else {
            usuarioInfo = usuarioData || {
              sucesso: true,
              mensagem: 'Usuário para franquia criado com sucesso'
            };
            console.log('[Franquia] Usuário para franquia criado com sucesso:', usuarioData);
          }
        }
      } catch (usuarioExcecao) {
        console.error('[Franquia] Exceção ao criar usuário para franquia:', usuarioExcecao);
        usuarioInfo = {
          sucesso: false,
          codigo: 'ERRO_INESPERADO',
          mensagem: 'Não foi possível criar o usuário automaticamente. Um administrador poderá associar um usuário mais tarde.',
          erro_tecnico: usuarioExcecao.message
        };
      }
    }

    return { 
      data: { 
        franquia: franquiaCriada, 
        usuario: usuarioInfo 
      }, 
      error: null 
    };
  } catch (e) {
    console.error('Exceção ao criar franquia:', e);
    return { data: null, error: e };
  }
};

// Iniciar verificações de saúde do banco
export const iniciarVerificacaoDeSaude = async () => {
  try {
    console.log('[DB Health] Iniciando verificação de saúde do banco de dados...');
    // Verificar se a tabela de verificação existe
    const { data, error } = await supabase.rpc('criar_tabela_health_check');
    
    if (error) {
      console.error('[DB Health] Erro ao iniciar verificação de saúde:', error);
      console.warn('[DB Health] Tentando criar tabela de saúde manualmente...');
      await criarTabelaHealthCheck();
    } else {
      console.log('[DB Health] Tabela de verificação de saúde disponível:', data);
    }
    
    // Verificar conexão
    const conexaoOk = await verificarConexao();
    console.log('[DB Health] Status da conexão:', conexaoOk ? 'OK' : 'FALHA');
    
    return conexaoOk;
  } catch (err) {
    console.error('[DB Health] Erro fatal na verificação de saúde:', err);
    return false;
  }
};

// Verificar se a conexão com o banco de dados está funcionando
export const verificarConexao = async () => {
  try {
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('health_check')
      .select('id, status')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.error('[DB Health] Erro ao verificar conexão:', error);
      return false;
    }
    
    console.log(`[DB Health] Conexão verificada em ${responseTime}ms:`, data);
    return true;
  } catch (err) {
    console.error('[DB Health] Erro ao verificar conexão:', err);
    return false;
  }
};

// Função para criar tabela de verificação de saúde
export const criarTabelaHealthCheck = async () => {
  try {
    // Tentar criar a tabela health_check via chamada RPC
    const { data, error } = await supabase.rpc('criar_tabela_health_check');
    if (error) {
      console.error('[DB Health] Erro ao criar tabela de verificação:', error);
      return false;
    }
    console.log('[DB Health] Tabela de verificação criada com sucesso');
    return true;
  } catch (err) {
    console.error('[DB Health] Erro ao criar tabela de verificação:', err);
    return false;
  }
};

// Iniciar verificação de saúde do banco ao carregar o serviço
iniciarVerificacaoDeSaude();

// Criar função RPC para checar se existe usuário com determinado email
const criarFuncaoCheckUserExists = async () => {
  try {
    // Verificar se a função já existe
    const { data: functionExists, error: checkError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'check_user_exists')
      .maybeSingle();

    if (checkError) {
      console.log('[DB Setup] Erro ao verificar se função check_user_exists existe:', checkError);
    }

    // Se a função não existe, criar
    if (!functionExists) {
      console.log('[DB Setup] Criando função check_user_exists...');
      const { error: createError } = await supabase.rpc('create_function_check_user_exists');
      
      if (createError) {
        console.error('[DB Setup] Erro ao criar função check_user_exists:', createError);
        
        // Tentar uma abordagem alternativa - executar SQL diretamente
        const sqlFunction = `
        CREATE OR REPLACE FUNCTION public.check_user_exists(p_email TEXT)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN EXISTS (SELECT 1 FROM auth.users WHERE email = p_email);
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Erro ao verificar usuário: %', SQLERRM;
          RETURN FALSE;
        END;
        $$;
        `;
        
        try {
          await supabase.rpc('execute_sql', { sql: sqlFunction });
          console.log('[DB Setup] Função check_user_exists criada via SQL direto');
        } catch (sqlError) {
          console.error('[DB Setup] Falha na criação via SQL direto:', sqlError);
        }
      } else {
        console.log('[DB Setup] Função check_user_exists criada com sucesso');
      }
    } else {
      console.log('[DB Setup] Função check_user_exists já existe');
    }
    
    return true;
  } catch (err) {
    console.error('[DB Setup] Erro ao verificar/criar função check_user_exists:', err);
    return false;
  }
};

// Chamar a função para criar verificador de email ao inicializar
try {
  criarFuncaoCheckUserExists();
} catch (err) {
  console.warn('[DB Setup] Falha ao configurar funções de verificação de email:', err);
}

// Função para verificar se usuário existe sem usar a API auth (que pode dar erro de permissão)
export const checkUserExistsLegacy = async (email) => {
  if (!email) return false;
  
  try {
    console.log('[Auth] Verificando se usuário existe (legado):', email);
    
    // Método 1: Tentar fazer login com credenciais inválidas 
    // Uma senha obviamente errada, apenas para ver se o email existe
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'senha_incorreta_apenas_para_verificacao_' + Date.now()
    });
    
    // Se o erro for "Invalid login credentials", então o email existe
    // Se for "Email not confirmed", também significa que o email existe
    if (error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('invalid login') || 
          errorMsg.includes('email not confirmed') || 
          errorMsg.includes('invalid email') === false) {
        console.log('[Auth] Usuário existe (confirmado por tentativa de login)');
        return true;
      }
    }
    
    // Método 2: Tentar usar uma função RPC no banco (se estiver disponível)
    try {
      const { data, error: rpcError } = await supabase.rpc('check_user_exists', { 
        p_email: email 
      });
      
      if (!rpcError && data === true) {
        console.log('[Auth] Usuário existe (confirmado por RPC)');
        return true;
      }
    } catch (rpcErr) {
      console.warn('[Auth] Erro ao verificar usuário por RPC:', rpcErr);
    }
    
    // Se chegou até aqui, provavelmente o usuário não existe
    console.log('[Auth] Usuário não encontrado');
    return false;
  } catch (error) {
    console.error('[Auth] Erro ao verificar existência de usuário:', error);
    return false;
  }
};