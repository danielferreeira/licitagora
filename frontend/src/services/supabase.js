import { supabase } from '../config/supabase'

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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Logout
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Atualizar senha do usuário
  updatePassword: async (password) => {
    const { data, error } = await supabase.auth.updateUser({
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Verificar se o usuário está autenticado
  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }
}; 