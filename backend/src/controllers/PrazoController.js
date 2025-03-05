const { Op } = require('sequelize');
const Prazo = require('../models/Prazo');
const Licitacao = require('../models/Licitacao');
const sequelize = require('sequelize');
const { format } = require('date-fns');

class PrazoController {
  constructor() {
    // Bind dos métodos para manter o contexto
    this.index = this.index.bind(this);
    this.store = this.store.bind(this);
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
    this.sincronizarPrazos = this.sincronizarPrazos.bind(this);
    this.importarPrazos = this.importarPrazos.bind(this);
  }

  async importarPrazos(req, res) {
    try {
      await this.sincronizarPrazos();
      return res.json({ message: 'Prazos importados com sucesso' });
    } catch (error) {
      console.error('Erro ao importar prazos:', error);
      return res.status(500).json({ error: 'Erro ao importar prazos' });
    }
  }

  async index(req, res) {
    try {
      console.log('Buscando prazos...');
      
      // Buscar todos os prazos ordenados por data
      const prazos = await Prazo.findAll({
        include: [{
          model: Licitacao,
          as: 'licitacao',
          attributes: ['id', 'numero', 'orgao', 'data_fim', 'status', 'objeto', 'foi_ganha'],
          where: {
            data_fim: { [Op.not]: null }
          }
        }],
        order: [[{ model: Licitacao, as: 'licitacao' }, 'data_fim', 'ASC']],
      });

      console.log(`Encontrados ${prazos.length} prazos`);

      // Formatar a resposta para incluir informações da licitação de forma mais acessível
      const prazosFormatados = prazos.map(prazo => {
        const dataFim = prazo.licitacao ? new Date(prazo.licitacao.data_fim) : null;
        console.log('Processando prazo:', {
          licitacao: prazo.licitacao ? prazo.licitacao.numero : null,
          data_fim_original: prazo.licitacao ? prazo.licitacao.data_fim : null,
          data_fim_formatada: dataFim ? format(dataFim, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'') : null
        });

        return {
          id: prazo.id,
          titulo: prazo.titulo,
          data_prazo: prazo.data_prazo,
          observacoes: prazo.observacoes,
          licitacao_id: prazo.licitacao_id,
          licitacao_numero: prazo.licitacao ? prazo.licitacao.numero : null,
          licitacao_orgao: prazo.licitacao ? prazo.licitacao.orgao : null,
          licitacao_objeto: prazo.licitacao ? prazo.licitacao.objeto : null,
          licitacao_status: prazo.licitacao ? prazo.licitacao.status : null,
          licitacao_data_fim: dataFim ? format(dataFim, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'') : null,
          licitacao_foi_ganha: prazo.licitacao ? prazo.licitacao.foi_ganha : null,
          created_at: prazo.created_at,
          updated_at: prazo.updated_at
        };
      });

      console.log('Enviando resposta com prazos formatados');
      return res.json(prazosFormatados);
    } catch (error) {
      console.error('Erro ao listar prazos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async sincronizarPrazos() {
    try {
      console.log('Iniciando sincronização de prazos...');

      // 1. Buscar todas as licitações ativas com data_fim
      const licitacoes = await Licitacao.findAll({
        where: {
          data_fim: { [Op.not]: null }
        },
        attributes: ['id', 'numero', 'orgao', 'data_fim', 'status', 'objeto'],
        raw: true
      });

      console.log(`Encontradas ${licitacoes.length} licitações`);
      
      // 2. Para cada licitação, criar ou atualizar o prazo
      for (const licitacao of licitacoes) {
        try {
          console.log('\nProcessando licitação:', {
            numero: licitacao.numero,
            data_fim: licitacao.data_fim,
            status: licitacao.status
          });

          // Verificar e formatar a data
          if (!licitacao.data_fim) {
            console.log(`Licitação ${licitacao.numero} não tem data_fim`);
            continue;
          }

          // Criar data a partir do timestamp
          const dataFim = new Date(licitacao.data_fim);
          
          if (isNaN(dataFim.getTime())) {
            console.error(`Data inválida para licitação ${licitacao.numero}:`, licitacao.data_fim);
            continue;
          }

          // Formatar a data para meia-noite do dia
          const dataFormatada = format(dataFim, 'yyyy-MM-dd');

          // Criar título e observações
          const titulo = `Licitação ${licitacao.numero}`;
          const observacoes = `Órgão: ${licitacao.orgao}\nObjeto: ${licitacao.objeto || 'Não informado'}\nStatus: ${licitacao.status}`;

          // Buscar prazo existente
          const prazoExistente = await Prazo.findOne({
            where: { licitacao_id: licitacao.id }
          });

          if (prazoExistente) {
            // Atualizar prazo existente
            await prazoExistente.update({
              titulo,
              data_prazo: dataFormatada,
              observacoes
            });
            console.log(`Atualizado prazo para licitação ${licitacao.numero} com data ${dataFormatada}`);
          } else {
            // Criar novo prazo
            await Prazo.create({
              titulo,
              data_prazo: dataFormatada,
              observacoes,
              licitacao_id: licitacao.id
            });
            console.log(`Criado prazo para licitação ${licitacao.numero} com data ${dataFormatada}`);
          }
        } catch (err) {
          console.error(`Erro ao processar licitação ${licitacao.numero}:`, err);
        }
      }

      console.log('\nSincronização concluída com sucesso');
      return true;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  }

  async store(req, res) {
    try {
      const { titulo, data_prazo, observacoes, licitacao_id } = req.body;

      if (!titulo || !data_prazo) {
        return res.status(400).json({ error: 'Título e data são obrigatórios' });
      }

      // Verificar se a licitação existe
      if (licitacao_id) {
        const licitacao = await Licitacao.findByPk(licitacao_id);
        if (!licitacao) {
          return res.status(400).json({ error: 'Licitação não encontrada' });
        }
      }

      // Converter a data para o formato do PostgreSQL
      const dataPrazoFormatada = new Date(data_prazo);
      if (isNaN(dataPrazoFormatada.getTime())) {
        return res.status(400).json({ error: 'Data inválida' });
      }

      const prazo = await Prazo.create({
        titulo,
        data_prazo: dataPrazoFormatada,
        observacoes,
        licitacao_id,
      });

      // Buscar o prazo com as informações da licitação
      const prazoComLicitacao = await Prazo.findByPk(prazo.id, {
        include: [{
          model: Licitacao,
          as: 'licitacao',
          attributes: ['numero', 'orgao', 'data_fim'],
        }],
      });

      return res.status(201).json(prazoComLicitacao);
    } catch (error) {
      console.error('Erro ao criar prazo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { titulo, data_prazo, observacoes, licitacao_id } = req.body;

      // Verificar se o prazo existe
      const prazo = await Prazo.findByPk(id);
      if (!prazo) {
        return res.status(404).json({ error: 'Prazo não encontrado' });
      }

      // Verificar se a licitação existe
      if (licitacao_id) {
        const licitacao = await Licitacao.findByPk(licitacao_id);
        if (!licitacao) {
          return res.status(400).json({ error: 'Licitação não encontrada' });
        }
      }

      // Converter a data para o formato do PostgreSQL
      const dataPrazoFormatada = new Date(data_prazo);
      if (isNaN(dataPrazoFormatada.getTime())) {
        return res.status(400).json({ error: 'Data inválida' });
      }

      await prazo.update({
        titulo,
        data_prazo: dataPrazoFormatada,
        observacoes,
        licitacao_id,
      });

      // Buscar o prazo atualizado com as informações da licitação
      const prazoAtualizado = await Prazo.findByPk(id, {
        include: [{
          model: Licitacao,
          as: 'licitacao',
          attributes: ['numero', 'orgao', 'data_fim'],
        }],
      });

      return res.json(prazoAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar prazo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      const prazo = await Prazo.findByPk(id);
      if (!prazo) {
        return res.status(404).json({ error: 'Prazo não encontrado' });
      }

      await prazo.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir prazo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
    }
  }
}

module.exports = new PrazoController(); 