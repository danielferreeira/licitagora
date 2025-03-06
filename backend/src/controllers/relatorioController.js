const Licitacao = require('../models/Licitacao');
const Cliente = require('../models/Cliente');
const { Op } = require('sequelize');
const { format, parseISO } = require('date-fns');
const ptBR = require('date-fns/locale/pt-BR');
const { sequelize } = require('../config/database');

const formatarData = (data) => {
  if (!data) return null;
  try {
    return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return null;
  }
};

const formatarValor = (valor) => {
  if (!valor) return 0;
  try {
    return parseFloat(valor) || 0;
  } catch (error) {
    console.error('Erro ao formatar valor:', error);
    return 0;
  }
};

class RelatorioController {
  async gerarRelatorioLicitacoes(req, res) {
    try {
      console.log('Iniciando geração de relatório de licitações');
      console.log('Parâmetros recebidos:', req.query);
      
      const { dataInicio, dataFim, status, cliente_id } = req.query;
      const where = {};
      
      if (dataInicio && dataFim) {
        where.data_abertura = {
          [Op.between]: [
            new Date(dataInicio),
            new Date(dataFim)
          ]
        };
      }
      
      if (status) {
        where.status = status;
      }
      
      if (cliente_id) {
        where.cliente_id = cliente_id;
      }

      console.log('Condições de busca:', where);

      const licitacoes = await Licitacao.findAll({
        where,
        include: [{
          model: Cliente,
          as: 'cliente',
          attributes: ['razao_social', 'cnpj'],
          required: false
        }],
        order: [['data_abertura', 'DESC']],
        raw: true,
        nest: true
      });

      console.log(`Encontradas ${licitacoes.length} licitações`);

      const relatorio = {
        totalLicitacoes: licitacoes.length,
        licitacoesGanhas: licitacoes.filter(l => l.foi_ganha === true).length,
        licitacoesPerdidas: licitacoes.filter(l => l.foi_ganha === false).length,
        licitacoesEmAndamento: licitacoes.filter(l => l.status === 'Em Andamento').length,
        valorTotalGanho: licitacoes
          .filter(l => l.foi_ganha === true)
          .reduce((total, l) => total + formatarValor(l.valor_final), 0),
        lucroTotal: licitacoes
          .filter(l => l.foi_ganha === true)
          .reduce((total, l) => total + formatarValor(l.lucro_final), 0),
        detalhes: licitacoes.map(l => ({
          id: l.id,
          numero: l.numero,
          cliente: l.cliente ? {
            razao_social: l.cliente.razao_social,
            cnpj: l.cliente.cnpj
          } : null,
          orgao: l.orgao,
          status: l.status,
          data_abertura: formatarData(l.data_abertura),
          valor_estimado: formatarValor(l.valor_estimado),
          valor_final: formatarValor(l.valor_final),
          lucro_estimado: formatarValor(l.lucro_estimado),
          lucro_final: formatarValor(l.lucro_final),
          foi_ganha: l.foi_ganha
        }))
      };

      console.log('Relatório gerado com sucesso');
      res.json(relatorio);
    } catch (error) {
      console.error('Erro detalhado ao gerar relatório de licitações:', error);
      res.status(500).json({ 
        error: 'Erro ao gerar relatório de licitações',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  async gerarRelatorioClientes(req, res) {
    try {
      console.log('Iniciando geração de relatório de clientes');
      
      const clientes = await Cliente.findAll({
        include: [{
          model: Licitacao,
          as: 'licitacoes',
          required: false
        }],
        raw: true,
        nest: true
      });

      console.log(`Encontrados ${clientes.length} clientes`);

      const relatorio = {
        totalClientes: clientes.length,
        clientesAtivos: clientes.filter(c => {
          const licitacoes = Array.isArray(c.licitacoes) ? c.licitacoes : [c.licitacoes].filter(Boolean);
          return licitacoes.some(l => l && l.status === 'Em Andamento');
        }).length,
        detalhes: clientes.map(c => {
          const licitacoes = Array.isArray(c.licitacoes) ? c.licitacoes : [c.licitacoes].filter(Boolean);
          return {
            id: c.id,
            razao_social: c.razao_social,
            cnpj: c.cnpj,
            totalLicitacoes: licitacoes.length,
            licitacoesGanhas: licitacoes.filter(l => l && l.foi_ganha === true).length,
            licitacoesEmAndamento: licitacoes.filter(l => l && l.status === 'Em Andamento').length,
            valorTotalGanho: licitacoes
              .filter(l => l && l.foi_ganha === true)
              .reduce((total, l) => total + formatarValor(l.valor_final), 0),
            lucroTotal: licitacoes
              .filter(l => l && l.foi_ganha === true)
              .reduce((total, l) => total + formatarValor(l.lucro_final), 0)
          };
        })
      };

      console.log('Relatório de clientes gerado com sucesso');
      res.json(relatorio);
    } catch (error) {
      console.error('Erro detalhado ao gerar relatório de clientes:', error);
      res.status(500).json({ 
        error: 'Erro ao gerar relatório de clientes',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  async gerarRelatorioDesempenho(req, res) {
    try {
      console.log('Iniciando geração de relatório de desempenho');
      console.log('Período recebido:', req.query.periodo);
      
      const { periodo } = req.query;
      const hoje = new Date();
      let dataInicio;

      switch (periodo) {
        case 'trimestral':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
          break;
        case 'anual':
          dataInicio = new Date(hoje.getFullYear(), 0, 1);
          break;
        default: // mensal
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      }

      console.log('Período de busca:', { inicio: dataInicio, fim: hoje });

      const licitacoes = await Licitacao.findAll({
        where: {
          data_fechamento: {
            [Op.between]: [dataInicio, hoje]
          },
          status: 'Finalizada'
        },
        raw: true
      });

      console.log(`Encontradas ${licitacoes.length} licitações finalizadas no período`);

      const relatorio = {
        periodo: {
          inicio: formatarData(dataInicio),
          fim: formatarData(hoje)
        },
        totalLicitacoes: licitacoes.length,
        taxaSucesso: licitacoes.length > 0 
          ? (licitacoes.filter(l => l.foi_ganha === true).length / licitacoes.length * 100).toFixed(2)
          : 0,
        valorTotalGanho: licitacoes
          .filter(l => l.foi_ganha === true)
          .reduce((total, l) => total + formatarValor(l.valor_final), 0),
        lucroTotal: licitacoes
          .filter(l => l.foi_ganha === true)
          .reduce((total, l) => total + formatarValor(l.lucro_final), 0),
        mediaPrazoFechamento: licitacoes.length > 0
          ? licitacoes.reduce((total, l) => {
              if (!l.data_abertura || !l.data_fechamento) return total;
              const abertura = new Date(l.data_abertura);
              const fechamento = new Date(l.data_fechamento);
              return total + Math.max(0, (fechamento - abertura) / (1000 * 60 * 60 * 24));
            }, 0) / licitacoes.length
          : 0,
        principaisMotivosPerda: licitacoes
          .filter(l => l.foi_ganha === false && l.motivo_perda)
          .reduce((acc, l) => {
            acc[l.motivo_perda] = (acc[l.motivo_perda] || 0) + 1;
            return acc;
          }, {})
      };

      console.log('Relatório de desempenho gerado com sucesso');
      res.json(relatorio);
    } catch (error) {
      console.error('Erro detalhado ao gerar relatório de desempenho:', error);
      res.status(500).json({ 
        error: 'Erro ao gerar relatório de desempenho',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = new RelatorioController(); 