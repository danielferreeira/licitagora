const Documento = require('../models/Documento');
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tipo = req.body.tipo || 'cliente';
    const dir = path.join(__dirname, '..', '..', 'uploads', tipo);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido.'));
    }
  }
});

// Função para extrair requisitos do edital
async function extrairRequisitosEdital(caminhoArquivo) {
  try {
    const dataBuffer = fs.readFileSync(caminhoArquivo);
    const data = await pdf(dataBuffer);
    const texto = data.text.toLowerCase();

    // Padrões comuns para identificar requisitos de documentação em editais
    const padroes = [
      {
        regex: /habilitação jurídica:([^.]*\.)/g,
        tipo: 'Habilitação Jurídica'
      },
      {
        regex: /qualificação técnica:([^.]*\.)/g,
        tipo: 'Qualificação Técnica'
      },
      {
        regex: /qualificação econômico-financeira:([^.]*\.)/g,
        tipo: 'Qualificação Econômico-Financeira'
      },
      {
        regex: /regularidade fiscal e trabalhista:([^.]*\.)/g,
        tipo: 'Regularidade Fiscal e Trabalhista'
      }
    ];

    const requisitos = [];
    
    padroes.forEach(padrao => {
      let match;
      while ((match = padrao.regex.exec(texto)) !== null) {
        const descricao = match[1].trim();
        if (descricao) {
          requisitos.push({
            tipo: padrao.tipo,
            descricao: descricao
          });
        }
      }
    });

    // Busca por menções específicas a documentos
    const documentosComuns = [
      'contrato social',
      'certidão negativa',
      'balanço patrimonial',
      'atestado de capacidade',
      'alvará',
      'procuração',
      'declaração',
      'certificado'
    ];

    documentosComuns.forEach(doc => {
      const regex = new RegExp(`${doc}[^.]*\\.`, 'gi');
      let match;
      while ((match = regex.exec(texto)) !== null) {
        requisitos.push({
          tipo: 'Documento Específico',
          descricao: match[0].trim()
        });
      }
    });

    return requisitos;
  } catch (error) {
    console.error('Erro ao extrair requisitos do edital:', error);
    throw error;
  }
}

class DocumentoController {
  // Documentos do Cliente
  async listarTiposDocumentosCliente(req, res) {
    try {
      const tipos = await Documento.listarTiposDocumentosCliente();
      res.json(tipos);
    } catch (error) {
      console.error('Erro ao listar tipos de documentos:', error);
      res.status(500).json({ error: 'Erro ao listar tipos de documentos' });
    }
  }

  async listarDocumentosCliente(req, res) {
    try {
      const { clienteId } = req.params;
      const documentos = await Documento.listarDocumentosCliente(clienteId);
      res.json(documentos);
    } catch (error) {
      console.error('Erro ao listar documentos do cliente:', error);
      res.status(500).json({ error: 'Erro ao listar documentos do cliente' });
    }
  }

