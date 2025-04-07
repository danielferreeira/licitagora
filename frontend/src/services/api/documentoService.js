import { supabase, verificarAutenticacao } from './supabaseConfig';
import authService from './authService';

// Serviço para gerenciamento de documentos de licitações
const documentoService = {
  // Listar tipos de documentos
  async listarTiposDocumentos() {
    await verificarAutenticacao();
    
    try {
      const { data, error } = await supabase.from('tipos_documentos')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar tipos de documentos:', error);
        throw error;
      }
      
      return data || [];
    } catch (err) {
      console.error('Exceção ao buscar tipos de documentos:', err);
      throw err;
    }
  },

  // Listar documentos de uma licitação
  async listarDocumentos(licitacaoId) {
    await verificarAutenticacao();
    
    try {
      const { data, error } = await supabase.from('documentos_licitacao')
        .select('*')
        .eq('licitacao_id', licitacaoId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Erro ao buscar documentos da licitação ${licitacaoId}:`, error);
        throw error;
      }
      
      return data || [];
    } catch (err) {
      console.error(`Exceção ao buscar documentos da licitação ${licitacaoId}:`, err);
      throw err;
    }
  },
  
  // Alias para listarDocumentos (compatibilidade)
  async listarDocumentosLicitacao(licitacaoId) {
    return this.listarDocumentos(licitacaoId);
  },
  
  // Listar requisitos de uma licitação
  async listarRequisitos(licitacaoId) {
    await verificarAutenticacao();
    
    try {
      const { data, error } = await supabase.from('requisitos_licitacao')
        .select('*')
        .eq('licitacao_id', licitacaoId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Erro ao buscar requisitos da licitação ${licitacaoId}:`, error);
        throw error;
      }
      
      return data || [];
    } catch (err) {
      console.error(`Exceção ao buscar requisitos da licitação ${licitacaoId}:`, err);
      throw err;
    }
  },
  
  // Listar requisitos de documentação (direto)
  async listarRequisitosDocumentacaoDireto(licitacaoId) {
    await verificarAutenticacao();
    
    try {
      const { data, error } = await supabase.from('requisitos_documentacao')
        .select('*')
        .eq('licitacao_id', licitacaoId)
        .order('ordem', { ascending: true });
      
      if (error) {
        console.error(`Erro ao buscar requisitos de documentação da licitação ${licitacaoId}:`, error);
        throw new Error(`Falha ao buscar requisitos: ${error.message}`);
      }
      
      return { data, error };
    } catch (err) {
      console.error(`Exceção ao buscar requisitos de documentação da licitação ${licitacaoId}:`, err);
      return { data: null, error: err };
    }
  },
  
  // Listar requisitos de documentação (método padrão)
  async listarRequisitosDocumentacao(licitacaoId) {
    await verificarAutenticacao();
    
    try {
      // Tenta buscar via função RPC primeiro
      let { data: rpcData, error: rpcError } = await supabase
        .rpc('listar_requisitos_documentacao', { p_licitacao_id: licitacaoId });
      
      if (rpcError) {
        console.warn('Erro ao buscar requisitos via RPC, tentando acesso direto:', rpcError);
        
        // Se falhar, tenta acesso direto à tabela
        return await this.listarRequisitosDocumentacaoDireto(licitacaoId);
      }
      
      return { data: rpcData || [], error: null };
    } catch (err) {
      console.error(`Exceção ao buscar requisitos de documentação da licitação ${licitacaoId}:`, err);
      return { data: null, error: err };
    }
  },
  
  // Criar requisitos de teste para uma licitação
  async criarRequisitosTestePara(licitacaoId) {
    await verificarAutenticacao();
    
    try {
      const requisitosDemo = [
        { descricao: 'Certidão Negativa de Débitos', observacoes: 'Documento obrigatório', atendido: false, ordem: 1 },
        { descricao: 'Contrato Social', observacoes: 'Versão atualizada', atendido: false, ordem: 2 },
        { descricao: 'Atestado de Capacidade Técnica', observacoes: '', atendido: false, ordem: 3 },
        { descricao: 'Comprovante de Inscrição Municipal', observacoes: '', atendido: false, ordem: 4 },
      ].map(req => ({
        ...req,
        licitacao_id: licitacaoId,
        created_at: new Date()
      }));
      
      const { data, error } = await supabase.from('requisitos_documentacao')
        .insert(requisitosDemo)
        .select();
      
      if (error) {
        console.error(`Erro ao criar requisitos de teste para licitação ${licitacaoId}:`, error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (err) {
      console.error(`Exceção ao criar requisitos de teste para licitação ${licitacaoId}:`, err);
      return { data: null, error: err };
    }
  },
  
  // Criar um requisito de documentação
  async criarRequisito(requisito) {
    await verificarAutenticacao();
    
    try {
      const requisitoData = {
        ...requisito,
        created_at: new Date()
      };
      
      const { data, error } = await supabase.from('requisitos_documentacao')
        .insert(requisitoData)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar requisito:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Exceção ao criar requisito:', err);
      throw err;
    }
  },
  
  // Listar documentos de um cliente
  async listarDocumentosCliente(clienteId) {
    await verificarAutenticacao();
    
    try {
      const { data, error } = await supabase.from('documentos_cliente')
        .select('*, tipos_documentos(id, nome)')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Erro ao buscar documentos do cliente ${clienteId}:`, error);
        throw error;
      }
      
      return data || [];
    } catch (err) {
      console.error(`Exceção ao buscar documentos do cliente ${clienteId}:`, err);
      throw err;
    }
  },
  
  // Criar novo documento
  async adicionarDocumento(documento) {
    await verificarAutenticacao();
    
    try {
      const documentoData = {
        ...documento,
        created_at: new Date()
      };
      
      const { data, error } = await supabase.from('documentos_licitacao')
        .insert(documentoData)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao adicionar documento:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Exceção ao adicionar documento:', err);
      throw err;
    }
  },
  
  // Adicionar requisito
  async adicionarRequisito(requisito) {
    await verificarAutenticacao();
    
    try {
      const requisitoData = {
        ...requisito,
        created_at: new Date()
      };
      
      const { data, error } = await supabase.from('requisitos_licitacao')
        .insert(requisitoData)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao adicionar requisito:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Exceção ao adicionar requisito:', err);
      throw err;
    }
  },
  
  // Atualizar documento
  async atualizarDocumento(id, documento) {
    await verificarAutenticacao();
    
    try {
      const documentoData = {
        ...documento,
        updated_at: new Date()
      };
      
      const { data, error } = await supabase.from('documentos_licitacao')
        .update(documentoData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Erro ao atualizar documento ${id}:`, error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error(`Exceção ao atualizar documento ${id}:`, err);
      throw err;
    }
  },
  
  // Atualizar requisito
  async atualizarRequisito(id, requisito) {
    await verificarAutenticacao();
    
    try {
      const requisitoData = {
        ...requisito,
        updated_at: new Date()
      };
      
      const { data, error } = await supabase.from('requisitos_documentacao')
        .update(requisitoData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Erro ao atualizar requisito ${id}:`, error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error(`Exceção ao atualizar requisito ${id}:`, err);
      throw err;
    }
  },
  
  // Excluir documento
  async excluirDocumento(id) {
    await verificarAutenticacao();
    
    try {
      const { error } = await supabase.from('documentos_licitacao')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erro ao excluir documento ${id}:`, error);
        throw error;
      }
      
      return { success: true, message: 'Documento excluído com sucesso' };
    } catch (err) {
      console.error(`Exceção ao excluir documento ${id}:`, err);
      throw err;
    }
  },
  
  // Excluir requisito
  async excluirRequisito(id) {
    await verificarAutenticacao();
    
    try {
      const { error } = await supabase.from('requisitos_licitacao')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erro ao excluir requisito ${id}:`, error);
        throw error;
      }
      
      return { success: true, message: 'Requisito excluído com sucesso' };
    } catch (err) {
      console.error(`Exceção ao excluir requisito ${id}:`, err);
      throw err;
    }
  },
  
  // Excluir requisito de documentação
  async excluirRequisitoDocumentacao(id) {
    await verificarAutenticacao();
    
    try {
      const { error } = await supabase.from('requisitos_documentacao')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erro ao excluir requisito de documentação ${id}:`, error);
        throw error;
      }
      
      return { success: true, message: 'Requisito excluído com sucesso' };
    } catch (err) {
      console.error(`Exceção ao excluir requisito de documentação ${id}:`, err);
      throw err;
    }
  },
  
  // Obter URL para download (compatibilidade com o método antigo)
  async getUrlDownload(filePath) {
    return this.obterUrlArquivo(filePath);
  },
  
  // Upload de arquivo
  async uploadArquivo(file, path) {
    await verificarAutenticacao();
    
    try {
      console.log('Enviando arquivo para:', path);
      
      const { data, error } = await supabase.storage
        .from('documentos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true // Alterado para true para substituir arquivos existentes
        });
      
      if (error) {
        console.error('Erro ao fazer upload do arquivo:', error);
        throw error;
      }
      
      // Retornar o caminho ao invés do objeto data
      return path;
    } catch (err) {
      console.error('Exceção ao fazer upload do arquivo:', err);
      throw err;
    }
  },
  
  // Obter URL pública para um arquivo
  async obterUrlArquivo(filePath) {
    try {
      // Verifica se o caminho do arquivo está vazio ou indefinido
      if (!filePath) {
        console.error('Caminho do arquivo vazio ou indefinido');
        throw new Error('Caminho do arquivo não fornecido');
      }
      
      console.log('Obtendo URL pública para:', filePath);
      
      const { data, error } = await supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);
      
      if (error) {
        console.error('Erro ao obter URL pública:', error);
        throw error;
      }
      
      if (!data || !data.publicUrl) {
        console.error('URL pública não encontrada para:', filePath);
        throw new Error('URL pública não encontrada');
      }
      
      return data.publicUrl;
    } catch (err) {
      console.error('Exceção ao obter URL do arquivo:', err);
      throw err;
    }
  },
  
  // Excluir arquivo do storage
  async excluirArquivo(filePath) {
    await verificarAutenticacao();
    
    try {
      // Verifica se o caminho do arquivo está vazio ou indefinido
      if (!filePath) {
        console.warn('Tentativa de exclusão com caminho de arquivo vazio ou indefinido');
        return { success: true, message: 'Nenhum arquivo para excluir' };
      }
      
      console.log('Excluindo arquivo:', filePath);
      
      const { error } = await supabase.storage
        .from('documentos')
        .remove([filePath]);
      
      if (error) {
        console.error(`Erro ao excluir arquivo ${filePath}:`, error);
        throw error;
      }
      
      return { success: true, message: 'Arquivo excluído com sucesso' };
    } catch (err) {
      console.error(`Exceção ao excluir arquivo ${filePath}:`, err);
      throw err;
    }
  },
  
  // Upload de documento para cliente
  async uploadDocumentoCliente(documentoData) {
    await verificarAutenticacao();
    
    try {
      // Verificar se o ID do cliente está definido
      if (!documentoData.cliente_id) {
        throw new Error('ID do cliente não fornecido para upload de documento');
      }
      
      // Upload do arquivo
      let arquivo_url = null;
      if (documentoData.arquivo) {
        // Criar um nome de arquivo seguro (sem espaços ou caracteres especiais)
        const fileNameSafe = documentoData.arquivo.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-zA-Z0-9.]/g, '_');  // Substitui caracteres especiais por underscore
          
        const filename = `clientes/${documentoData.cliente_id}/${Date.now()}_${fileNameSafe}`;
        
        console.log('Enviando arquivo do cliente:', filename);
        arquivo_url = await this.uploadArquivo(documentoData.arquivo, filename);
      } else {
        throw new Error('Nenhum arquivo fornecido para upload');
      }
      
      // Salvar informações do documento
      const documento = {
        cliente_id: documentoData.cliente_id,
        tipo_documento_id: documentoData.tipo_documento_id,
        nome: documentoData.nome || documentoData.arquivo.name,
        data_validade: documentoData.data_validade,
        observacoes: documentoData.observacoes,
        arquivo_url: arquivo_url,
        created_at: new Date()
      };
      
      console.log('Salvando documento do cliente:', documento);
      
      const { data, error } = await supabase.from('documentos_cliente')
        .insert(documento)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao salvar documento do cliente:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Exceção ao fazer upload de documento do cliente:', err);
      throw err;
    }
  },
  
  // Upload de documento para licitação
  async uploadDocumentoLicitacao(documentoData) {
    await verificarAutenticacao();
    
    try {
      // Verificar se o ID da licitação está definido
      if (!documentoData.licitacao_id) {
        throw new Error('ID da licitação não fornecido para upload de documento');
      }
      
      // Upload do arquivo
      let arquivo_url = null;
      if (documentoData.arquivo) {
        // Criar um nome de arquivo seguro (sem espaços ou caracteres especiais)
        const fileNameSafe = documentoData.arquivo.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-zA-Z0-9.]/g, '_');  // Substitui caracteres especiais por underscore
          
        const filename = `licitacoes/${documentoData.licitacao_id}/${Date.now()}_${fileNameSafe}`;
        
        console.log('Enviando arquivo da licitação:', filename);
        arquivo_url = await this.uploadArquivo(documentoData.arquivo, filename);
      } else {
        throw new Error('Nenhum arquivo fornecido para upload');
      }
      
      // Salvar informações do documento
      const documento = {
        licitacao_id: documentoData.licitacao_id,
        tipo_documento_id: documentoData.tipo_documento_id,
        nome: documentoData.nome || documentoData.arquivo.name,
        data_validade: documentoData.data_validade,
        observacoes: documentoData.observacoes,
        arquivo_url: arquivo_url,
        created_at: new Date()
      };
      
      console.log('Salvando documento da licitação:', documento);
      
      const { data, error } = await supabase.from('documentos_licitacao')
        .insert(documento)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao salvar documento da licitação:', error);
        throw error;
      }
      
      // Verificar se é um edital e processar requisitos, se for
      const tipoDocumento = await this.obterTipoDocumento(documentoData.tipo_documento_id);
      const isEdital = tipoDocumento && tipoDocumento.nome.toLowerCase().includes('edital');
      
      if (isEdital) {
        try {
          console.log('Documento é um edital, processando requisitos...');
          
          // Primeiro tentar extrair texto do arquivo
          let textoEdital = '';
          
          // Verificar extensão do arquivo
          const extensao = documentoData.arquivo.name.split('.').pop().toLowerCase();
          
          if (extensao === 'pdf' || extensao === 'doc' || extensao === 'docx') {
            // Tentar extrair o texto do documento, mas se falhar, não impedir o cadastro
            try {
              // Para um cenário real, aqui precisaria de uma API de extração de texto
              // Como não temos isso no momento, vamos apenas simular o processo
              console.log('Tentando extrair texto do documento...');
              // Simulação de que não conseguimos extrair texto
              textoEdital = '';
            } catch (extractErr) {
              console.error('Erro ao extrair texto do documento:', extractErr);
              textoEdital = '';
            }
          }
          
          // Se não conseguiu extrair texto ou não é um formato suportado
          if (!textoEdital) {
            console.log('Não foi possível extrair texto do documento, criando requisitos padrão...');
            const { data: reqPadrao, error: errPadrao } = await this.criarRequisitosTestePara(documentoData.licitacao_id);
            
            if (errPadrao) {
              console.error('Erro ao criar requisitos padrão:', errPadrao);
              data.requisitos_extraidos = {
                sucesso: false,
                erro: 'Falha ao criar requisitos padrão',
                quantidade: 0
              };
            } else {
              data.requisitos_extraidos = {
                sucesso: true,
                mensagem: 'Requisitos padrão criados',
                quantidade: reqPadrao?.length || 0
              };
            }
          } else {
            // Processar o texto para extrair requisitos
            // Usar diretamente a função processar_requisitos_edital via RPC
            const { data: requisitosData, error: requisitosError } = await supabase
              .rpc('processar_requisitos_edital', {
                p_texto: textoEdital,
                p_licitacao_id: documentoData.licitacao_id
              });
            
            if (requisitosError) {
              console.error('Erro ao processar requisitos do edital:', requisitosError);
              
              // Se houve erro no processamento automático, criar requisitos padrão
              console.log('Criando requisitos padrão devido a falha no processamento...');
              const { data: reqPadrao, error: errPadrao } = await this.criarRequisitosTestePara(documentoData.licitacao_id);
              
              if (errPadrao) {
                console.error('Erro ao criar requisitos padrão:', errPadrao);
                data.requisitos_extraidos = {
                  sucesso: false,
                  erro: 'Falha ao processar requisitos e criar padrões',
                  quantidade: 0
                };
              } else {
                data.requisitos_extraidos = {
                  sucesso: true,
                  mensagem: 'Requisitos padrão criados após falha na extração',
                  quantidade: reqPadrao?.length || 0
                };
              }
            } else {
              // Requisitos processados com sucesso
              // Verificar quantos requisitos foram extraídos
              const { count: quantidadeRequisitos, error: countError } = await supabase
                .from('requisitos_documentacao')
                .select('id', { count: 'exact' })
                .eq('licitacao_id', documentoData.licitacao_id);
              
              if (countError) {
                console.error('Erro ao contar requisitos:', countError);
                data.requisitos_extraidos = {
                  sucesso: true,
                  mensagem: 'Requisitos processados, mas não foi possível contar',
                  quantidade: 0
                };
              } else if (quantidadeRequisitos === 0) {
                // Se não encontrou requisitos, criar padrões
                console.log('Nenhum requisito extraído, criando requisitos padrão...');
                const { data: reqPadrao, error: errPadrao } = await this.criarRequisitosTestePara(documentoData.licitacao_id);
                
                if (errPadrao) {
                  console.error('Erro ao criar requisitos padrão:', errPadrao);
                  data.requisitos_extraidos = {
                    sucesso: false,
                    erro: 'Falha ao criar requisitos padrão',
                    quantidade: 0
                  };
                } else {
                  data.requisitos_extraidos = {
                    sucesso: true,
                    mensagem: 'Requisitos padrão criados',
                    quantidade: reqPadrao?.length || 0
                  };
                }
              } else {
                data.requisitos_extraidos = {
                  sucesso: true,
                  mensagem: 'Requisitos extraídos com sucesso',
                  quantidade: quantidadeRequisitos
                };
              }
            }
          }
        } catch (reqErr) {
          console.error('Exceção ao processar requisitos:', reqErr);
          
          // Em caso de erro, criar requisitos padrão
          console.log('Criando requisitos padrão devido a exceção no processamento...');
          try {
            const { data: reqPadrao, error: errPadrao } = await this.criarRequisitosTestePara(documentoData.licitacao_id);
            
            if (errPadrao) {
              console.error('Erro ao criar requisitos padrão:', errPadrao);
              data.requisitos_extraidos = {
                sucesso: false,
                erro: 'Falha ao processar requisitos e criar padrões',
                quantidade: 0
              };
            } else {
              data.requisitos_extraidos = {
                sucesso: true,
                mensagem: 'Requisitos padrão criados após exceção',
                quantidade: reqPadrao?.length || 0
              };
            }
          } catch (finalErr) {
            data.requisitos_extraidos = {
              sucesso: false,
              erro: 'Falha completa no processamento de requisitos',
              quantidade: 0
            };
          }
        }
      }
      
      return data;
    } catch (err) {
      console.error('Exceção ao fazer upload de documento da licitação:', err);
      throw err;
    }
  },
  
  // Excluir documento do cliente
  async excluirDocumentoCliente(id, arquivoUrl) {
    await verificarAutenticacao();
    
    try {
      // Excluir o registro no banco de dados
      const { error } = await supabase.from('documentos_cliente')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erro ao excluir documento do cliente ${id}:`, error);
        throw error;
      }
      
      // Excluir o arquivo do storage se existir
      if (arquivoUrl) {
        await this.excluirArquivo(arquivoUrl);
      }
      
      return { success: true, message: 'Documento excluído com sucesso' };
    } catch (err) {
      console.error(`Exceção ao excluir documento do cliente ${id}:`, err);
      throw err;
    }
  },
  
  // Excluir documento da licitação
  async excluirDocumentoLicitacao(id, arquivoUrl, tipoDocumento) {
    await verificarAutenticacao();
    
    try {
      console.log('Iniciando exclusão de documento da licitação:', { id, arquivoUrl, tipoDocumento });

      // Verificar se é um edital
      const isEdital = tipoDocumento && 
                      (typeof tipoDocumento === 'string' ? 
                        tipoDocumento.toLowerCase().includes('edital') : 
                        tipoDocumento.nome?.toLowerCase().includes('edital'));
      
      console.log('Documento é edital?', isEdital);

      // Obter o licitacao_id antes de excluir o documento
      let licitacaoId = null;
      if (isEdital) {
        const { data: documento, error: docError } = await supabase.from('documentos_licitacao')
          .select('licitacao_id')
          .eq('id', id)
          .single();
        
        if (docError) {
          console.error(`Erro ao obter licitacao_id do documento ${id}:`, docError);
        } else if (documento) {
          licitacaoId = documento.licitacao_id;
          console.log(`Licitacao_id obtido para exclusão de requisitos: ${licitacaoId}`);
        }
      }
      
      // Se for um edital e temos licitacaoId, excluir os requisitos ANTES de excluir o documento
      if (isEdital && licitacaoId) {
        console.log(`Excluindo requisitos da licitação ${licitacaoId} porque o edital será excluído`);
        try {
          const { error: reqError } = await supabase.from('requisitos_documentacao')
            .delete()
            .eq('licitacao_id', licitacaoId);
          
          if (reqError) {
            console.error(`Erro ao excluir requisitos da licitação ${licitacaoId}:`, reqError);
            // Não falhar a operação principal se a exclusão de requisitos falhar
          } else {
            console.log(`Requisitos da licitação ${licitacaoId} excluídos com sucesso`);
          }
        } catch (reqErr) {
          console.error(`Exceção ao excluir requisitos da licitação ${licitacaoId}:`, reqErr);
          // Continue com a exclusão do documento mesmo se a exclusão de requisitos falhar
        }
      }
      
      // Excluir o registro no banco de dados
      const { error } = await supabase.from('documentos_licitacao')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erro ao excluir documento da licitação ${id}:`, error);
        throw error;
      }
      
      // Excluir o arquivo do storage se existir
      if (arquivoUrl) {
        await this.excluirArquivo(arquivoUrl);
      }
      
      // Verificação final para confirmar a exclusão dos requisitos
      if (isEdital && licitacaoId) {
        const { count, error: countError } = await supabase
          .from('requisitos_documentacao')
          .select('*', { count: 'exact' })
          .eq('licitacao_id', licitacaoId);
        
        if (countError) {
          console.error(`Erro ao verificar exclusão dos requisitos da licitação ${licitacaoId}:`, countError);
        } else {
          console.log(`Verificação final: ${count} requisitos restantes para a licitação ${licitacaoId}`);
          if (count > 0) {
            console.warn(`Ainda existem ${count} requisitos que não foram excluídos. Tentando excluir novamente...`);
            
            const { error: finalDeleteError } = await supabase.from('requisitos_documentacao')
              .delete()
              .eq('licitacao_id', licitacaoId);
            
            if (finalDeleteError) {
              console.error(`Erro na tentativa final de excluir requisitos:`, finalDeleteError);
            } else {
              console.log(`Exclusão final bem-sucedida. Todos os requisitos foram removidos.`);
            }
          }
        }
      }
      
      return { success: true, message: 'Documento excluído com sucesso' };
    } catch (err) {
      console.error(`Exceção ao excluir documento da licitação ${id}:`, err);
      throw err;
    }
  },
  
  // Obter tipo de documento
  async obterTipoDocumento(tipoDocumentoId) {
    try {
      const { data, error } = await supabase.from('tipos_documentos')
        .select('*')
        .eq('id', tipoDocumentoId)
        .single();
      
      if (error) {
        console.error('Erro ao obter tipo de documento:', error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Exceção ao obter tipo de documento:', err);
      return null;
    }
  }
};

export default documentoService; 