  async uploadDocumentoCliente(req, res) {
    const uploadMiddleware = upload.single('arquivo');

    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      try {
        const { clienteId, tipoDocumentoId, dataValidade, observacoes } = req.body;
        const arquivo = req.file;

        if (!arquivo) {
          return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const documento = await Documento.salvarDocumentoCliente({
          cliente_id: clienteId,
          tipo_documento_id: tipoDocumentoId,
          nome_arquivo: arquivo.originalname,
          caminho_arquivo: arquivo.path,
          data_validade: dataValidade,
          observacoes
        });

        res.status(201).json(documento);
      } catch (error) {
        console.error('Erro ao fazer upload do documento:', error);
        res.status(500).json({ error: 'Erro ao fazer upload do documento' });
      }
    });
  }

  async excluirDocumentoCliente(req, res) {
    try {
      const { id } = req.params;
      const documento = await Documento.excluirDocumentoCliente(id);
      
      if (!documento) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }

      // Remover arquivo físico
      if (fs.existsSync(documento.caminho_arquivo)) {
        fs.unlinkSync(documento.caminho_arquivo);
      }

      res.json({ message: 'Documento excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      res.status(500).json({ error: 'Erro ao excluir documento' });
    }
  }

  // Documentos da Licitação
  async listarDocumentosLicitacao(req, res) {
    try {
      const { licitacaoId } = req.params;
      const documentos = await Documento.listarDocumentosLicitacao(licitacaoId);
      res.json(documentos);
    } catch (error) {
      console.error('Erro ao listar documentos da licitação:', error);
      res.status(500).json({ error: 'Erro ao listar documentos da licitação' });
    }
  }

  async uploadDocumentoLicitacao(req, res) {
    const uploadMiddleware = upload.single('arquivo');

    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      try {
        const { licitacaoId, nome, tipo, observacoes } = req.body;
        const arquivo = req.file;

        if (!arquivo) {
          return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const documento = await Documento.salvarDocumentoLicitacao({
          licitacao_id: licitacaoId,
          nome,
          tipo,
          nome_arquivo: arquivo.originalname,
          caminho_arquivo: arquivo.path,
          observacoes
        });

        // Se for um edital, extrair requisitos
        if (tipo === 'EDITAL' && arquivo.mimetype === 'application/pdf') {
          try {
            const requisitos = await extrairRequisitosEdital(arquivo.path);
            for (const requisito of requisitos) {
              await Documento.salvarRequisitosDocumentacao({
                licitacao_id: licitacaoId,
                descricao: requisito.descricao,
                atendido: false,
                observacoes: `Tipo: ${requisito.tipo}`
              });
            }
          } catch (error) {
            console.error('Erro ao extrair requisitos do edital:', error);
          }
        }

        res.status(201).json(documento);
      } catch (error) {
        console.error('Erro ao fazer upload do documento:', error);
        
        // Se for erro de validação de EDITAL duplicado
        if (error.message.includes('Já existe um documento do tipo EDITAL')) {
          return res.status(400).json({ error: error.message });
        }

        // Remover o arquivo se houver erro
        if (req.file) {
          const caminhoCompleto = path.join(__dirname, '..', '..', req.file.path);
          if (fs.existsSync(caminhoCompleto)) {
            fs.unlinkSync(caminhoCompleto);
          }
        }

        res.status(500).json({ error: 'Erro ao fazer upload do documento' });
      }
    });
  }

  async excluirDocumentoLicitacao(req, res) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Primeiro, buscar informações do documento
      const docQuery = 'SELECT * FROM documentos_licitacao WHERE id = $1';
      const docResult = await client.query(docQuery, [req.params.id]);
      
      if (docResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Documento não encontrado' });
      }

      const documento = docResult.rows[0];
      console.log('Excluindo documento:', documento);

      // Se for um EDITAL, remover os requisitos associados à licitação
      if (documento.tipo === 'EDITAL') {
        console.log('Documento é do tipo EDITAL, removendo requisitos para licitação:', documento.licitacao_id);
        
        // Primeiro verificar se existem requisitos
        const checkReqQuery = 'SELECT COUNT(*) FROM requisitos_documentacao WHERE licitacao_id = $1';
        const reqCount = await client.query(checkReqQuery, [documento.licitacao_id]);
        console.log('Quantidade de requisitos encontrados:', reqCount.rows[0].count);

        // Remover os requisitos
        const deleteReqQuery = 'DELETE FROM requisitos_documentacao WHERE licitacao_id = $1';
        const deleteReqResult = await client.query(deleteReqQuery, [documento.licitacao_id]);
        console.log('Requisitos removidos:', deleteReqResult.rowCount);
      }

      // Remover o documento
      const deleteDocQuery = 'DELETE FROM documentos_licitacao WHERE id = $1 RETURNING *';
      const deleteResult = await client.query(deleteDocQuery, [req.params.id]);
      console.log('Documento removido:', deleteResult.rows[0]);

      // Remover o arquivo físico
      if (documento.caminho_arquivo) {
        const caminhoCompleto = path.join(__dirname, '..', '..', documento.caminho_arquivo);
        if (fs.existsSync(caminhoCompleto)) {
          fs.unlinkSync(caminhoCompleto);
          console.log('Arquivo físico removido:', caminhoCompleto);
        }
      }

      await client.query('COMMIT');
      res.json({ 
        message: 'Documento excluído com sucesso',
        tipo: documento.tipo,
        requisitosRemovidos: documento.tipo === 'EDITAL' ? true : false
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao excluir documento:', error);
      res.status(500).json({ error: 'Erro ao excluir documento' });
    } finally {
      client.release();
    }
  }

  // Requisitos de Documentação
  async listarRequisitosDocumentacao(req, res) {
    try {
      const { licitacaoId } = req.params;
      const requisitos = await Documento.listarRequisitosDocumentacao(licitacaoId);
      res.json(requisitos);
    } catch (error) {
      console.error('Erro ao listar requisitos de documentação:', error);
      res.status(500).json({ error: 'Erro ao listar requisitos de documentação' });
    }
  }

  async criarRequisitoDocumentacao(req, res) {
    try {
      const { licitacaoId } = req.params;
      const { descricao, observacoes, atendido } = req.body;

      if (!descricao) {
        return res.status(400).json({ error: 'A descrição é obrigatória' });
      }

      const requisito = await Documento.salvarRequisitosDocumentacao({
        licitacao_id: licitacaoId,
        descricao,
        observacoes,
        atendido: atendido || false
      });

      res.status(201).json(requisito);
    } catch (error) {
      console.error('Erro ao criar requisito:', error);
      res.status(500).json({ error: 'Erro ao criar requisito' });
    }
  }

  async atualizarRequisitoDocumentacao(req, res) {
    try {
      const { id } = req.params;
      const { descricao, atendido, documento_id, observacoes } = req.body;

      if (!descricao) {
        return res.status(400).json({ error: 'A descrição é obrigatória' });
      }

      const requisito = await Documento.atualizarRequisitoDocumentacao(id, {
        descricao,
        atendido,
        documento_id,
        observacoes
      });

      if (!requisito) {
        return res.status(404).json({ error: 'Requisito não encontrado' });
      }

      res.json(requisito);
    } catch (error) {
      console.error('Erro ao atualizar requisito:', error);
      res.status(500).json({ error: 'Erro ao atualizar requisito' });
    }
  }

  async excluirRequisitoDocumentacao(req, res) {
    try {
      const { id } = req.params;
      const requisito = await Documento.excluirRequisitoDocumentacao(id);
      
      if (!requisito) {
        return res.status(404).json({ error: 'Requisito não encontrado' });
      }

      res.json({ message: 'Requisito excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir requisito:', error);
      res.status(500).json({ error: 'Erro ao excluir requisito' });
    }
  }
}

module.exports = new DocumentoController(); 